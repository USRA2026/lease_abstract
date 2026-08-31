# Deploying to Azure

This provisions everything the app needs beyond the code itself:

| Resource | Purpose |
|---|---|
| App Service (Linux, Node 20) | Runs the Next.js app |
| Azure Database for PostgreSQL Flexible Server | Abstract/template/citation data |
| Storage Account (Blob) | Source PDF documents |
| Azure OpenAI (`gpt-4o` deployment) | AI abstraction extraction + Ask AI chat |
| Azure AI Document Intelligence *(optional)* | Layout/OCR with bounding boxes for uploaded PDFs |
| Key Vault | DB connection string, storage key, OpenAI/Anthropic key |
| Log Analytics + Application Insights | Logs/metrics |

The app itself never has direct knowledge it's "on Azure" — it only reads
`STORAGE_DRIVER`, `AI_PROVIDER`, `DATABASE_URL`, and the `AZURE_*`/`ANTHROPIC_*`
env vars (see `.env.example`). Locally those default to `local`/`mock` with
zero external dependencies; this deployment flips them to the Azure-backed
(or Claude-backed) implementations.

**Using Claude instead of Azure OpenAI:** the app supports the Claude API
(Anthropic) as an alternative AI provider (`lib/ai/anthropic.ts`) — it uses
structured outputs so extraction/chat responses are schema-validated rather
than parsed out of free text. Azure OpenAI's chat *model deployment* is the
most quota-restricted resource in this whole template (region VM quota,
model-version retirement, deployment-SKU compatibility, and
tokens-per-minute quota are four independent ways it can fail) — if you hit
any of those and don't want to fight it, skip that one resource entirely
and run on Claude instead:

```bash
az deployment group create \
  --resource-group rg-lease-abstract \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json \
  --parameters deployOpenAiChatModel=false aiProvider=claude anthropicApiKey=<your-sk-ant-key> anthropicModel=claude-opus-5
```

`deployOpenAiChatModel=false` skips only the model deployment sub-resource
(the one that hits quota); the Azure OpenAI *account* is still created
either way since it needs no quota and Document Intelligence uses the same
resource pattern. That stores the Anthropic key in Key Vault (never in an
app setting or source control) and sets `AI_PROVIDER=claude`. Get a key
from [console.anthropic.com](https://console.anthropic.com/settings/keys).
You can flip `AI_PROVIDER` back to `azure` any time (and set
`deployOpenAiChatModel=true` on a later deployment) — both providers can be
configured side by side.

## Prerequisites

- Azure CLI (`az`), logged in (`az login`) with a subscription selected.
- Access to Azure OpenAI in your subscription/region (it's approval-gated;
  request access before deploying if you haven't already).
- Bicep (bundled with recent `az` — `az bicep install` if needed).

## 1. Provision infrastructure

```bash
az group create --name rg-lease-abstract --location eastus2

cp infra/main.parameters.example.json infra/main.parameters.json
# edit infra/main.parameters.json: set a strong postgresAdminPassword
```

Azure OpenAI model versions are retired on a rolling basis, so there's no
safe value to hardcode for `openAiChatModelVersion` — look up what's
currently available for your subscription/region before deploying. If the
Azure OpenAI account already exists from a previous attempt (the Bicep
template creates it before the model deployment, so a failed deploy often
still leaves it behind), query it directly:

```bash
az cognitiveservices account list --resource-group rg-lease-abstract \
  --query "[?kind=='OpenAI'].name" -o tsv
az cognitiveservices account list-models --name <that-name> \
  --resource-group rg-lease-abstract -o table
```

If no account exists yet, create the resource group and run the deployment
once (it'll fail on the model step, same as above, but the account will
exist afterward for you to query), or check the Azure AI Foundry model
catalog in the portal for your region instead.

Pick a `gpt-4o` (or current equivalent) row that isn't past its retirement
date, then set it in `infra/main.parameters.json` (`openAiChatModelVersion`)
or pass it inline below. The template also sets `versionUpgradeOption:
OnceNewDefaultVersionAvailable` so once deployed, it self-upgrades instead
of hard-failing like this again.

```bash
az bicep build --file infra/main.bicep   # lint/validate first

az deployment group create \
  --resource-group rg-lease-abstract \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json \
  --parameters openAiChatModelVersion=<version-from-above>
```

Capture the outputs (`webAppName`, `postgresServerFqdn`, `storageAccountName`, ...) — you'll need `webAppName` below.

`infra/main.parameters.json` contains a real password if you fill it in locally; it's already covered by `.gitignore`-style handling (don't commit it — keep using the `.example.json` in source control).

## 2. Deploy the application code

The app builds with Next.js `output: "standalone"` (see `next.config.mjs`),
which produces `.next/standalone/` — a self-contained server (`server.js`)
with a *pruned* `node_modules` (only the ~40 MB actually needed at runtime,
including the correct Prisma query engine), rather than the full 500 MB+
dependency tree. Deploy that assembled folder, not the raw source:

```bash
# 1. Build (must be a real production build — see the NODE_ENV note below)
npm install --legacy-peer-deps
NODE_ENV=production npm run build

# 2. Assemble the standalone package: standalone does NOT include .next/static
#    or a guaranteed public/, so copy them in next to server.js. Drop any dev
#    .env so App Service's own env vars are the only config source.
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
rm -f .next/standalone/.env

# 3. VERIFY the package before zipping — server.js and node_modules/next MUST be
#    at the standalone root together, or the container crashes at startup with
#    "Cannot find module 'next'".
test -f .next/standalone/server.js && echo "OK server.js"       || { echo "MISSING server.js"; exit 1; }
test -d .next/standalone/node_modules/next && echo "OK next"    || { echo "MISSING node_modules/next"; exit 1; }

# 4. Zip the CONTENTS of standalone into a zip OUTSIDE the repo (so the zip
#    can't accidentally include itself or the source tree). Note the subshell:
#    the `cd` must not leak, and the zip path is absolute.
( cd .next/standalone && zip -rq /tmp/app.zip . -x ".git/*" )

# 5. VERIFY the zip actually contains next before deploying
unzip -l /tmp/app.zip | grep -q "node_modules/next/package.json" && echo "zip OK: contains next" || { echo "zip is missing next — do not deploy"; exit 1; }

# 6. Deploy the verified zip
az webapp deploy --resource-group rg-lease-abstract --name <webAppName> --src-path /tmp/app.zip --type zip
```

The most common way this goes wrong is zipping the **repo root** (`zip -r app.zip .`
from the project directory) instead of the **contents of `.next/standalone`** —
that produces a package full of `src/`, `infra/`, etc. with `node_modules`
excluded, so `server.js` deploys but has no `next` to load. The verification
steps above catch that before it reaches Azure. `next.config.mjs` also pins
`experimental.outputFileTracingRoot` so the standalone layout is deterministic
regardless of where the repo is checked out.

The Bicep sets `appCommandLine: 'node server.js'` and `HOSTNAME=0.0.0.0` to
match this layout (standalone's server.js binds to `HOSTNAME`, which App
Service otherwise sets to a non-routable container name). `az webapp deploy
--type zip` uses Run-From-Zip mode and skips any server-side build, which is
exactly right here since the package is already built and self-contained —
don't try to make it build on the server (that path needs the full dep tree
and hits the same size limits).

**Two gotchas that will bite you:**
- **`NODE_ENV`**: if your shell has a stray `NODE_ENV` set to anything other
  than `production`, `next build` loads a mix of dev/prod runtimes and crashes
  prerendering with `Cannot read properties of null (reading 'useContext')` /
  `<Html> should not be imported outside of pages/_document`. `unset NODE_ENV`
  (or prefix `NODE_ENV=production`) before building.
- **Don't zip the full `node_modules`**: a naive `zip -r app.zip .` including
  the whole dependency tree produces a 500 MB+ package that fails Kudu
  zipdeploy with HTTP 400 on a B1 plan. The standalone package avoids this.

`infra/main.parameters.json` contains your real Postgres admin password — it
lives only on your machine (gitignored) and isn't inside the standalone
package, so it won't ship. If you ever deployed a zip that *did* include it,
rotate the password (`az postgres flexible-server update --resource-group
rg-lease-abstract --name <postgresServerName> --admin-password <new>`) and
update `DATABASE_URL`.

Or wire up `.github/workflows/deploy.yml` (included) with an `AZURE_WEBAPP_PUBLISH_PROFILE` repo secret (`az webapp deployment list-publish-profiles --xml`) for push-to-deploy.

Prefer containers instead? Build/push the included `Dockerfile` to Azure Container Registry and point Azure Container Apps or App Service's container deployment at it — the app is identical either way; only how App Service receives the code changes.

## 3. Run migrations + seed the demo data

From your machine (or a one-off Azure Container Apps job), pointed at the deployed database:

```bash
export DATABASE_URL="postgresql://leaseabstract:<password>@<postgresServerFqdn>:5432/leaseabstract?sslmode=require"
npx prisma migrate deploy   # or: npx prisma db push
npm run db:seed             # optional: loads the two showcase abstracts
```

`prisma migrate deploy` needs migration files (`npx prisma migrate dev` locally first, if you haven't already) rather than `db push`, once you're past the prototype stage.

## 4. Verify

```bash
az webapp browse --resource-group rg-lease-abstract --name <webAppName>
```

Check **Settings → AI & Storage** in the app itself — it should read `azure`/`azure` (or `claude`/`azure` if you set `aiProvider=claude`) once the deployment's app settings are wired (they are, by default, from step 1).

## Notes & follow-ups

- **Azure OpenAI region/quota**: if deployment fails on the `openAiChatModel` resource — wrong model version, unsupported deployment SKU, or `InsufficientQuota` for tokens-per-minute — either request a quota increase (Azure Portal → Quotas → search the model/SKU combo named in the error) or set `deployOpenAiChatModel=false` and use Claude instead (see above); don't keep guessing at more model/SKU combinations if quota is the real blocker.
- **Postgres regionally restricted**: if the `Microsoft.DBforPostgreSQL/flexibleServers` resource fails with `ParameterOutOfRange: Version should be in: []`, that's not actually a version problem — it means Postgres Flexible Server provisioning is regionally restricted for your subscription in that region (confirm with `az postgres flexible-server list-skus --location <region> -o json` and look for a top-level `"reason"` field, or an empty top-level `supportedServerEditions`/`supportedServerVersions`). This can happen even when other resource types deploy fine in that same region. Rather than moving the whole deployment (which may re-trigger an App Service quota fight you already resolved for a specific region), set `postgresLocation=<a-region-that-works>` to place just the Postgres server elsewhere while everything else stays put — check a candidate region with the same `list-skus` command first.
- **Document Intelligence** is provisioned but the app doesn't call it yet for uploaded-document layout extraction (`lib/ai/azure.ts` has a hook for it) — wiring it in is the natural next step to get word-perfect highlight boxes on arbitrary uploads instead of the current page-level fallback.
- **Networking**: the Postgres firewall rule opens `0.0.0.0` (Azure services) for simplicity. For production, put the App Service and Postgres Flexible Server in the same VNet with private endpoints instead.
- **Secrets**: the Bicep template stores secrets in Key Vault and references them from the App Service via `@Microsoft.KeyVault(...)` app settings (resolved automatically via the Web App's system-assigned identity, granted `Key Vault Secrets User`). Nothing sensitive needs to live in source control or CI variables beyond the publish profile.

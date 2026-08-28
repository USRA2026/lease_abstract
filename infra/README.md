# Deploying to Azure

This provisions everything the app needs beyond the code itself:

| Resource | Purpose |
|---|---|
| App Service (Linux, Node 20) | Runs the Next.js app |
| Azure Database for PostgreSQL Flexible Server | Abstract/template/citation data |
| Storage Account (Blob) | Source PDF documents |
| Azure OpenAI (`gpt-4o` deployment) | AI abstraction extraction + Ask AI chat |
| Azure AI Document Intelligence *(optional)* | Layout/OCR with bounding boxes for uploaded PDFs |
| Key Vault | DB connection string, storage key, OpenAI key |
| Log Analytics + Application Insights | Logs/metrics |

The app itself never has direct knowledge it's "on Azure" — it only reads
`STORAGE_DRIVER`, `AI_PROVIDER`, `DATABASE_URL`, and the `AZURE_*` env vars
(see `.env.example`). Locally those default to `local`/`mock` with zero
external dependencies; this deployment flips them to the Azure-backed
implementations.

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

az bicep build --file infra/main.bicep   # lint/validate first

az deployment group create \
  --resource-group rg-lease-abstract \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

Capture the outputs (`webAppName`, `postgresServerFqdn`, `storageAccountName`, ...) — you'll need `webAppName` below.

`infra/main.parameters.json` contains a real password if you fill it in locally; it's already covered by `.gitignore`-style handling (don't commit it — keep using the `.example.json` in source control).

## 2. Deploy the application code

Simplest path — zip deploy (App Service builds it with `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, already set by the Bicep template):

```bash
zip -r app.zip . -x "node_modules/*" ".next/*" ".git/*" "storage/documents/*"
az webapp deploy --resource-group rg-lease-abstract --name <webAppName> --src-path app.zip --type zip
```

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

Check **Settings → AI & Storage** in the app itself — it should read `azure`/`azure` once the deployment's app settings are wired (they are, by default, from step 1).

## Notes & follow-ups

- **Azure OpenAI region/quota**: if deployment fails on the `openAiChatModel` resource, your subscription may not yet have `gpt-4o` quota in the chosen region — request a quota increase or pick an approved region/model.
- **Document Intelligence** is provisioned but the app doesn't call it yet for uploaded-document layout extraction (`lib/ai/azure.ts` has a hook for it) — wiring it in is the natural next step to get word-perfect highlight boxes on arbitrary uploads instead of the current page-level fallback.
- **Networking**: the Postgres firewall rule opens `0.0.0.0` (Azure services) for simplicity. For production, put the App Service and Postgres Flexible Server in the same VNet with private endpoints instead.
- **Secrets**: the Bicep template stores secrets in Key Vault and references them from the App Service via `@Microsoft.KeyVault(...)` app settings (resolved automatically via the Web App's system-assigned identity, granted `Key Vault Secrets User`). Nothing sensitive needs to live in source control or CI variables beyond the publish profile.

# Lease & Loan Abstraction

A contract abstraction database for commercial real estate leases and loan
agreements — organize source documents, abstract them into structured
fields with an AI layer, click any value to jump straight to the highlighted
clause it came from, and ask an AI agent natural-language questions about
the documents.

Built as a self-hosted alternative to abstractcre.com, deployable to Azure.

## What's here

- **Abstracts list** — every lease/loan abstract, its template, % complete,
  last updated date, and asset.
- **Abstract detail** — fields grouped into sections (General, Dates, Base
  Rent, Insurance, ...), each with an inline citation like `[BL p. 1]`.
  Clicking a citation opens the source PDF, jumps to the right page, and
  highlights the exact clause.
- **Document viewer** — in-browser PDF rendering (`react-pdf`) with a
  highlight overlay computed from the document's real text layout.
- **Ask AI** — a chat panel scoped to one abstract's documents; answers cite
  the page and quoted snippet they came from, and citations are clickable
  just like the field-level ones.
- **Upload → abstract** — drop a new PDF onto an abstract and the AI
  extraction pipeline runs immediately, filling in whatever template fields
  it can find and citing its source.
- **Lease** and **Loan** templates, each with the full section/field schema
  abstracted from real exported abstracts (see `src/lib/templates/`).

## Architecture

```
Next.js 14 (App Router, TypeScript, Tailwind)
├─ Postgres (Prisma ORM)      — teams, assets, templates, abstracts, fields,
│                                citations, documents + per-page text/layout
├─ Storage driver             — local filesystem (dev) or Azure Blob Storage
│                                (prod), behind one interface (lib/storage)
└─ AI provider                — deterministic mock (dev, zero external
                                 calls) or Azure OpenAI (prod), behind one
                                 interface (lib/ai) for both:
                                   • field extraction (the abstraction pipeline)
                                   • Q&A chat (retrieval over document pages)
```

Every document — whether generated for the two showcase abstracts or
uploaded through the UI — has its extracted text and word/line-level layout
stored per page (`DocumentPage.layout`), which is what lets a citation
highlight the *exact* rectangle on the *exact* page instead of just linking
to "the document."

See `infra/main.bicep` for the Azure deployment (App Service, Postgres
Flexible Server, Blob Storage, Azure OpenAI, Document Intelligence, Key
Vault) and `infra/README.md` for the full walkthrough.

## Local development

```bash
npm install
cp .env.example .env

# Postgres: docker-compose (if Docker is available)...
docker compose up -d
# ...or a local install:
#   sudo service postgresql start
#   sudo -u postgres psql -c "CREATE USER leaseabstract WITH PASSWORD 'leaseabstract' CREATEDB;"
#   sudo -u postgres psql -c "CREATE DATABASE leaseabstract OWNER leaseabstract;"

npm run db:push     # create schema
npm run db:seed     # seed the two showcase abstracts + grid filler rows
npm run dev
```

Open http://localhost:3000. By default `AI_PROVIDER=mock` and
`STORAGE_DRIVER=local` — the whole app runs with zero external
dependencies. Flip `.env` to `AI_PROVIDER=azure` (with `AZURE_OPENAI_*` set)
and/or `STORAGE_DRIVER=azure` (with `AZURE_STORAGE_*` set) to use the real
Azure-backed implementations instead; nothing else in the app changes.

### Showcase data

`npm run db:seed` loads:

- **Arugula Property LLC Loan** — a fully abstracted loan agreement (every
  field cited), with its source PDF generated on the fly so every citation
  highlights a real clause.
- **Orlando Garden Property Lease** — a fully abstracted lease, including
  the base rent schedule table, across two generated source documents (BL,
  1A).
- **Amazon (Canton ECommerce) Lease** — a partially abstracted lease (only
  the General section is filled in), demonstrating an in-progress abstract
  and reproducing the exact clause shown in the reference screenshots.
- A handful of lightweight rows (name/template/asset/% complete only) so the
  abstracts grid looks like a populated system.

## Key directories

```
src/app/                    Next.js routes (pages + API routes)
src/components/             UI: grid, detail view, PDF viewer, chat panel
src/lib/db.ts                Prisma client
src/lib/storage/             StorageDriver interface (local | azure)
src/lib/ai/                  AiProvider interface (mock | azure-openai)
src/lib/pdf/writer.ts        Builds the synthetic showcase PDFs + records
                              exact per-line bounding boxes as it draws them
src/lib/pdf/reader.ts         Extracts text from arbitrary uploaded PDFs
src/lib/pdf/locate.ts         Maps a quoted snippet back to a highlight rect
src/lib/extraction/pipeline.ts  AI abstraction pipeline (upload → fields)
src/lib/chat/rag.ts           Ask AI retrieval + citation resolution
src/lib/templates/            Lease/Loan section+field schemas + seed data
prisma/schema.prisma           Data model
prisma/seed.ts                 Seed script (also generates the demo PDFs)
infra/main.bicep                Azure infrastructure
```

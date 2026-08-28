import { PrismaClient, type FieldType } from "@prisma/client";
import { PdfWriter } from "../src/lib/pdf/writer";
import { getStorageDriver } from "../src/lib/storage";
import { arugulaLoan } from "../src/lib/templates/arugula-loan";
import { orlandoGardenLease } from "../src/lib/templates/orlando-garden-lease";
import { amazonCantonLease } from "../src/lib/templates/amazon-canton-lease";
import type { SeedAbstract, SeedSection } from "../src/lib/templates/types";

const db = new PrismaClient();
const storage = getStorageDriver();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function resetDatabase() {
  await db.citation.deleteMany();
  await db.chatMessage.deleteMany();
  await db.chatSession.deleteMany();
  await db.extractionJob.deleteMany();
  await db.abstractField.deleteMany();
  await db.rentScheduleRow.deleteMany();
  await db.reportingRequirement.deleteMany();
  await db.documentPage.deleteMany();
  await db.document.deleteMany();
  await db.abstract.deleteMany();
  await db.templateField.deleteMany();
  await db.templateSection.deleteMany();
  await db.template.deleteMany();
  await db.asset.deleteMany();
  await db.user.deleteMany();
  await db.team.deleteMany();
}

async function buildTemplate(teamId: string, name: string, kind: "LEASE" | "LOAN", sections: SeedSection[]) {
  const template = await db.template.create({ data: { name, kind, teamId } });
  const fieldIdByKey = new Map<string, string>();
  let sectionOrder = 0;
  for (const section of sections) {
    const sectionRow = await db.templateSection.create({
      data: { templateId: template.id, name: section.name, order: sectionOrder++ },
    });
    let fieldOrder = 0;
    for (const field of section.fields) {
      const fieldRow = await db.templateField.create({
        data: {
          sectionId: sectionRow.id,
          key: field.key,
          label: field.label,
          fieldType: field.fieldType as FieldType,
          order: fieldOrder++,
        },
      });
      fieldIdByKey.set(field.key, fieldRow.id);
    }
  }
  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);
  return { template, fieldIdByKey, totalFields };
}

interface GeneratedDoc {
  bytes: Uint8Array;
  pageTexts: string[];
  pageLines: ReturnType<PdfWriter["getPageLines"]>;
  spans: ReturnType<PdfWriter["getSpans"]>;
  pageCount: number;
}

async function generateDocuments(seed: SeedAbstract): Promise<Map<string, GeneratedDoc>> {
  const perDoc = new Map<string, GeneratedDoc>();

  for (const docSpec of seed.documents) {
    const writer = await PdfWriter.create();
    writer.documentHeader(docSpec.title, `${seed.name} — ${docSpec.acronym}`);

    for (const section of seed.sections) {
      const matching = section.fields.filter((f) => f.citation?.acronym === docSpec.acronym);
      if (matching.length === 0) continue;
      writer.heading(section.name);
      for (const field of matching) {
        writer.paragraph(`${field.label}: ${field.value}`, field.key);
      }
      writer.spacer();
    }

    if (seed.rentSchedule) {
      const rowsForDoc = seed.rentSchedule.filter(
        (row) => seed.documents.find((d) => d.title === row.sourceDocument)?.acronym === docSpec.acronym
      );
      if (rowsForDoc.length > 0) {
        writer.heading("Base Rent Schedule");
        for (const row of rowsForDoc) {
          writer.paragraph(
            `${row.start} to ${row.end}: ${row.monthlyRent}/month (${row.percentIncrease ?? "N/A"} increase)`
          );
        }
        writer.spacer();
      }
    }

    if (seed.reportingRequirements && docSpec.acronym === seed.documents[0].acronym) {
      writer.heading("Loan Reporting Requirements");
      for (const row of seed.reportingRequirements) {
        writer.paragraph(`${row.item} — ${row.frequency}, due ${row.dueBy}`);
      }
      writer.spacer();
    }

    perDoc.set(docSpec.acronym, {
      bytes: await writer.save(),
      pageTexts: writer.getPageTexts(),
      pageLines: writer.getPageLines(),
      spans: writer.getSpans(),
      pageCount: writer.pageCount,
    });
  }

  return perDoc;
}

async function seedAbstract(
  seed: SeedAbstract,
  teamId: string,
  templateId: string,
  fieldIdByKey: Map<string, string>,
  totalFields: number,
  assetIdByName: Map<string, string>
) {
  let assetId = assetIdByName.get(seed.assetName);
  if (!assetId) {
    const asset = await db.asset.create({ data: { name: seed.assetName, teamId } });
    assetId = asset.id;
    assetIdByName.set(seed.assetName, assetId);
  }

  const filledFieldCount = seed.sections.reduce((sum, s) => sum + s.fields.length, 0);
  const percentComplete = totalFields ? Math.round((filledFieldCount / totalFields) * 100) : 0;

  const abstract = await db.abstract.create({
    data: {
      name: seed.name,
      kind: seed.kind,
      teamId,
      assetId,
      templateId,
      percentComplete,
      missingDocuments: seed.sections
        .flatMap((s) => s.fields)
        .find((f) => f.key === "missingDocuments")?.value,
    },
  });

  const generated = await generateDocuments(seed);
  const documentIdByAcronym = new Map<string, string>();
  const slug = slugify(seed.name);

  let docOrder = 0;
  for (const docSpec of seed.documents) {
    const gen = generated.get(docSpec.acronym)!;
    const storageKey = `${slug}/${docSpec.acronym}.pdf`;
    await storage.put(storageKey, Buffer.from(gen.bytes), "application/pdf");

    const document = await db.document.create({
      data: {
        abstractId: abstract.id,
        fileName: docSpec.fileName,
        title: docSpec.title,
        acronym: docSpec.acronym,
        storageKey,
        pageCount: gen.pageCount,
        order: docOrder++,
      },
    });
    documentIdByAcronym.set(docSpec.acronym, document.id);

    for (let i = 0; i < gen.pageCount; i++) {
      await db.documentPage.create({
        data: {
          documentId: document.id,
          pageNumber: i + 1,
          text: gen.pageTexts[i] ?? "",
          layout: (gen.pageLines[i] ?? []) as object,
        },
      });
    }
  }

  for (const section of seed.sections) {
    for (const field of section.fields) {
      const templateFieldId = fieldIdByKey.get(field.key);
      if (!templateFieldId) {
        throw new Error(`Unknown template field "${field.key}" for ${seed.name}`);
      }

      const abstractField = await db.abstractField.create({
        data: {
          abstractId: abstract.id,
          templateFieldId,
          value: field.value,
          confidence: 1,
        },
      });

      if (field.citation) {
        const documentId = documentIdByAcronym.get(field.citation.acronym);
        const gen = generated.get(field.citation.acronym);
        const span = gen?.spans.find((s) => s.key === field.key);
        if (documentId && span) {
          const label = [field.citation.acronym, field.citation.page ?? field.citation.sectionRef]
            .filter(Boolean)
            .join(" ");
          await db.citation.create({
            data: {
              documentId,
              abstractFieldId: abstractField.id,
              page: span.page,
              sectionRef: field.citation.sectionRef,
              label,
              snippet: field.value,
              highlightRects: span.rects as object,
            },
          });
        }
      }
    }
  }

  if (seed.rentSchedule) {
    let order = 0;
    for (const row of seed.rentSchedule) {
      await db.rentScheduleRow.create({
        data: {
          abstractId: abstract.id,
          startDate: new Date(row.start),
          endDate: new Date(row.end),
          monthlyRent: row.monthlyRent,
          percentIncrease: row.percentIncrease,
          sourceDocument: row.sourceDocument,
          order: order++,
        },
      });
    }
  }

  if (seed.reportingRequirements) {
    let order = 0;
    for (const row of seed.reportingRequirements) {
      await db.reportingRequirement.create({
        data: {
          abstractId: abstract.id,
          item: row.item,
          frequency: row.frequency,
          dueBy: row.dueBy,
          order: order++,
        },
      });
    }
  }

  return abstract;
}

interface LightweightAbstract {
  name: string;
  kind: "LEASE" | "LOAN";
  assetName: string;
  percentComplete: number;
  updatedAt: string;
}

const LIGHTWEIGHT_ABSTRACTS: LightweightAbstract[] = [
  { name: "ADJ Lease", kind: "LEASE", assetName: "ADJ", percentComplete: 100, updatedAt: "2026-03-27" },
  { name: "Aduco Jax Property LLC Loan Agreement", kind: "LOAN", assetName: "ADJ", percentComplete: 100, updatedAt: "2026-03-24" },
  { name: "Amazon (Canton ECommerce) Loan", kind: "LOAN", assetName: "Amazon Last Mile", percentComplete: 100, updatedAt: "2025-10-20" },
  { name: "Arugula Property LLC Lease", kind: "LEASE", assetName: "Arugula Property", percentComplete: 100, updatedAt: "2025-12-30" },
  { name: "Bawston Creek BTS Property Lease", kind: "LEASE", assetName: "Boston Creek BTS", percentComplete: 100, updatedAt: "2025-11-05" },
  { name: "Bawston Creek BTS Property Loan", kind: "LOAN", assetName: "Boston Creek BTS", percentComplete: 100, updatedAt: "2025-11-08" },
  { name: "Burns & McDonnell", kind: "LEASE", assetName: "Burns & McDonnell", percentComplete: 100, updatedAt: "2026-07-09" },
  { name: "Burns & McDonnell (Expansion II)", kind: "LEASE", assetName: "Burns & McDonnell", percentComplete: 100, updatedAt: "2025-09-15" },
  { name: "Burns & McDonnell Loan", kind: "LOAN", assetName: "Burns & McDonnell", percentComplete: 100, updatedAt: "2025-09-23" },
  { name: "Chicago Grocery Loan", kind: "LOAN", assetName: "Albertsons Chicago", percentComplete: 100, updatedAt: "2025-08-22" },
  { name: "Chicago Grocery Mezz A", kind: "LOAN", assetName: "Albertsons Chicago", percentComplete: 100, updatedAt: "2025-09-13" },
];

async function seedLightweightAbstracts(
  teamId: string,
  leaseTemplateId: string,
  loanTemplateId: string,
  assetIdByName: Map<string, string>
) {
  for (const entry of LIGHTWEIGHT_ABSTRACTS) {
    let assetId = assetIdByName.get(entry.assetName);
    if (!assetId) {
      const asset = await db.asset.create({ data: { name: entry.assetName, teamId } });
      assetId = asset.id;
      assetIdByName.set(entry.assetName, assetId);
    }

    const abstract = await db.abstract.create({
      data: {
        name: entry.name,
        kind: entry.kind,
        teamId,
        assetId,
        templateId: entry.kind === "LEASE" ? leaseTemplateId : loanTemplateId,
        percentComplete: entry.percentComplete,
      },
    });

    // These rows exist purely to populate the abstracts grid the way the
    // live system's list view looks; backdate updatedAt to match via raw
    // SQL since Prisma's @updatedAt otherwise always stamps "now".
    await db.$executeRawUnsafe(
      `UPDATE "Abstract" SET "updatedAt" = $1, "createdAt" = $1 WHERE id = $2`,
      new Date(entry.updatedAt),
      abstract.id
    );
  }
}

async function main() {
  console.log("Resetting database...");
  await resetDatabase();

  console.log("Creating team + user...");
  const team = await db.team.create({ data: { name: "U.S. Realty Advisors" } });
  await db.user.create({ data: { email: "dgrazioli@usrallc.com", name: "D. Grazioli", teamId: team.id } });

  console.log("Building templates...");
  const leaseTemplate = await buildTemplate(team.id, "Lease", "LEASE", orlandoGardenLease.sections);
  const loanTemplate = await buildTemplate(team.id, "Loan", "LOAN", arugulaLoan.sections);

  const assetIdByName = new Map<string, string>();

  console.log("Seeding Arugula Property LLC Loan (full abstract + generated LDOTSA PDF)...");
  await seedAbstract(arugulaLoan, team.id, loanTemplate.template.id, loanTemplate.fieldIdByKey, loanTemplate.totalFields, assetIdByName);

  console.log("Seeding Orlando Garden Property Lease (full abstract + generated BL/1A PDFs)...");
  await seedAbstract(orlandoGardenLease, team.id, leaseTemplate.template.id, leaseTemplate.fieldIdByKey, leaseTemplate.totalFields, assetIdByName);

  console.log("Seeding Amazon (Canton ECommerce) Lease (partial abstract, matches the reference screenshots)...");
  await seedAbstract(amazonCantonLease, team.id, leaseTemplate.template.id, leaseTemplate.fieldIdByKey, leaseTemplate.totalFields, assetIdByName);

  console.log("Seeding lightweight grid rows...");
  await seedLightweightAbstracts(team.id, leaseTemplate.template.id, loanTemplate.template.id, assetIdByName);

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

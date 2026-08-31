import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Rect } from "@/lib/pdf/writer";

export interface AbstractDetailCitation {
  id: string;
  documentId: string;
  documentAcronym: string;
  page: number;
  label: string;
  snippet: string;
  highlightRects: Rect[];
}

export interface AbstractDetailField {
  key: string;
  templateFieldId: string;
  label: string;
  value: string | null;
  citations: AbstractDetailCitation[];
}

export interface AbstractDetailSection {
  name: string;
  fields: AbstractDetailField[];
}

export interface AbstractDetailDocument {
  id: string;
  title: string;
  acronym: string;
  fileName: string;
  pageCount: number;
}

export interface AbstractDetailRentRow {
  start: string;
  end: string;
  monthlyRent: string;
  percentIncrease: string | null;
  sourceDocument: string;
}

export interface AbstractDetailReportingRow {
  item: string;
  frequency: string;
  dueBy: string;
}

export interface AbstractDetail {
  id: string;
  name: string;
  kind: "LEASE" | "LOAN";
  templateName: string;
  assetName?: string;
  assetId?: string;
  fundName?: string;
  percentComplete: number;
  updatedAt: Date;
  sections: AbstractDetailSection[];
  documents: AbstractDetailDocument[];
  rentSchedule: AbstractDetailRentRow[];
  reportingRequirements: AbstractDetailReportingRow[];
  missingDocuments?: string | null;
}

/**
 * Fetches one abstract and normalizes it into the shape both the detail
 * page and the Excel/Word/PDF exporters render from, so the two never
 * drift out of sync.
 */
export async function getAbstractDetail(id: string): Promise<AbstractDetail> {
  const abstract = await db.abstract.findUnique({
    where: { id },
    include: {
      asset: { include: { fund: true } },
      template: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: { fields: { orderBy: { order: "asc" } } },
          },
        },
      },
      documents: { orderBy: { order: "asc" } },
      fields: { include: { citations: { include: { document: true } } } },
      rentScheduleRows: { orderBy: { order: "asc" } },
      reportingRows: { orderBy: { order: "asc" } },
    },
  });

  if (!abstract) notFound();

  const fieldByTemplateFieldId = new Map(abstract.fields.map((f) => [f.templateFieldId, f]));

  const sections: AbstractDetailSection[] = abstract.template.sections.map((section) => ({
    name: section.name,
    fields: section.fields.map((templateField) => {
      const abstractField = fieldByTemplateFieldId.get(templateField.id);
      return {
        key: templateField.key,
        templateFieldId: templateField.id,
        label: templateField.label,
        value: abstractField?.value ?? null,
        citations: (abstractField?.citations ?? []).map((c) => ({
          id: c.id,
          documentId: c.documentId,
          documentAcronym: c.document.acronym,
          page: c.page,
          label: c.label,
          snippet: c.snippet,
          highlightRects: c.highlightRects as unknown as Rect[],
        })),
      };
    }),
  }));

  return {
    id: abstract.id,
    name: abstract.name,
    kind: abstract.kind,
    templateName: abstract.template.name,
    assetName: abstract.asset?.name,
    assetId: abstract.asset?.id,
    fundName: abstract.asset?.fund?.name,
    percentComplete: abstract.percentComplete,
    updatedAt: abstract.updatedAt,
    sections,
    documents: abstract.documents.map((d) => ({
      id: d.id,
      title: d.title,
      acronym: d.acronym,
      fileName: d.fileName,
      pageCount: d.pageCount,
    })),
    rentSchedule: abstract.rentScheduleRows.map((r) => ({
      start: r.startDate.toISOString().slice(0, 10),
      end: r.endDate.toISOString().slice(0, 10),
      monthlyRent: r.monthlyRent,
      percentIncrease: r.percentIncrease,
      sourceDocument: r.sourceDocument,
    })),
    reportingRequirements: abstract.reportingRows.map((r) => ({
      item: r.item,
      frequency: r.frequency,
      dueBy: r.dueBy,
    })),
    missingDocuments: abstract.missingDocuments,
  };
}

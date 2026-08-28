import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AbstractDetailClient, type SectionData } from "@/components/AbstractDetailClient";
import type { HighlightRect } from "@/components/PdfCanvas";

export const dynamic = "force-dynamic";

export default async function AbstractDetailPage({ params }: { params: { id: string } }) {
  const abstract = await db.abstract.findUnique({
    where: { id: params.id },
    include: {
      asset: true,
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

  const sections: SectionData[] = abstract.template.sections.map((section) => ({
    name: section.name,
    fields: section.fields.map((templateField) => {
      const abstractField = fieldByTemplateFieldId.get(templateField.id);
      return {
        key: templateField.key,
        label: templateField.label,
        value: abstractField?.value ?? null,
        citations: (abstractField?.citations ?? []).map((c) => ({
          id: c.id,
          documentId: c.documentId,
          page: c.page,
          label: c.label,
          snippet: c.snippet,
          highlightRects: c.highlightRects as unknown as HighlightRect[],
        })),
      };
    }),
  }));

  return (
    <AbstractDetailClient
      abstractId={abstract.id}
      name={abstract.name}
      templateName={abstract.template.name}
      assetName={abstract.asset?.name}
      assetId={abstract.asset?.id}
      percentComplete={abstract.percentComplete}
      sections={sections}
      documents={abstract.documents.map((d) => ({
        id: d.id,
        title: d.title,
        acronym: d.acronym,
        fileName: d.fileName,
        pageCount: d.pageCount,
      }))}
      rentSchedule={abstract.rentScheduleRows.map((r) => ({
        start: r.startDate.toISOString().slice(0, 10),
        end: r.endDate.toISOString().slice(0, 10),
        monthlyRent: r.monthlyRent,
        percentIncrease: r.percentIncrease,
        sourceDocument: r.sourceDocument,
      }))}
      reportingRequirements={abstract.reportingRows.map((r) => ({
        item: r.item,
        frequency: r.frequency,
        dueBy: r.dueBy,
      }))}
      missingDocuments={abstract.missingDocuments}
    />
  );
}

import { db } from "@/lib/db";
import { getAiProvider } from "@/lib/ai";
import type { AiTemplateFieldSpec } from "@/lib/ai/types";
import { locateSnippet } from "@/lib/pdf/locate";
import type { LayoutLine, Rect } from "@/lib/pdf/writer";
import { PAGE_HEIGHT, PAGE_WIDTH, MARGIN } from "@/lib/pdf/writer";

const FALLBACK_PAGE_RECT: Rect = {
  x: MARGIN,
  y: MARGIN,
  width: PAGE_WIDTH - MARGIN * 2,
  height: PAGE_HEIGHT - MARGIN * 2,
};

/**
 * Runs the AI abstraction pipeline for an abstract: reads every attached
 * document's stored per-page text/layout, asks the configured AI provider
 * (mock by default, Azure OpenAI when configured) to fill in every field
 * defined by the abstract's template, and writes the results back as
 * AbstractField + Citation rows with a highlight rect resolved from the
 * page layout. Re-running it (e.g. after a new document is uploaded)
 * overwrites previous AI-derived values for the fields it touches.
 */
export async function runExtraction(abstractId: string, documentIds?: string[]) {
  const abstract = await db.abstract.findUniqueOrThrow({
    where: { id: abstractId },
    include: {
      template: {
        include: { sections: { include: { fields: true }, orderBy: { order: "asc" } } },
      },
      documents: { include: { pages: true }, orderBy: { order: "asc" } },
    },
  });

  const ai = getAiProvider();
  const job = await db.extractionJob.create({
    data: { abstractId, provider: ai.name, status: "RUNNING" },
  });

  try {
    const documents = documentIds?.length
      ? abstract.documents.filter((d) => documentIds.includes(d.id))
      : abstract.documents;

    const aiDocuments = documents.map((d) => ({
      documentId: d.id,
      acronym: d.acronym,
      title: d.title,
      pages: d.pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
    }));

    const fieldSpecs: (AiTemplateFieldSpec & { templateFieldId: string })[] = [];
    for (const section of abstract.template.sections) {
      for (const field of section.fields) {
        fieldSpecs.push({
          key: field.key,
          label: field.label,
          sectionName: section.name,
          fieldType: field.fieldType,
          helpText: field.helpText ?? undefined,
          templateFieldId: field.id,
        });
      }
    }

    const results = await ai.extractFields({ fields: fieldSpecs, documents: aiDocuments });

    let fieldsFound = 0;
    for (const result of results) {
      const spec = fieldSpecs.find((f) => f.key === result.key);
      if (!spec) continue;
      if (!result.value || result.value === "Not found in provided documents") continue;

      fieldsFound++;
      const abstractField = await db.abstractField.upsert({
        where: { abstractId_templateFieldId: { abstractId, templateFieldId: spec.templateFieldId } },
        create: {
          abstractId,
          templateFieldId: spec.templateFieldId,
          value: result.value,
          confidence: result.confidence,
        },
        update: { value: result.value, confidence: result.confidence },
      });

      await db.citation.deleteMany({ where: { abstractFieldId: abstractField.id } });

      const sourceDoc = result.documentId ? documents.find((d) => d.id === result.documentId) : undefined;
      if (sourceDoc && result.page) {
        const page = sourceDoc.pages.find((p) => p.pageNumber === result.page);
        const lines = (page?.layout as unknown as LayoutLine[]) ?? [];
        const rects = locateSnippet(lines, result.snippet ?? result.value, FALLBACK_PAGE_RECT);
        await db.citation.create({
          data: {
            documentId: sourceDoc.id,
            abstractFieldId: abstractField.id,
            page: result.page,
            label: `${sourceDoc.acronym} p. ${result.page}`,
            snippet: result.snippet ?? result.value.slice(0, 200),
            highlightRects: rects as object,
          },
        });
      }
    }

    const totalFields = fieldSpecs.length;
    const filled = await db.abstractField.count({ where: { abstractId } });
    const percentComplete = totalFields ? Math.round((filled / totalFields) * 100) : 0;
    await db.abstract.update({ where: { id: abstractId }, data: { percentComplete } });

    await db.extractionJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", fieldsFound, completedAt: new Date() },
    });

    return { fieldsFound, provider: ai.name };
  } catch (err) {
    await db.extractionJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: (err as Error).message, completedAt: new Date() },
    });
    throw err;
  }
}

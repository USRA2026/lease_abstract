import { db } from "@/lib/db";

/**
 * Updates a document's title/acronym and, when the acronym changes, relabels
 * its existing citations to match ("U3 p. 1" -> "BL p. 1", "U3 § 6(b)" ->
 * "BL § 6(b)") — swapping just the acronym prefix so section references are
 * preserved. Shared by the single-document PATCH route and bulk AI renaming.
 */
export async function applyDocumentRename(
  documentId: string,
  patch: { title?: string; acronym?: string }
): Promise<{ id: string; title: string; acronym: string }> {
  const before = await db.document.findUnique({ where: { id: documentId }, select: { acronym: true } });
  if (!before) throw new Error("Document not found");

  const document = await db.document.update({ where: { id: documentId }, data: patch });

  if (patch.acronym && patch.acronym !== before.acronym) {
    const escaped = before.acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefix = new RegExp("^" + escaped + "(?=\\s|$)", "i");
    const citations = await db.citation.findMany({ where: { documentId: document.id } });
    for (const c of citations) {
      const label = prefix.test(c.label)
        ? c.label.replace(prefix, document.acronym)
        : `${document.acronym} ${c.sectionRef ?? `p. ${c.page}`}`;
      if (label !== c.label) {
        await db.citation.update({ where: { id: c.id }, data: { label } });
      }
    }
  }

  return { id: document.id, title: document.title, acronym: document.acronym };
}

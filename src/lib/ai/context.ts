import type { AiDocumentInput } from "./types";

/** Renders per-page document text into a single prompt-ready context block, shared by every real AI provider. */
export function buildDocumentContext(documents: AiDocumentInput[], maxCharsPerPage = 3000): string {
  return documents
    .map((doc) => {
      // No usable text layer — the raw PDF is attached separately (see
      // withPdfAttachments in anthropic.ts) instead of dumping empty pages.
      if (doc.pdfBase64) {
        return `### Document "${doc.title}" (acronym: ${doc.acronym}, documentId: ${doc.documentId})\nNo extractable text layer was found on this document (likely a scanned image) — its full PDF is attached separately below. Read it directly for this document's content.`;
      }
      return doc.pages
        .map(
          (page) =>
            `### Document "${doc.title}" (acronym: ${doc.acronym}, documentId: ${doc.documentId}), page ${page.pageNumber}\n${page.text.slice(0, maxCharsPerPage)}`
        )
        .join("\n\n");
    })
    .join("\n\n");
}

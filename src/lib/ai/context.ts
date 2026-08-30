import type { AiDocumentInput } from "./types";

/** Renders per-page document text into a single prompt-ready context block, shared by every real AI provider. */
export function buildDocumentContext(documents: AiDocumentInput[], maxCharsPerPage = 3000): string {
  return documents
    .map((doc) =>
      doc.pages
        .map(
          (page) =>
            `### Document "${doc.title}" (acronym: ${doc.acronym}, documentId: ${doc.documentId}), page ${page.pageNumber}\n${page.text.slice(0, maxCharsPerPage)}`
        )
        .join("\n\n")
    )
    .join("\n\n");
}

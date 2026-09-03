/**
 * Below this many total extracted characters across a document's pages, we
 * treat it as having no usable text layer — almost always a scanned image
 * PDF that pdfjs's text extraction can't read. Real text-layer documents run
 * to hundreds of characters per page, so this only trips on genuinely empty
 * extraction.
 */
const SPARSE_TEXT_THRESHOLD = 40;

export function isSparseText(pages: { text: string }[]): boolean {
  const totalChars = pages.reduce((sum, p) => sum + p.text.trim().length, 0);
  return totalChars < SPARSE_TEXT_THRESHOLD;
}

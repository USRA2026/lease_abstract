export interface ExtractedPage {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
}

export interface ExtractedDocument {
  pageCount: number;
  pages: ExtractedPage[];
}

/**
 * Extracts per-page text from an arbitrary uploaded PDF using pdfjs-dist
 * directly (the same engine react-pdf renders with client-side, run here
 * server-side against the raw bytes with no worker/DOM required). Real
 * Azure AI Document Intelligence layout output (with word-level bounding
 * boxes) is used in production when AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT is
 * set (see lib/ai/azure.ts); this is the local/offline fallback, which is
 * why citations on uploaded documents get a page-level highlight rather
 * than a word-perfect one (see extraction/locate.ts).
 */
export async function extractDocumentText(bytes: Buffer): Promise<ExtractedDocument> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;

  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    const viewport = page.getViewport({ scale: 1 });
    pages.push({ pageNumber: i, text, width: viewport.width, height: viewport.height });
  }

  await pdf.destroy();

  return {
    pageCount: pages.length || 1,
    pages: pages.length ? pages : [{ pageNumber: 1, text: "", width: 612, height: 792 }],
  };
}

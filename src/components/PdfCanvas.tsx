"use client";

import { Document, Page, pdfjs } from "react-pdf";

// Mirrors PAGE_WIDTH/PAGE_HEIGHT in lib/pdf/writer.ts (US Letter, points).
const PAGE_HEIGHT_PT = 792;

// Served as a static file (see scripts/copy-pdf-worker.mjs) rather than
// bundled, so webpack/Terser never has to process pdfjs-dist's ESM worker.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfCanvasProps {
  fileUrl: string;
  pageNumber: number;
  rects: HighlightRect[];
  renderWidth?: number;
}

export default function PdfCanvas({ fileUrl, pageNumber, rects, renderWidth = 700 }: PdfCanvasProps) {
  const scale = renderWidth / 612;

  return (
    <Document
      file={fileUrl}
      loading={<div className="p-8 text-sm text-slate-400">Loading document...</div>}
      error={<div className="p-8 text-sm text-red-700">Failed to load this document.</div>}
    >
      <div className="relative inline-block bg-white shadow-lg">
        <Page pageNumber={pageNumber} width={renderWidth} renderTextLayer={false} renderAnnotationLayer={false} />
        {rects.map((r, i) => (
          <div
            key={i}
            className="pointer-events-none absolute rounded-sm bg-usra-sky/40 ring-2 ring-usra-sky"
            style={{
              left: r.x * scale,
              top: (PAGE_HEIGHT_PT - (r.y + r.height)) * scale,
              width: r.width * scale,
              height: r.height * scale,
            }}
          />
        ))}
      </div>
    </Document>
  );
}

import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// react-pdf renders PDFs via pdfjs-dist, which needs its worker script
// served as a plain static file (not bundled/minified by webpack — its
// ESM build breaks Next's Terser pass). Copying it into public/ once per
// install/build keeps PdfCanvas.tsx's workerSrc a simple string path.
const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(__dirname, "..", "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.warn("pdfjs-dist worker not found at", src, "- skipping copy (run npm install first)");
  process.exit(0);
}

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("Copied pdf.worker.min.mjs to public/");

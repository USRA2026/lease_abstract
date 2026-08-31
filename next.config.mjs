import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // pdfjs-dist loads its worker (pdf.worker.mjs) via a runtime dynamic import
    // that the standalone file tracer can't follow, so it gets left out of the
    // bundle and every server-side PDF parse fails with "Cannot find module
    // .../pdf.worker.mjs". Force-include it for the routes that extract text
    // from uploaded PDFs.
    outputFileTracingIncludes: {
      "/api/abstracts/[id]/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
      "/api/assets/[id]/documents": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    },
    // Pin the file-tracing root to THIS app directory so `output: "standalone"`
    // deterministically emits `.next/standalone/server.js` with
    // `.next/standalone/node_modules` right beside it. Without this, Next walks
    // up looking for the workspace root; because the repo is commonly checked
    // out at a nested path (e.g. ~/lease_abstract/lease_abstract), a stray
    // lockfile in the parent can make Next nest the standalone output under a
    // subdirectory, which then gets zipped/deployed wrong (server.js ends up
    // without node_modules beside it -> "Cannot find module 'next'").
    outputFileTracingRoot: __dirname,
    serverComponentsExternalPackages: ["@prisma/client", "pdf-lib", "pdfjs-dist"],
  },
};

export default nextConfig;

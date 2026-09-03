import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAiProvider } from "@/lib/ai";
import { isSparseText } from "@/lib/ai/sparse";
import { getStorageDriver } from "@/lib/storage";
import { uniqueAcronym } from "@/lib/documents/naming";
import { applyDocumentRename } from "@/lib/documents/rename";

export const runtime = "nodejs";

// Generic fallback acronyms handed out when AI naming failed at upload time
// (U1, U2, ... for abstract documents; A1, A2, ... for asset documents).
const FALLBACK_ACRONYM = /^[UA]\d+$/i;

/**
 * Re-runs AI document naming for any document still carrying a generic
 * fallback acronym — e.g. ones uploaded while the selected model didn't
 * support the extraction request shape. Leaves already-named (including
 * manually renamed) documents untouched.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const abstract = await db.abstract.findUnique({
      where: { id: params.id },
      include: {
        documents: { include: { pages: { where: { pageNumber: 1 } } }, orderBy: { order: "asc" } },
      },
    });
    if (!abstract) return NextResponse.json({ error: "Abstract not found" }, { status: 404 });

    const ai = getAiProvider();
    if (!ai.describeDocument) {
      return NextResponse.json({ error: "The active AI provider doesn't support document naming" }, { status: 400 });
    }

    const storage = getStorageDriver();
    const acronyms = abstract.documents.map((d) => d.acronym);
    let renamed = 0;
    const errors: string[] = [];

    for (let i = 0; i < abstract.documents.length; i++) {
      const doc = abstract.documents[i];
      if (!FALLBACK_ACRONYM.test(doc.acronym)) continue;
      try {
        const otherAcronyms = acronyms.filter((_, idx) => idx !== i);
        const firstPage = doc.pages[0]?.text ?? "";
        // No text layer on the opening page (a scan) — attach the full PDF
        // so the model can read/OCR it directly instead of naming blind.
        const pdfBase64 = isSparseText([{ text: firstPage }])
          ? (await storage.get(doc.storageKey)).toString("base64")
          : undefined;
        const described = await ai.describeDocument({
          fileName: doc.fileName,
          firstPageText: firstPage,
          existingAcronyms: otherAcronyms,
          abstractKind: abstract.kind,
          pdfBase64,
        });
        const acronym = uniqueAcronym(described.acronym, otherAcronyms);
        await applyDocumentRename(doc.id, { title: described.title, acronym });
        acronyms[i] = acronym;
        renamed++;
      } catch (err) {
        console.warn(`Renaming document ${doc.id} failed`, err);
        errors.push(doc.fileName);
      }
    }

    return NextResponse.json({ renamed, failed: errors });
  } catch (err) {
    console.error("Bulk document rename failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not rename documents" }, { status: 500 });
  }
}

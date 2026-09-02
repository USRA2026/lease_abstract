import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorageDriver } from "@/lib/storage";
import { extractDocumentText } from "@/lib/pdf/reader";
import { runExtraction } from "@/lib/extraction/pipeline";
import { getAiProvider } from "@/lib/ai";
import { uniqueAcronym, titleFromFileName } from "@/lib/documents/naming";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const abstract = await db.abstract.findUnique({ where: { id: params.id }, include: { documents: true } });
    if (!abstract) {
      return NextResponse.json({ error: "Abstract not found" }, { status: 404 });
    }
    if (!abstract.assetId) {
      return NextResponse.json({ error: "Assign this abstract to an asset before uploading documents" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF documents are supported" }, { status: 400 });
    }

    const requestedTitle = (form.get("title") as string)?.trim();
    const requestedAcronym = (form.get("acronym") as string)?.trim().toUpperCase();
    const existingAcronyms = abstract.documents.map((d) => d.acronym);

    const bytes = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDocumentText(bytes);

    // Name the document the way an abstractor cites it ("Warehouse Lease
    // Agreement" / "BL") so citations read like a real abstract rather than
    // "U3 p. 1". Falls back to the filename + a generic acronym if the AI
    // provider can't name it.
    let title = requestedTitle || titleFromFileName(file.name);
    let acronym = requestedAcronym || "";
    if (!requestedTitle || !requestedAcronym) {
      try {
        const ai = getAiProvider();
        if (ai.describeDocument) {
          const described = await ai.describeDocument({
            fileName: file.name,
            firstPageText: extracted.pages[0]?.text ?? "",
            existingAcronyms,
            abstractKind: abstract.kind,
          });
          if (!requestedTitle && described.title) title = described.title;
          if (!requestedAcronym && described.acronym) acronym = described.acronym;
        }
      } catch (err) {
        console.warn("Document naming failed; using filename fallback", err);
      }
    }
    acronym = uniqueAcronym(acronym || `U${abstract.documents.length + 1}`, existingAcronyms);

    const storage = getStorageDriver();
    const storageKey = `uploads/${abstract.id}/${Date.now()}-${file.name}`;
    await storage.put(storageKey, bytes, "application/pdf");

    const document = await db.document.create({
      data: {
        assetId: abstract.assetId,
        abstractId: abstract.id,
        fileName: file.name,
        title,
        acronym,
        storageKey,
        pageCount: extracted.pageCount,
        order: abstract.documents.length,
      },
    });

    for (const page of extracted.pages) {
      await db.documentPage.create({
        data: {
          documentId: document.id,
          pageNumber: page.pageNumber,
          text: page.text,
          layout: [],
        },
      });
    }

    let extraction: { fieldsFound: number; provider: string } | null = null;
    let extractionError: string | null = null;
    try {
      extraction = await runExtraction(abstract.id, [document.id]);
    } catch (err) {
      // The document itself uploaded fine; only the AI abstraction failed.
      // Surface the reason to the client instead of hiding it.
      console.error("Extraction failed after upload", err);
      extractionError = err instanceof Error ? err.message : "AI abstraction failed";
    }

    return NextResponse.json({
      document: { id: document.id, title, acronym, pageCount: extracted.pageCount },
      extraction,
      extractionError,
    });
  } catch (err) {
    // Always return JSON so the client shows a real message instead of failing
    // to parse an empty 500 body ("Unexpected end of JSON input").
    console.error("Document upload failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed while processing the document" },
      { status: 500 }
    );
  }
}

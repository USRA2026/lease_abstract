import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorageDriver } from "@/lib/storage";
import { extractDocumentText } from "@/lib/pdf/reader";
import { getAiProvider } from "@/lib/ai";
import { uniqueAcronym, titleFromFileName } from "@/lib/documents/naming";

export const runtime = "nodejs";

/**
 * Uploads a document directly to an asset, independent of any abstract
 * (e.g. a survey, title policy, or insurance certificate). No AI
 * abstraction pipeline runs here since there's no template to fill in;
 * the text is still extracted and stored so the document is viewable and
 * searchable like any other.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const asset = await db.asset.findUnique({ where: { id: params.id }, include: { documents: true } });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
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
    const existingAcronyms = asset.documents.map((d) => d.acronym);

    const bytes = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDocumentText(bytes);

    // Give asset-level documents a proper title + citation acronym too
    // (e.g. "Title Policy" / "TP"), falling back to the filename.
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
          });
          if (!requestedTitle && described.title) title = described.title;
          if (!requestedAcronym && described.acronym) acronym = described.acronym;
        }
      } catch (err) {
        console.warn("Document naming failed; using filename fallback", err);
      }
    }
    acronym = uniqueAcronym(acronym || `A${asset.documents.length + 1}`, existingAcronyms);

    const storage = getStorageDriver();
    const storageKey = `uploads/asset-${asset.id}/${Date.now()}-${file.name}`;
    await storage.put(storageKey, bytes, "application/pdf");

    const document = await db.document.create({
      data: {
        assetId: asset.id,
        fileName: file.name,
        title,
        acronym,
        storageKey,
        pageCount: extracted.pageCount,
        order: asset.documents.length,
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

    return NextResponse.json({ document: { id: document.id, title, acronym, pageCount: extracted.pageCount } });
  } catch (err) {
    console.error("Asset document upload failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed while processing the document" },
      { status: 500 }
    );
  }
}

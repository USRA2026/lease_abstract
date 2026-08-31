import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorageDriver } from "@/lib/storage";
import { extractDocumentText } from "@/lib/pdf/reader";

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

    const title = (form.get("title") as string) || file.name.replace(/\.pdf$/i, "");
    const requestedAcronym = (form.get("acronym") as string)?.trim().toUpperCase();
    const acronym = requestedAcronym || `A${asset.documents.length + 1}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDocumentText(bytes);

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

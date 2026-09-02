import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyDocumentRename } from "@/lib/documents/rename";

export const runtime = "nodejs";

/** Edit a document's display title / citation acronym. Citations re-label to match. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data: { title?: string; acronym?: string } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      data.title = title;
    }
    if (typeof body.acronym === "string") {
      const acronym = body.acronym.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!acronym) return NextResponse.json({ error: "Acronym cannot be empty" }, { status: 400 });
      data.acronym = acronym;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const document = await applyDocumentRename(params.id, data);
    return NextResponse.json({ document });
  } catch (err) {
    console.error("Update document failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update document" }, { status: 500 });
  }
}

/** Remove a document (its pages and citations cascade-delete). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.document.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete document failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete document" }, { status: 500 });
  }
}

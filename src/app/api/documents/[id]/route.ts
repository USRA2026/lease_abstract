import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const before = await db.document.findUnique({ where: { id: params.id }, select: { acronym: true } });
    if (!before) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const document = await db.document.update({ where: { id: params.id }, data });

    // Keep existing citation labels in sync with a renamed acronym
    // ("U3 p. 1" -> "BL p. 1", "U3 § 6(b)" -> "BL § 6(b)"). Swap just the
    // acronym prefix so section references in the label are preserved.
    if (data.acronym && data.acronym !== before.acronym) {
      const escaped = before.acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const prefix = new RegExp("^" + escaped + "(?=\\s|$)", "i");
      const citations = await db.citation.findMany({ where: { documentId: document.id } });
      for (const c of citations) {
        const label = prefix.test(c.label)
          ? c.label.replace(prefix, document.acronym)
          : `${document.acronym} ${c.sectionRef ?? `p. ${c.page}`}`;
        if (label !== c.label) {
          await db.citation.update({ where: { id: c.id }, data: { label } });
        }
      }
    }

    return NextResponse.json({ document: { id: document.id, title: document.title, acronym: document.acronym } });
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

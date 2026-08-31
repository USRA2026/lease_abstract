import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data: { name?: string; assetId?: string | null } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Abstract name cannot be empty" }, { status: 400 });
      data.name = name;
    }
    if ("assetId" in body) {
      data.assetId = body.assetId ? String(body.assetId) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const abstract = await db.abstract.update({ where: { id: params.id }, data });
    return NextResponse.json({ abstract: { id: abstract.id, name: abstract.name, assetId: abstract.assetId } });
  } catch (err) {
    console.error("Update abstract failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update abstract" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Documents, fields, citations, rent/reporting rows, chat + extraction jobs
    // all cascade-delete with the abstract (see schema onDelete: Cascade).
    await db.abstract.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete abstract failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete abstract" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Section name cannot be empty" }, { status: 400 });
    const section = await db.templateSection.update({ where: { id: params.id }, data: { name } });
    return NextResponse.json({ section: { id: section.id, name: section.name } });
  } catch (err) {
    console.error("Rename section failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not rename section" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const valuesInUse = await db.abstractField.count({ where: { templateField: { sectionId: params.id } } });
    if (valuesInUse > 0) {
      return NextResponse.json(
        { error: `This section's fields hold ${valuesInUse} value(s) across abstracts. Clear those values before deleting.` },
        { status: 400 }
      );
    }
    // Fields cascade-delete with the section.
    await db.templateSection.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete section failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete section" }, { status: 500 });
  }
}

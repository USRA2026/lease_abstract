import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Template name cannot be empty" }, { status: 400 });
    const template = await db.template.update({ where: { id: params.id }, data: { name } });
    return NextResponse.json({ template: { id: template.id, name: template.name } });
  } catch (err) {
    console.error("Rename template failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not rename template" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const inUse = await db.abstract.count({ where: { templateId: params.id } });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `This template is used by ${inUse} abstract${inUse === 1 ? "" : "s"}. Reassign or delete those first.` },
        { status: 400 }
      );
    }
    // Sections and fields cascade-delete with the template.
    await db.template.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete template failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete template" }, { status: 500 });
  }
}

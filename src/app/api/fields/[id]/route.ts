import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const FIELD_TYPES = ["TEXT", "LONG_TEXT", "CURRENCY", "PERCENT", "DATE", "NUMBER"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data: { label?: string; fieldType?: (typeof FIELD_TYPES)[number]; helpText?: string | null } = {};
    if (typeof body.label === "string") {
      const label = body.label.trim();
      if (!label) return NextResponse.json({ error: "Field label cannot be empty" }, { status: 400 });
      data.label = label;
    }
    if (FIELD_TYPES.includes(body.fieldType)) data.fieldType = body.fieldType;
    if ("helpText" in body) data.helpText = typeof body.helpText === "string" && body.helpText.trim() ? body.helpText.trim() : null;

    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    const field = await db.templateField.update({ where: { id: params.id }, data });
    return NextResponse.json({ field: { id: field.id, label: field.label, fieldType: field.fieldType, helpText: field.helpText } });
  } catch (err) {
    console.error("Update field failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update field" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const valuesInUse = await db.abstractField.count({ where: { templateFieldId: params.id } });
    if (valuesInUse > 0) {
      return NextResponse.json(
        { error: `This field holds ${valuesInUse} value(s) across abstracts. Clear those values before deleting it.` },
        { status: 400 }
      );
    }
    await db.templateField.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete field failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete field" }, { status: 500 });
  }
}

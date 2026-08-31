import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

const FIELD_TYPES = ["TEXT", "LONG_TEXT", "CURRENCY", "PERCENT", "DATE", "NUMBER"] as const;
type FieldType = (typeof FIELD_TYPES)[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const helpText = typeof body.helpText === "string" && body.helpText.trim() ? body.helpText.trim() : null;
    const fieldType: FieldType = FIELD_TYPES.includes(body.fieldType) ? body.fieldType : "TEXT";
    if (!label) return NextResponse.json({ error: "A field label is required" }, { status: 400 });

    // Build a key unique within the section.
    const base = slugify(label) || "field";
    const existing = new Set((await db.templateField.findMany({ where: { sectionId: params.id }, select: { key: true } })).map((f) => f.key));
    let key = base;
    let n = 2;
    while (existing.has(key)) key = `${base}-${n++}`;

    const last = await db.templateField.findFirst({ where: { sectionId: params.id }, orderBy: { order: "desc" } });
    const field = await db.templateField.create({
      data: { sectionId: params.id, key, label, fieldType, helpText, order: (last?.order ?? -1) + 1 },
    });
    return NextResponse.json({ field: { id: field.id, key: field.key, label: field.label, fieldType: field.fieldType, helpText: field.helpText } });
  } catch (err) {
    console.error("Add field failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not add field" }, { status: 500 });
  }
}

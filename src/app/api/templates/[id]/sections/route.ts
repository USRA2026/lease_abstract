import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "A section name is required" }, { status: 400 });
    const last = await db.templateSection.findFirst({
      where: { templateId: params.id },
      orderBy: { order: "desc" },
    });
    const section = await db.templateSection.create({
      data: { templateId: params.id, name, order: (last?.order ?? -1) + 1 },
    });
    return NextResponse.json({ section: { id: section.id, name: section.name } });
  } catch (err) {
    console.error("Add section failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not add section" }, { status: 500 });
  }
}

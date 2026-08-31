import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeamId } from "@/lib/team";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const kind = body.kind === "LOAN" ? "LOAN" : body.kind === "LEASE" ? "LEASE" : null;
    if (!name) return NextResponse.json({ error: "A template name is required" }, { status: 400 });
    if (!kind) return NextResponse.json({ error: "Template kind must be LEASE or LOAN" }, { status: 400 });
    const teamId = await getTeamId();
    const template = await db.template.create({ data: { name, kind, teamId } });
    return NextResponse.json({ template: { id: template.id, name: template.name, kind: template.kind } });
  } catch (err) {
    console.error("Create template failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create template" }, { status: 500 });
  }
}

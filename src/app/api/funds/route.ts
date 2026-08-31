import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeamId } from "@/lib/team";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "A fund name is required" }, { status: 400 });
    }
    const teamId = await getTeamId();
    const fund = await db.fund.create({ data: { name, teamId } });
    return NextResponse.json({ fund: { id: fund.id, name: fund.name } });
  } catch (err) {
    console.error("Create fund failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create fund" }, { status: 500 });
  }
}

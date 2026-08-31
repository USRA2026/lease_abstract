import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeamId } from "@/lib/team";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const fundId = typeof body.fundId === "string" && body.fundId ? body.fundId : null;
    if (!name) {
      return NextResponse.json({ error: "An asset name is required" }, { status: 400 });
    }
    const teamId = await getTeamId();
    const asset = await db.asset.create({ data: { name, teamId, fundId } });
    return NextResponse.json({ asset: { id: asset.id, name: asset.name, fundId: asset.fundId } });
  } catch (err) {
    console.error("Create asset failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create asset" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeamId } from "@/lib/team";

export const runtime = "nodejs";

// Models the app allows selecting. Keep in sync with the Settings UI.
const ALLOWED_MODELS = ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Empty string / null clears the choice → falls back to env, then default.
    const raw = typeof body.aiModel === "string" ? body.aiModel.trim() : "";
    const aiModel = raw === "" ? null : raw;
    if (aiModel && !ALLOWED_MODELS.includes(aiModel)) {
      return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
    }
    const teamId = await getTeamId();
    await db.team.update({ where: { id: teamId }, data: { aiModel } });
    return NextResponse.json({ ok: true, aiModel });
  } catch (err) {
    console.error("Update settings failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update settings" }, { status: 500 });
  }
}

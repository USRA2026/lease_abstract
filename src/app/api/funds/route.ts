import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeamId } from "@/lib/team";
import { parseFundInput } from "@/lib/funds/input";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { data, error } = parseFundInput({ name: "", ...body });
    if (error) return NextResponse.json({ error }, { status: 400 });

    const teamId = await getTeamId();
    const fund = await db.fund.create({
      data: {
        name: data.name!,
        code: data.code ?? null,
        vintageYear: data.vintageYear ?? null,
        strategy: data.strategy ?? null,
        targetAmount: data.targetAmount ?? null,
        teamId,
      },
    });
    return NextResponse.json({ fund });
  } catch (err) {
    console.error("Create fund failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create fund" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseFundInput } from "@/lib/funds/input";

export const runtime = "nodejs";

/** Update any of: name, code, vintageYear, strategy, targetAmount. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { data, error } = parseFundInput(body);
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    const fund = await db.fund.update({ where: { id: params.id }, data });
    return NextResponse.json({ fund });
  } catch (err) {
    console.error("Update fund failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update fund" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Detach assets first so they become "Unaffiliated" rather than blocking the
    // delete on a foreign-key constraint.
    await db.asset.updateMany({ where: { fundId: params.id }, data: { fundId: null } });
    await db.fund.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete fund failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete fund" }, { status: 500 });
  }
}

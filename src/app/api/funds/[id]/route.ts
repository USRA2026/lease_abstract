import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "A fund name is required" }, { status: 400 });
    }
    const fund = await db.fund.update({ where: { id: params.id }, data: { name } });
    return NextResponse.json({ fund: { id: fund.id, name: fund.name } });
  } catch (err) {
    console.error("Rename fund failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not rename fund" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Detach assets first so they become "Unassigned" rather than blocking the
    // delete on a foreign-key constraint.
    await db.asset.updateMany({ where: { fundId: params.id }, data: { fundId: null } });
    await db.fund.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete fund failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete fund" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data: { name?: string; fundId?: string | null } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Asset name cannot be empty" }, { status: 400 });
      data.name = name;
    }
    // fundId may be an id, or explicitly null / "" to unassign.
    if ("fundId" in body) {
      data.fundId = body.fundId ? String(body.fundId) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const asset = await db.asset.update({ where: { id: params.id }, data });
    return NextResponse.json({ asset: { id: asset.id, name: asset.name, fundId: asset.fundId } });
  } catch (err) {
    console.error("Update asset failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update asset" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Abstracts on this asset are detached (assetId -> null) so they aren't
    // deleted; asset-level documents cascade-delete with the asset.
    await db.abstract.updateMany({ where: { assetId: params.id }, data: { assetId: null } });
    await db.asset.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete asset failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete asset" }, { status: 500 });
  }
}

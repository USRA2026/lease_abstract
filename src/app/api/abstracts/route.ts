import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(["LEASE", "LOAN"]),
  assetName: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const team = await db.team.findFirstOrThrow();
  const template = await db.template.findFirstOrThrow({ where: { teamId: team.id, kind: parsed.data.kind } });

  let asset = await db.asset.findFirst({ where: { teamId: team.id, name: parsed.data.assetName } });
  if (!asset) {
    asset = await db.asset.create({ data: { teamId: team.id, name: parsed.data.assetName } });
  }

  const abstract = await db.abstract.create({
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      teamId: team.id,
      templateId: template.id,
      assetId: asset.id,
      percentComplete: 0,
    },
  });

  return NextResponse.json({ id: abstract.id });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Recomputes an abstract's % complete as filled fields / total template fields. */
async function recomputePercentComplete(abstractId: string): Promise<number> {
  const abstract = await db.abstract.findUnique({
    where: { id: abstractId },
    include: {
      template: { include: { sections: { include: { fields: true } } } },
      fields: true,
    },
  });
  if (!abstract) return 0;
  const totalFields = abstract.template.sections.reduce((sum, s) => sum + s.fields.length, 0);
  const filled = abstract.fields.filter((f) => f.value.trim().length > 0).length;
  const percent = totalFields === 0 ? 0 : Math.round((filled / totalFields) * 100);
  await db.abstract.update({ where: { id: abstractId }, data: { percentComplete: percent } });
  return percent;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const templateFieldId = typeof body.templateFieldId === "string" ? body.templateFieldId : "";
    const value = typeof body.value === "string" ? body.value : "";
    if (!templateFieldId) {
      return NextResponse.json({ error: "templateFieldId is required" }, { status: 400 });
    }

    // Confirm the field belongs to this abstract's template.
    const templateField = await db.templateField.findUnique({
      where: { id: templateFieldId },
      include: { section: { include: { template: { include: { abstracts: { where: { id: params.id } } } } } } },
    });
    if (!templateField || templateField.section.template.abstracts.length === 0) {
      return NextResponse.json({ error: "That field does not belong to this abstract" }, { status: 400 });
    }

    if (value.trim().length === 0) {
      // Clearing a value removes the stored field (and its manual citations).
      await db.abstractField.deleteMany({ where: { abstractId: params.id, templateFieldId } });
    } else {
      await db.abstractField.upsert({
        where: { abstractId_templateFieldId: { abstractId: params.id, templateFieldId } },
        create: { abstractId: params.id, templateFieldId, value },
        update: { value },
      });
    }

    const percentComplete = await recomputePercentComplete(params.id);
    return NextResponse.json({ ok: true, percentComplete });
  } catch (err) {
    console.error("Update abstract field failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update field" }, { status: 500 });
  }
}

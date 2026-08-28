import { NextResponse } from "next/server";
import { getAbstractDetail } from "@/lib/abstracts/getAbstractDetail";
import { generateAbstractDocx } from "@/lib/export/docx";
import { slugify } from "@/lib/slugify";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const abstract = await getAbstractDetail(params.id);
  const buffer = await generateAbstractDocx(abstract);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slugify(abstract.name)}.docx"`,
    },
  });
}

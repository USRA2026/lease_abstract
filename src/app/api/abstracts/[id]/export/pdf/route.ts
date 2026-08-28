import { NextResponse } from "next/server";
import { getAbstractDetail } from "@/lib/abstracts/getAbstractDetail";
import { generateAbstractPdf } from "@/lib/export/pdf";
import { slugify } from "@/lib/slugify";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const abstract = await getAbstractDetail(params.id);
  const bytes = await generateAbstractPdf(abstract);

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slugify(abstract.name)}.pdf"`,
    },
  });
}

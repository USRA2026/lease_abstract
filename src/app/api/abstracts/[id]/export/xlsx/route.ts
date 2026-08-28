import { NextResponse } from "next/server";
import { getAbstractDetail } from "@/lib/abstracts/getAbstractDetail";
import { generateAbstractXlsx } from "@/lib/export/xlsx";
import { slugify } from "@/lib/slugify";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const abstract = await getAbstractDetail(params.id);
  const buffer = await generateAbstractXlsx(abstract);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slugify(abstract.name)}.xlsx"`,
    },
  });
}

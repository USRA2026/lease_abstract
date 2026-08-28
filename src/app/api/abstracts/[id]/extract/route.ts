import { NextRequest, NextResponse } from "next/server";
import { runExtraction } from "@/lib/extraction/pipeline";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await runExtraction(params.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

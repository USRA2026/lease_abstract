import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askAbstract } from "@/lib/chat/rag";

const bodySchema = z.object({
  question: z.string().min(1).max(2000),
  chatSessionId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = await askAbstract(params.id, parsed.data.question, parsed.data.chatSessionId);

  return NextResponse.json({
    id: message.id,
    chatSessionId: message.chatSessionId,
    role: message.role,
    content: message.content,
    citations: message.citations.map((c) => ({
      id: c.id,
      documentId: c.documentId,
      documentTitle: c.document.title,
      documentAcronym: c.document.acronym,
      page: c.page,
      label: c.label,
      snippet: c.snippet,
      highlightRects: c.highlightRects,
    })),
  });
}

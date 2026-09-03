import { db } from "@/lib/db";
import { getAiProvider } from "@/lib/ai";
import type { AiDocumentInput } from "@/lib/ai/types";
import { isSparseText } from "@/lib/ai/sparse";
import { getStorageDriver } from "@/lib/storage";
import { locateSnippet } from "@/lib/pdf/locate";
import type { LayoutLine, Rect } from "@/lib/pdf/writer";
import { PAGE_HEIGHT, PAGE_WIDTH, MARGIN } from "@/lib/pdf/writer";

const FALLBACK_PAGE_RECT: Rect = {
  x: MARGIN,
  y: MARGIN,
  width: PAGE_WIDTH - MARGIN * 2,
  height: PAGE_HEIGHT - MARGIN * 2,
};

/**
 * Answers a natural-language question about one abstract's source
 * documents (the "Ask AI" panel). Retrieves every attached document's
 * stored page text, asks the configured AI provider for an answer +
 * citations, resolves each citation to a highlight rect, and persists the
 * turn so the conversation has history.
 */
export async function askAbstract(abstractId: string, question: string, chatSessionId?: string) {
  const abstract = await db.abstract.findUniqueOrThrow({
    where: { id: abstractId },
    include: { documents: { include: { pages: true }, orderBy: { order: "asc" } } },
  });

  const existingSession = chatSessionId
    ? await db.chatSession.findUniqueOrThrow({
        where: { id: chatSessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;
  const session = existingSession ?? (await db.chatSession.create({ data: { abstractId } }));
  const priorMessages = existingSession?.messages ?? [];

  await db.chatMessage.create({
    data: { chatSessionId: session.id, role: "USER", content: question },
  });

  const ai = getAiProvider();
  const storage = getStorageDriver();
  const aiDocuments: AiDocumentInput[] = await Promise.all(
    abstract.documents.map(async (d) => {
      const pages = d.pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text }));
      const doc: AiDocumentInput = { documentId: d.id, acronym: d.acronym, title: d.title, pages };
      if (isSparseText(pages)) {
        try {
          doc.pdfBase64 = (await storage.get(d.storageKey)).toString("base64");
        } catch (err) {
          console.warn(`Could not load raw PDF for OCR fallback (document ${d.id})`, err);
        }
      }
      return doc;
    })
  );

  const history = priorMessages.map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  const result = await ai.answerQuestion({ question, history, documents: aiDocuments });

  const assistantMessage = await db.chatMessage.create({
    data: { chatSessionId: session.id, role: "ASSISTANT", content: result.answer },
  });

  for (const citation of result.citations) {
    const doc = abstract.documents.find((d) => d.id === citation.documentId);
    if (!doc) continue;
    const page = doc.pages.find((p) => p.pageNumber === citation.page);
    const lines = (page?.layout as unknown as LayoutLine[]) ?? [];
    const rects = locateSnippet(lines, citation.snippet, FALLBACK_PAGE_RECT);
    await db.citation.create({
      data: {
        documentId: doc.id,
        chatMessageId: assistantMessage.id,
        page: citation.page,
        label: `${doc.acronym} p. ${citation.page}`,
        snippet: citation.snippet,
        highlightRects: rects as object,
      },
    });
  }

  return db.chatMessage.findUniqueOrThrow({
    where: { id: assistantMessage.id },
    include: { citations: { include: { document: true } } },
  });
}

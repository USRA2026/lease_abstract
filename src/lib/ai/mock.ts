import type { AiChatResult, AiDocumentInput, AiExtractedField, AiProvider, AiTemplateFieldSpec } from "./types";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "what", "which", "does", "will",
  "under", "from", "have", "has", "are", "any", "who", "when", "how", "much",
  "than", "into", "such", "shall", "must", "would", "could", "about", "there",
]);

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%$.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

/**
 * Deterministic, dependency-free stand-in for a real LLM. It looks for
 * "Label: value" style clauses (the shape our own generated demo PDFs use,
 * and a shape many real lease/loan riders share) and does keyword-overlap
 * retrieval for chat. This lets the full abstraction + Q&A pipeline run end
 * to end with zero external credentials — swap AI_PROVIDER=azure once
 * Azure OpenAI + Document Intelligence credentials are configured (see
 * lib/ai/azure.ts) to get real semantic extraction and answers instead.
 */
export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async extractFields(input: {
    fields: AiTemplateFieldSpec[];
    documents: AiDocumentInput[];
  }): Promise<AiExtractedField[]> {
    const results: AiExtractedField[] = [];
    const allLabels = input.fields.map((f) => f.label);

    for (const field of input.fields) {
      let found: AiExtractedField | null = null;

      for (const doc of input.documents) {
        for (const page of doc.pages) {
          const idx = page.text.toLowerCase().indexOf(`${field.label.toLowerCase()}:`);
          if (idx === -1) continue;

          const afterLabel = page.text.slice(idx + field.label.length + 1);
          let cut = afterLabel.length;
          for (const other of allLabels) {
            if (other === field.label) continue;
            const otherIdx = afterLabel.toLowerCase().indexOf(`${other.toLowerCase()}:`);
            if (otherIdx !== -1 && otherIdx < cut) cut = otherIdx;
          }
          const value = afterLabel.slice(0, Math.min(cut, 500)).trim();
          if (!value) continue;

          found = {
            key: field.key,
            value,
            confidence: 0.72,
            documentId: doc.documentId,
            page: page.pageNumber,
            snippet: value.slice(0, 160),
          };
          break;
        }
        if (found) break;
      }

      results.push(
        found ?? {
          key: field.key,
          value: "Not found in provided documents",
          confidence: 0,
        }
      );
    }

    return results;
  }

  async answerQuestion(input: {
    question: string;
    history: { role: "user" | "assistant"; content: string }[];
    documents: AiDocumentInput[];
  }): Promise<AiChatResult> {
    const qWords = keywords(input.question);
    if (qWords.length === 0) {
      return {
        answer: "Ask a more specific question about the tenant, dates, rent, or key lease/loan terms and I'll cite exactly where the answer comes from.",
        citations: [],
      };
    }

    type Scored = { doc: AiDocumentInput; page: number; text: string; score: number };
    const scored: Scored[] = [];
    for (const doc of input.documents) {
      for (const page of doc.pages) {
        const pageWords = page.text.toLowerCase();
        const score = qWords.reduce((sum, w) => sum + (pageWords.includes(w) ? 1 : 0), 0);
        if (score > 0) scored.push({ doc, page: page.pageNumber, text: page.text, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);

    if (top.length === 0) {
      return {
        answer:
          "I couldn't find anything in this abstract's documents that speaks to that. Try rephrasing, or check that the relevant document has been uploaded.",
        citations: [],
      };
    }

    const citations = top.map((hit) => {
      const firstWord = qWords.find((w) => hit.text.toLowerCase().includes(w)) ?? qWords[0];
      const idx = hit.text.toLowerCase().indexOf(firstWord);
      const start = Math.max(0, idx - 100);
      const snippet = hit.text.slice(start, start + 260).trim();
      return { documentId: hit.doc.documentId, page: hit.page, snippet };
    });

    const answerLines = citations.map(
      (c, i) => `${top[i].doc.acronym} p. ${c.page}: "${c.snippet.replace(/\s+/g, " ")}"`
    );

    return {
      answer: `Here's what the documents say:\n\n${answerLines.join("\n\n")}`,
      citations,
    };
  }
}

import type { AiChatResult, AiDocumentInput, AiExtractedField, AiProvider, AiTemplateFieldSpec } from "./types";
import { buildDocumentContext } from "./context";

function extractJson<T>(raw: string): T | null {
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Real AI provider backed by Azure OpenAI (chat completions) for both field
 * extraction and the Q&A agent. Field-level bounding boxes for uploaded
 * documents should come from Azure AI Document Intelligence's layout model
 * in production (see infra/main.bicep for the resource); this client keeps
 * that as a follow-up hook (`page`/`snippet` are resolved to a highlight
 * rect afterwards via lib/pdf/locate.ts) so extraction quality can improve
 * without changing the pipeline's shape.
 */
export class AzureOpenAiProvider implements AiProvider {
  readonly name = "azure-openai";

  private async client() {
    const { AzureOpenAI } = await import("openai");
    return new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview",
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_CHAT ?? "gpt-4o",
    });
  }

  async extractFields(input: {
    fields: AiTemplateFieldSpec[];
    documents: AiDocumentInput[];
  }): Promise<AiExtractedField[]> {
    const client = await this.client();
    const context = buildDocumentContext(input.documents);
    const fieldList = input.fields
      .map((f) => `- key: "${f.key}", label: "${f.label}", section: "${f.sectionName}"${f.helpText ? `, hint: "${f.helpText}"` : ""}`)
      .join("\n");

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_CHAT ?? "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a commercial real estate lease/loan abstraction analyst. Extract the requested fields strictly from the provided document excerpts. Never invent facts. If a field is not addressed in the documents, set value to \"N/A\" and confidence to 0. Always quote the exact source sentence in `snippet` and name the documentId + page it came from.",
        },
        {
          role: "user",
          content: `Fields to extract:\n${fieldList}\n\nDocument excerpts:\n${context}\n\nRespond with a JSON array, one object per requested field key, each shaped exactly as: {"key": string, "value": string, "confidence": number between 0 and 1, "documentId": string, "page": number, "snippet": string}.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    const parsed = extractJson<AiExtractedField[] | { results: AiExtractedField[] }>(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.results ?? [];
    return input.fields.map((field) => {
      const match = list.find((r) => r.key === field.key);
      return (
        match ?? {
          key: field.key,
          value: "N/A",
          confidence: 0,
        }
      );
    });
  }

  async answerQuestion(input: {
    question: string;
    history: { role: "user" | "assistant"; content: string }[];
    documents: AiDocumentInput[];
  }): Promise<AiChatResult> {
    const client = await this.client();
    const context = buildDocumentContext(input.documents);

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_CHAT ?? "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a commercial real estate contract analyst answering questions about a specific abstract's source documents. Answer only from the provided excerpts, and cite every claim with the exact documentId, page number, and a verbatim quoted snippet it came from. If the documents don't address the question, say so plainly.",
        },
        ...input.history.map((m) => ({ role: m.role, content: m.content }) as const),
        {
          role: "user",
          content: `Document excerpts:\n${context}\n\nQuestion: ${input.question}\n\nRespond with JSON shaped exactly as: {"answer": string, "citations": [{"documentId": string, "page": number, "snippet": string}]}.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = extractJson<AiChatResult>(raw);
    return parsed ?? { answer: raw, citations: [] };
  }
}

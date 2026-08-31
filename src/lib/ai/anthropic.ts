import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AiChatResult, AiDocumentInput, AiExtractedField, AiProvider, AiTemplateFieldSpec } from "./types";
import { buildDocumentContext } from "./context";

const DEFAULT_MODEL = "claude-opus-5";

const ExtractedFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
  confidence: z.number(),
  documentId: z.string().nullable().optional(),
  page: z.number().nullable().optional(),
  snippet: z.string().nullable().optional(),
});

const ExtractFieldsResultSchema = z.object({
  fields: z.array(ExtractedFieldSchema),
});

const ChatAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      documentId: z.string(),
      page: z.number(),
      snippet: z.string(),
    })
  ),
});

/**
 * Real AI provider backed by the Claude API for both field extraction and
 * the Q&A agent. Uses structured outputs (`output_config.format` with a Zod
 * schema via `messages.parse()`) so responses are validated against a
 * schema instead of hoping the model's prose contains parseable JSON, the
 * way the Azure OpenAI provider has to.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = "claude";

  private client() {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  private get model() {
    return process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  }

  async extractFields(input: {
    fields: AiTemplateFieldSpec[];
    documents: AiDocumentInput[];
  }): Promise<AiExtractedField[]> {
    const client = this.client();
    const context = buildDocumentContext(input.documents);
    const fieldList = input.fields
      .map((f) => `- key: "${f.key}", label: "${f.label}", section: "${f.sectionName}"${f.helpText ? `, hint: "${f.helpText}"` : ""}`)
      .join("\n");

    // Stream with generous headroom: extracting every template field at once
    // (a Lease template is ~70 fields) is a large structured output, and with
    // adaptive thinking on top a 16K cap can truncate the JSON mid-object,
    // which makes parsing fail and returns nothing. Streaming avoids HTTP
    // timeouts on the larger max_tokens (per the SDK guidance).
    const stream = client.messages.stream({
      model: this.model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system:
        'You are a commercial real estate lease/loan abstraction analyst. Extract the requested fields strictly from the provided document excerpts. Never invent facts. If a field is not addressed in the documents, set value to "N/A" and confidence to 0. Always quote the exact source sentence in `snippet` and name the documentId + page it came from.',
      messages: [
        {
          role: "user",
          content: `Fields to extract:\n${fieldList}\n\nDocument excerpts:\n${context}\n\nReturn one result per requested field key, in the same order.`,
        },
      ],
      output_config: { format: zodOutputFormat(ExtractFieldsResultSchema) },
    });
    const response = await stream.finalMessage();
    if (response.stop_reason === "refusal") {
      throw new Error("The AI declined to process these documents.");
    }

    const results = response.parsed_output?.fields ?? [];
    return input.fields.map((field) => {
      const match = results.find((r) => r.key === field.key);
      if (!match) return { key: field.key, value: "N/A", confidence: 0 };
      return {
        key: match.key,
        value: match.value,
        confidence: match.confidence,
        documentId: match.documentId ?? undefined,
        page: match.page ?? undefined,
        snippet: match.snippet ?? undefined,
      };
    });
  }

  async answerQuestion(input: {
    question: string;
    history: { role: "user" | "assistant"; content: string }[];
    documents: AiDocumentInput[];
  }): Promise<AiChatResult> {
    const client = this.client();
    const context = buildDocumentContext(input.documents);

    const stream = client.messages.stream({
      model: this.model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system:
        "You are a commercial real estate contract analyst answering questions about a specific abstract's source documents. Answer only from the provided excerpts, and cite every claim with the exact documentId, page number, and a verbatim quoted snippet it came from. If the documents don't address the question, say so plainly.",
      messages: [
        ...input.history.map((m) => ({ role: m.role, content: m.content }) as const),
        {
          role: "user",
          content: `Document excerpts:\n${context}\n\nQuestion: ${input.question}`,
        },
      ],
      output_config: { format: zodOutputFormat(ChatAnswerSchema) },
    });
    const response = await stream.finalMessage();

    return response.parsed_output ?? { answer: "I couldn't produce an answer for that.", citations: [] };
  }
}

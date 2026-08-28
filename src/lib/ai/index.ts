import type { AiProvider } from "./types";
import { MockAiProvider } from "./mock";

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;

  const explicit = process.env.AI_PROVIDER;
  const hasAzureCreds = Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);

  if (explicit === "azure" || (explicit !== "mock" && hasAzureCreds)) {
    const { AzureOpenAiProvider } = require("./azure") as typeof import("./azure");
    cached = new AzureOpenAiProvider();
  } else {
    cached = new MockAiProvider();
  }
  return cached;
}

export type { AiProvider, AiTemplateFieldSpec, AiDocumentInput, AiExtractedField, AiChatResult } from "./types";

import type { AiProvider } from "./types";
import { MockAiProvider } from "./mock";

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;

  const explicit = process.env.AI_PROVIDER;
  const hasAzureCreds = Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
  const hasAnthropicCreds = Boolean(process.env.ANTHROPIC_API_KEY);

  if (explicit === "claude" || explicit === "anthropic") {
    const { AnthropicProvider } = require("./anthropic") as typeof import("./anthropic");
    cached = new AnthropicProvider();
  } else if (explicit === "azure") {
    const { AzureOpenAiProvider } = require("./azure") as typeof import("./azure");
    cached = new AzureOpenAiProvider();
  } else if (explicit === "mock") {
    cached = new MockAiProvider();
  } else if (hasAzureCreds) {
    const { AzureOpenAiProvider } = require("./azure") as typeof import("./azure");
    cached = new AzureOpenAiProvider();
  } else if (hasAnthropicCreds) {
    const { AnthropicProvider } = require("./anthropic") as typeof import("./anthropic");
    cached = new AnthropicProvider();
  } else {
    cached = new MockAiProvider();
  }
  return cached;
}

export type { AiProvider, AiTemplateFieldSpec, AiDocumentInput, AiExtractedField, AiChatResult } from "./types";

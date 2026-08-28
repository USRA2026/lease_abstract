export interface AiTemplateFieldSpec {
  key: string;
  label: string;
  sectionName: string;
  fieldType: string;
  helpText?: string;
}

export interface AiDocumentInput {
  documentId: string;
  acronym: string;
  title: string;
  pages: { pageNumber: number; text: string }[];
}

export interface AiExtractedField {
  key: string;
  value: string;
  confidence: number;
  documentId?: string;
  page?: number;
  snippet?: string;
}

export interface AiChatCitation {
  documentId: string;
  page: number;
  snippet: string;
}

export interface AiChatResult {
  answer: string;
  citations: AiChatCitation[];
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiProvider {
  readonly name: string;
  extractFields(input: {
    fields: AiTemplateFieldSpec[];
    documents: AiDocumentInput[];
  }): Promise<AiExtractedField[]>;
  answerQuestion(input: {
    question: string;
    history: ChatHistoryMessage[];
    documents: AiDocumentInput[];
  }): Promise<AiChatResult>;
}

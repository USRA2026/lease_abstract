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
  /** Section/article reference the value came from, e.g. "§ 6(b)" or "Art. 2(2.1)". */
  sectionRef?: string;
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
  /**
   * Optional: infer a clean display title and a short citation acronym for an
   * uploaded document from its filename + opening text, e.g. "Warehouse Lease
   * Agreement" / "BL", "First Amendment To Warehouse Lease Agreement" / "1A".
   * Providers that don't implement it fall back to the filename and a generic
   * U1/U2 acronym.
   */
  describeDocument?(input: {
    fileName: string;
    firstPageText: string;
    existingAcronyms: string[];
    abstractKind?: string;
  }): Promise<{ title: string; acronym: string }>;
}

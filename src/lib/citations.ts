export interface CitationLabelParts {
  acronym: string;
  sectionRef?: string;
  pageText?: string;
}

/**
 * Splits a citation label like "BL p. 1", "LDOTSA § 2.12(c)" or
 * "LDOTSA §§ 2.12(c),(d), 8.1,8.2" into its document acronym and the
 * page/section reference, mirroring the bracketed citations abstractcre.com
 * appends to every abstracted value (e.g. "...[BL p. 1]").
 */
export function parseCitationLabel(raw: string): CitationLabelParts {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\S+)\s+(.*)$/);
  if (!match) return { acronym: trimmed };
  const [, acronym, rest] = match;
  if (/^p\.?\s*\d/i.test(rest)) {
    return { acronym, pageText: rest };
  }
  return { acronym, sectionRef: rest };
}

export function formatCitationLabel(parts: CitationLabelParts): string {
  return [parts.acronym, parts.pageText ?? parts.sectionRef].filter(Boolean).join(" ");
}

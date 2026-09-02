/**
 * Helpers for naming uploaded documents the way abstractors cite them.
 */

/** Ensures an acronym is unique within an abstract's document set (BL, BL2, BL3...). */
export function uniqueAcronym(base: string, existing: string[]): string {
  const cleaned = (base || "DOC").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "DOC";
  const taken = new Set(existing.map((a) => a.toUpperCase()));
  if (!taken.has(cleaned)) return cleaned;
  let n = 2;
  while (taken.has(`${cleaned}${n}`)) n++;
  return `${cleaned}${n}`;
}

/** Fallback display title from a filename: strip the extension and tidy separators. */
export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

import type { LayoutLine, Rect } from "./writer";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Given the layout lines captured for one page, finds the line(s) whose
 * text best matches a free-text snippet (as produced by an LLM quoting a
 * clause) and returns their bounding boxes. Used to turn a chat answer's
 * cited quote, or a real Azure Document Intelligence result, into a
 * highlight rectangle. Falls back to the single best-overlap line, then to
 * the whole page, so a citation always has *something* to highlight.
 */
export function locateSnippet(lines: LayoutLine[], snippet: string, pageRect: Rect): Rect[] {
  if (lines.length === 0) return [pageRect];

  const target = normalize(snippet);
  if (!target) return [pageRect];
  const needle = target.slice(0, 80);

  for (let start = 0; start < lines.length; start++) {
    let acc = "";
    for (let end = start; end < lines.length && end < start + 6; end++) {
      acc = acc ? `${acc} ${normalize(lines[end].text)}` : normalize(lines[end].text);
      if (acc.includes(needle)) {
        return lines.slice(start, end + 1).map(({ x, y, width, height }) => ({ x, y, width, height }));
      }
    }
  }

  const targetWords = new Set(target.split(" ").filter((w) => w.length > 3));
  let best: LayoutLine | null = null;
  let bestScore = 0;
  for (const line of lines) {
    const words = normalize(line.text).split(" ");
    const score = words.filter((w) => targetWords.has(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = line;
    }
  }
  if (best) {
    const { x, y, width, height } = best;
    return [{ x, y, width, height }];
  }
  return [pageRect];
}

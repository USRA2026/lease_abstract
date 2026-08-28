import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecordedSpan {
  key: string;
  page: number;
  rects: Rect[];
  snippet: string;
}

export interface LayoutLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageState {
  page: PDFPage;
  pageNumber: number;
  cursorY: number;
  text: string;
}

export const PAGE_WIDTH = 612; // US Letter, points
export const PAGE_HEIGHT = 792;
export const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10;
const HEADING_SIZE = 12;
const LINE_HEIGHT = 14;
const HEADING_LINE_HEIGHT = 18;

const CHAR_REPLACEMENTS: Record<string, string> = {
  "≤": "<=",
  "≥": ">=",
  "≠": "!=",
  "×": "x",
  "÷": "/",
  "→": "->",
  "–": "-",
  "—": "--",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "…": "...",
  "•": "-",
};

/** Standard PDF fonts only support WinAnsi (roughly Latin-1); swap out or drop anything else. */
function sanitizeForPdf(text: string): string {
  const replaced = text.replace(/[≠≤≥×÷→–—‘’“”…•]/g, (ch) => CHAR_REPLACEMENTS[ch] ?? ch);
  return Array.from(replaced)
    .map((ch) => (ch.charCodeAt(0) <= 0xff ? ch : "?"))
    .join("");
}

/**
 * Minimal text-layout engine for building the synthetic demo PDFs used to
 * seed this prototype. Because we draw every line ourselves, we know its
 * exact page + bounding box, so citations can highlight the precise clause
 * text with no OCR/inference step required (unlike real uploaded PDFs,
 * which go through `lib/pdf/reader.ts` + the extraction pipeline instead).
 */
export class PdfWriter {
  private doc!: PDFDocument;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private pages: PageState[] = [];
  private spans: RecordedSpan[] = [];
  private pageTexts: string[] = [];
  private pageLines: LayoutLine[][] = [];

  static async create(): Promise<PdfWriter> {
    const writer = new PdfWriter();
    writer.doc = await PDFDocument.create();
    writer.font = await writer.doc.embedFont(StandardFonts.Helvetica);
    writer.boldFont = await writer.doc.embedFont(StandardFonts.HelveticaBold);
    writer.newPage();
    return writer;
  }

  private newPage() {
    const page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const pageNumber = this.pages.length + 1;
    this.pages.push({ page, pageNumber, cursorY: PAGE_HEIGHT - MARGIN, text: "" });
    this.pageTexts.push("");
    this.pageLines.push([]);
  }

  private get current(): PageState {
    return this.pages[this.pages.length - 1];
  }

  private ensureSpace(height: number) {
    if (this.current.cursorY - height < MARGIN) {
      this.newPage();
    }
  }

  private wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const rawLine of text.split("\n")) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  /** Draws a document/page title banner at the top of the current page. */
  documentHeader(title: string, subtitle: string) {
    title = sanitizeForPdf(title);
    subtitle = sanitizeForPdf(subtitle);
    this.ensureSpace(40);
    const state = this.current;
    state.page.drawText(title, {
      x: MARGIN,
      y: state.cursorY,
      size: HEADING_SIZE + 2,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.15),
    });
    state.cursorY -= HEADING_LINE_HEIGHT;
    state.page.drawText(subtitle, {
      x: MARGIN,
      y: state.cursorY,
      size: BODY_SIZE - 1,
      font: this.font,
      color: rgb(0.4, 0.4, 0.45),
    });
    state.cursorY -= HEADING_LINE_HEIGHT;
    state.page.drawLine({
      start: { x: MARGIN, y: state.cursorY },
      end: { x: PAGE_WIDTH - MARGIN, y: state.cursorY },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.75),
    });
    state.cursorY -= 16;
  }

  /** Draws a section heading, e.g. "1.  Definitions". */
  heading(text: string) {
    text = sanitizeForPdf(text);
    this.ensureSpace(HEADING_LINE_HEIGHT + 6);
    const state = this.current;
    state.page.drawText(text, {
      x: MARGIN,
      y: state.cursorY,
      size: HEADING_SIZE,
      font: this.boldFont,
      color: rgb(0.05, 0.05, 0.1),
    });
    this.pageLines[state.pageNumber - 1].push({
      text,
      x: MARGIN - 2,
      y: state.cursorY - 3,
      width: this.boldFont.widthOfTextAtSize(text, HEADING_SIZE) + 4,
      height: HEADING_LINE_HEIGHT,
    });
    state.cursorY -= HEADING_LINE_HEIGHT + 4;
  }

  /**
   * Draws a body paragraph. When `key` is supplied, records the exact
   * bounding box of every wrapped line so a citation can later highlight
   * this precise passage in the PDF viewer.
   */
  paragraph(text: string, key?: string): RecordedSpan | undefined {
    text = sanitizeForPdf(text);
    const lines = this.wrapLines(text, this.font, BODY_SIZE, CONTENT_WIDTH);
    const rects: Rect[] = [];
    for (const line of lines) {
      this.ensureSpace(LINE_HEIGHT);
      const state = this.current;
      const width = this.font.widthOfTextAtSize(line, BODY_SIZE);
      state.page.drawText(line, {
        x: MARGIN,
        y: state.cursorY,
        size: BODY_SIZE,
        font: this.font,
        color: rgb(0.15, 0.15, 0.18),
      });
      const rect: Rect = { x: MARGIN - 2, y: state.cursorY - 3, width: width + 4, height: LINE_HEIGHT };
      rects.push(rect);
      (rects[rects.length - 1] as Rect & { page?: number }).page = state.pageNumber;
      this.pageLines[state.pageNumber - 1].push({ text: line, ...rect });
      state.text += (state.text ? " " : "") + line;
      this.pageTexts[state.pageNumber - 1] += (this.pageTexts[state.pageNumber - 1] ? " " : "") + line;
      state.cursorY -= LINE_HEIGHT;
    }
    this.current.cursorY -= 6;

    if (!key) return undefined;
    // A paragraph never spans pages in these demo docs (each clause is
    // short), so every recorded rect shares the same page number.
    const page = (rects[0] as Rect & { page: number })?.page ?? this.current.pageNumber;
    const span: RecordedSpan = {
      key,
      page,
      rects: rects.map(({ x, y, width, height }) => ({ x, y, width, height })),
      snippet: text,
    };
    this.spans.push(span);
    return span;
  }

  spacer(height = 10) {
    this.ensureSpace(height);
    this.current.cursorY -= height;
  }

  getSpans(): RecordedSpan[] {
    return this.spans;
  }

  getPageTexts(): string[] {
    return this.pageTexts;
  }

  getPageLines(): LayoutLine[][] {
    return this.pageLines;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  async save(): Promise<Uint8Array> {
    return this.doc.save();
  }
}

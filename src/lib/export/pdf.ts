import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { sanitizeForPdf } from "@/lib/pdf/writer";
import type { AbstractDetail } from "@/lib/abstracts/getAbstractDetail";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function hex(h: string) {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const PRIMARY = hex("#0C5AA9");
const NAVY = hex("#14426F");
const DEEP_NAVY = hex("#091E30");
const GRAY = hex("#707070");

class Report {
  private doc!: PDFDocument;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private page!: PDFPage;
  private y = 0;

  static async create() {
    const report = new Report();
    report.doc = await PDFDocument.create();
    report.font = await report.doc.embedFont(StandardFonts.Helvetica);
    report.boldFont = await report.doc.embedFont(StandardFonts.HelveticaBold);
    report.newPage();
    return report;
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN + 20) this.newPage();
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const raw of text.split("\n")) {
      const words = raw.split(/\s+/).filter(Boolean);
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
      if (line || words.length === 0) lines.push(line);
    }
    return lines;
  }

  title(text: string) {
    text = sanitizeForPdf(text);
    this.ensureSpace(28);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 20, font: this.boldFont, color: PRIMARY });
    this.y -= 28;
  }

  subtitle(text: string) {
    text = sanitizeForPdf(text);
    this.ensureSpace(16);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 10, font: this.font, color: GRAY });
    this.y -= 20;
  }

  divider() {
    this.ensureSpace(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color: NAVY,
    });
    this.y -= 16;
  }

  heading(text: string) {
    text = sanitizeForPdf(text);
    this.ensureSpace(22);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 13, font: this.boldFont, color: NAVY });
    this.y -= 20;
  }

  field(label: string, value: string) {
    const labelWidth = 150;
    const lines = this.wrap(sanitizeForPdf(value || "Not yet abstracted"), this.font, 10, CONTENT_WIDTH - labelWidth);
    this.ensureSpace(14 * Math.max(lines.length, 1));
    this.page.drawText(sanitizeForPdf(label), { x: MARGIN, y: this.y, size: 10, font: this.boldFont, color: GRAY });
    let ly = this.y;
    for (const line of lines) {
      this.page.drawText(line, { x: MARGIN + labelWidth, y: ly, size: 10, font: this.font, color: DEEP_NAVY });
      ly -= 14;
    }
    this.y = Math.min(this.y, ly) - 4;
  }

  tableRow(cols: { text: string; width: number }[], opts?: { header?: boolean; shaded?: boolean }) {
    const font = opts?.header ? this.boldFont : this.font;
    const color = opts?.header ? rgb(1, 1, 1) : DEEP_NAVY;
    const size = 9;
    const rowHeight = 16;
    this.ensureSpace(rowHeight);

    if (opts?.header) {
      this.page.drawRectangle({ x: MARGIN, y: this.y - rowHeight + 4, width: CONTENT_WIDTH, height: rowHeight, color: NAVY });
    } else if (opts?.shaded) {
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - rowHeight + 4,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: hex("#BFDCF3"),
        opacity: 0.5,
      });
    }

    let x = MARGIN + 4;
    for (const col of cols) {
      const text = this.wrap(sanitizeForPdf(col.text), font, size, col.width - 8)[0] ?? "";
      this.page.drawText(text, { x, y: this.y - 11, size, font, color });
      x += col.width;
    }
    this.y -= rowHeight;
  }

  spacer(h = 10) {
    this.ensureSpace(h);
    this.y -= h;
  }

  async save() {
    return this.doc.save();
  }
}

/** Builds a brand-styled PDF report of an abstract's sections/fields. */
export async function generateAbstractPdf(abstract: AbstractDetail): Promise<Uint8Array> {
  const report = await Report.create();

  report.title(abstract.name);
  report.subtitle(
    `${abstract.templateName} abstract${abstract.assetName ? ` for ${abstract.assetName}` : ""}${
      abstract.fundName ? ` (${abstract.fundName})` : ""
    } — ${abstract.percentComplete}% complete — last updated ${abstract.updatedAt.toISOString().slice(0, 10)}`
  );
  report.divider();

  for (const section of abstract.sections) {
    report.heading(section.name);
    for (const field of section.fields) {
      const citationSuffix = field.citations.length ? ` [${field.citations.map((c) => c.label).join(", ")}]` : "";
      report.field(field.label, `${field.value ?? ""}${citationSuffix}`);
    }
    report.spacer(8);
  }

  if (abstract.rentSchedule.length > 0) {
    report.heading("Base Rent Schedule");
    const widths = [70, 70, 90, 70, CONTENT_WIDTH - 300];
    report.tableRow(
      [
        { text: "Start", width: widths[0] },
        { text: "End", width: widths[1] },
        { text: "$/Month", width: widths[2] },
        { text: "% Increase", width: widths[3] },
        { text: "Document", width: widths[4] },
      ],
      { header: true }
    );
    abstract.rentSchedule.forEach((row, i) => {
      report.tableRow(
        [
          { text: row.start, width: widths[0] },
          { text: row.end, width: widths[1] },
          { text: row.monthlyRent, width: widths[2] },
          { text: row.percentIncrease ?? "N/A", width: widths[3] },
          { text: row.sourceDocument, width: widths[4] },
        ],
        { shaded: i % 2 === 1 }
      );
    });
    report.spacer(12);
  }

  if (abstract.reportingRequirements.length > 0) {
    report.heading("Loan Reporting Requirements");
    const widths = [CONTENT_WIDTH - 220, 100, 120];
    report.tableRow(
      [
        { text: "Item", width: widths[0] },
        { text: "Frequency", width: widths[1] },
        { text: "Due By", width: widths[2] },
      ],
      { header: true }
    );
    abstract.reportingRequirements.forEach((row, i) => {
      report.tableRow(
        [
          { text: row.item, width: widths[0] },
          { text: row.frequency, width: widths[1] },
          { text: row.dueBy, width: widths[2] },
        ],
        { shaded: i % 2 === 1 }
      );
    });
    report.spacer(12);
  }

  if (abstract.missingDocuments) {
    report.heading("Missing Documents");
    report.field("", abstract.missingDocuments);
  }

  return report.save();
}

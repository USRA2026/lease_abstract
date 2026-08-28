import {
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { AbstractDetail } from "@/lib/abstracts/getAbstractDetail";

const PRIMARY = "0C5AA9";
const NAVY = "14426F";
const DEEP_NAVY = "091E30";
const PALE = "BFDCF3";
const GRAY = "707070";

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function labelValueRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: noBorder,
        children: [new Paragraph({ children: [new TextRun({ text: label, color: GRAY, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: noBorder,
        children: [new Paragraph({ children: [new TextRun({ text: value || "N/A", color: DEEP_NAVY, size: 22 })] })],
      }),
    ],
  });
}

function headerCell(text: string, widthPct: number) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })] })],
  });
}

function dataCell(text: string, widthPct: number, shaded: boolean) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: shaded ? { type: ShadingType.SOLID, color: PALE, fill: PALE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, color: DEEP_NAVY, size: 20 })] })],
  });
}

/** Builds a brand-styled Word document mirroring the abstract's sections/fields. */
export async function generateAbstractDocx(abstract: AbstractDetail): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: abstract.name, bold: true, color: PRIMARY, size: 32 })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${abstract.templateName} abstract${abstract.assetName ? ` for ${abstract.assetName}` : ""}${abstract.fundName ? ` (${abstract.fundName})` : ""}`,
          color: GRAY,
          size: 20,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${abstract.percentComplete}% complete. Last updated ${abstract.updatedAt.toISOString().slice(0, 10)}.`,
          color: GRAY,
          size: 18,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  for (const section of abstract.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.name, bold: true, color: NAVY, size: 24 })],
        spacing: { before: 200, after: 100 },
      })
    );

    const rows = section.fields.map((field) => {
      const citationSuffix = field.citations.length ? ` [${field.citations.map((c) => c.label).join(", ")}]` : "";
      return labelValueRow(field.label, `${field.value ?? "Not yet abstracted"}${citationSuffix}`);
    });

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  if (abstract.rentSchedule.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Base Rent Schedule", bold: true, color: NAVY, size: 24 })],
        spacing: { before: 300, after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              headerCell("Start", 18),
              headerCell("End", 18),
              headerCell("$/Month", 20),
              headerCell("% Increase", 14),
              headerCell("Document", 30),
            ],
          }),
          ...abstract.rentSchedule.map(
            (row, i) =>
              new TableRow({
                children: [
                  dataCell(row.start, 18, i % 2 === 1),
                  dataCell(row.end, 18, i % 2 === 1),
                  dataCell(row.monthlyRent, 20, i % 2 === 1),
                  dataCell(row.percentIncrease ?? "N/A", 14, i % 2 === 1),
                  dataCell(row.sourceDocument, 30, i % 2 === 1),
                ],
              })
          ),
        ],
      })
    );
  }

  if (abstract.reportingRequirements.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Loan Reporting Requirements", bold: true, color: NAVY, size: 24 })],
        spacing: { before: 300, after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell("Item", 50), headerCell("Frequency", 20), headerCell("Due By", 30)] }),
          ...abstract.reportingRequirements.map(
            (row, i) =>
              new TableRow({
                children: [
                  dataCell(row.item, 50, i % 2 === 1),
                  dataCell(row.frequency, 20, i % 2 === 1),
                  dataCell(row.dueBy, 30, i % 2 === 1),
                ],
              })
          ),
        ],
      })
    );
  }

  if (abstract.missingDocuments) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Missing Documents", bold: true, color: NAVY, size: 24 })],
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({ children: [new TextRun({ text: abstract.missingDocuments, color: DEEP_NAVY, size: 20 })] })
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 24, color: DEEP_NAVY } },
      },
    },
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "U.S. Realty Advisors, 1345 Avenue of the Americas, 21FL, New York, NY 10105",
                    color: GRAY,
                    italics: true,
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

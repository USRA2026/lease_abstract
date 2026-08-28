import ExcelJS from "exceljs";
import type { AbstractDetail } from "@/lib/abstracts/getAbstractDetail";

const PRIMARY = "FF0C5AA9";
const NAVY = "FF14426F";
const PALE = "FFBFDCF3";
const GRAY = "FF707070";
const WHITE = "FFFFFFFF";

function headerRow(ws: ExcelJS.Worksheet, values: string[]) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle" };
  });
  return row;
}

function bandRow(ws: ExcelJS.Worksheet, values: (string | number)[], index: number) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11 };
    cell.alignment = { vertical: "top", wrapText: true };
    if (index % 2 === 1) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALE } };
    }
  });
  return row;
}

/** Builds a brand-styled Excel workbook mirroring the abstract's sections/fields. */
export async function generateAbstractXlsx(abstract: AbstractDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "U.S. Realty Advisors";
  workbook.created = new Date();

  const overview = workbook.addWorksheet("Overview");
  overview.columns = [{ width: 22 }, { width: 50 }];
  const titleRow = overview.addRow([abstract.name]);
  overview.mergeCells(1, 1, 1, 2);
  titleRow.font = { name: "Calibri", bold: true, size: 16, color: { argb: PRIMARY } };
  overview.addRow([]);
  const overviewRows: [string, string][] = [
    ["Asset", abstract.assetName ?? "Unassigned"],
    ["Fund", abstract.fundName ?? "Unassigned"],
    ["Template", abstract.templateName],
    ["% Complete", `${abstract.percentComplete}`],
    ["Last Updated", abstract.updatedAt.toISOString().slice(0, 10)],
  ];
  for (const [label, value] of overviewRows) {
    const row = overview.addRow([label, value]);
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: NAVY } };
    row.getCell(2).font = { name: "Calibri" };
  }

  const abstractSheet = workbook.addWorksheet("Abstract");
  abstractSheet.columns = [{ width: 32 }, { width: 60 }, { width: 20 }];
  headerRow(abstractSheet, ["Field", "Value", "Citation"]);
  let rowIndex = 0;
  for (const section of abstract.sections) {
    const sectionRow = abstractSheet.addRow([section.name]);
    abstractSheet.mergeCells(sectionRow.number, 1, sectionRow.number, 3);
    sectionRow.font = { name: "Calibri", bold: true, color: { argb: NAVY } };
    sectionRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALE } };
    for (const field of section.fields) {
      const citationLabel = field.citations.map((c) => c.label).join("; ");
      bandRow(abstractSheet, [field.label, field.value ?? "", citationLabel], rowIndex++);
    }
  }

  if (abstract.rentSchedule.length > 0) {
    const sheet = workbook.addWorksheet("Rent Schedule");
    sheet.columns = [{ width: 14 }, { width: 14 }, { width: 16 }, { width: 12 }, { width: 20 }];
    headerRow(sheet, ["Start", "End", "$/Month", "% Increase", "Document"]);
    abstract.rentSchedule.forEach((row, i) => {
      bandRow(sheet, [row.start, row.end, row.monthlyRent, row.percentIncrease ?? "N/A", row.sourceDocument], i);
    });
  }

  if (abstract.reportingRequirements.length > 0) {
    const sheet = workbook.addWorksheet("Reporting Requirements");
    sheet.columns = [{ width: 45 }, { width: 16 }, { width: 35 }];
    headerRow(sheet, ["Item", "Frequency", "Due By"]);
    abstract.reportingRequirements.forEach((row, i) => {
      bandRow(sheet, [row.item, row.frequency, row.dueBy], i);
    });
  }

  const docsSheet = workbook.addWorksheet("Documents");
  docsSheet.columns = [{ width: 55 }, { width: 35 }, { width: 12 }];
  headerRow(docsSheet, ["File Name", "Title", "Acronym"]);
  abstract.documents.forEach((doc, i) => {
    bandRow(docsSheet, [doc.fileName, doc.title, doc.acronym], i);
  });

  overview.addRow([]);
  const footerRow = overview.addRow(["U.S. Realty Advisors, 1345 Avenue of the Americas, 21FL, New York, NY 10105"]);
  footerRow.font = { name: "Calibri", italic: true, size: 9, color: { argb: GRAY } };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

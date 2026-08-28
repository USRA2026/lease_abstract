export type SeedFieldType = "TEXT" | "LONG_TEXT" | "CURRENCY" | "PERCENT" | "DATE" | "NUMBER";

export interface SeedFieldCitation {
  acronym: string;
  page?: string;
  sectionRef?: string;
}

export interface SeedField {
  key: string;
  label: string;
  fieldType: SeedFieldType;
  value: string;
  citation?: SeedFieldCitation;
}

export interface SeedSection {
  name: string;
  fields: SeedField[];
}

export interface SeedDocument {
  acronym: string;
  title: string;
  fileName: string;
}

export interface SeedRentRow {
  start: string;
  end: string;
  monthlyRent: string;
  percentIncrease?: string;
  sourceDocument: string;
}

export interface SeedReportingRow {
  item: string;
  frequency: string;
  dueBy: string;
}

export interface SeedAbstract {
  name: string;
  kind: "LEASE" | "LOAN";
  assetName: string;
  documents: SeedDocument[];
  sections: SeedSection[];
  rentSchedule?: SeedRentRow[];
  reportingRequirements?: SeedReportingRow[];
  missingDocuments?: string;
}

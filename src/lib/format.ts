import { format } from "date-fns";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
}

/** Badge classes for a % complete value, kept within the USRA six-color palette. */
export function percentCompleteColor(percent: number): string {
  if (percent >= 100) return "text-white bg-usra-navy ring-usra-navy/20";
  if (percent >= 25) return "text-usra-navy bg-usra-pale/60 ring-usra-navy/15";
  return "text-usra-gray bg-slate-50 ring-usra-gray/20";
}

import { format } from "date-fns";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
}

export function percentCompleteColor(percent: number): string {
  if (percent >= 100) return "text-emerald-700 bg-emerald-50 ring-emerald-600/20";
  if (percent >= 50) return "text-amber-700 bg-amber-50 ring-amber-600/20";
  return "text-rose-700 bg-rose-50 ring-rose-600/20";
}

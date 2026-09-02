import { format } from "date-fns";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
}

/**
 * Parses a human number/currency string into a number, or null if none is
 * found. Handles "$7,994,794", "160,025 SF", "Approximately 525,000 gross
 * square feet", "$42,000/mo", "1.3M", "$851k".
 */
export function parseNumeric(input: string | null | undefined): number | null {
  if (!input) return null;
  const s = input.replace(/,/g, "");
  const m = s.match(/-?\$?\s*(\d+(?:\.\d+)?)\s*([kKmMbB])?(?![a-zA-Z])/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const suffix = m[2]?.toLowerCase();
  if (suffix === "k") n *= 1e3;
  else if (suffix === "m") n *= 1e6;
  else if (suffix === "b") n *= 1e9;
  return Number.isFinite(n) ? n : null;
}

/** "$34.7M", "$851k", "$1.2B", "$18,600" — dashboard-style compact currency. */
export function formatCompactCurrency(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${oneDecimal(n / 1e9)}B`;
  if (abs >= 1e6) return `$${oneDecimal(n / 1e6)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

/** "34.7" or "447" (no trailing ".0"). */
function oneDecimal(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** "1.3M SF", "954k SF", "4,200 SF" — dashboard-style compact area. */
export function formatCompactArea(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${oneDecimal(n / 1e6)}M SF`;
  if (abs >= 1e3) return `${Math.round(n / 1e3)}k SF`;
  return `${Math.round(n).toLocaleString()} SF`;
}

/** Badge classes for a % complete value, kept within the USRA six-color palette. */
export function percentCompleteColor(percent: number): string {
  if (percent >= 100) return "text-white bg-usra-navy ring-usra-navy/20";
  if (percent >= 25) return "text-usra-navy bg-usra-pale/60 ring-usra-navy/15";
  return "text-usra-gray bg-slate-50 ring-usra-gray/20";
}

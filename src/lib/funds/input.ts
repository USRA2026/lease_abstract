import { parseNumeric } from "@/lib/format";

export interface FundInput {
  name?: string;
  code?: string | null;
  vintageYear?: number | null;
  strategy?: string | null;
  targetAmount?: number | null;
}

function optionalString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s ? s : null;
}

/**
 * Validates a create/update payload for a fund. Only keys present in the
 * body are returned, so PATCH can update a single attribute.
 */
export function parseFundInput(body: Record<string, unknown>): { data: FundInput; error?: string } {
  const data: FundInput = {};

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return { data, error: "A fund name is required" };
    data.name = name;
  }
  if ("code" in body) {
    const code = optionalString(body.code);
    data.code = code ? code.toUpperCase().slice(0, 12) : null;
  }
  if ("strategy" in body) {
    data.strategy = optionalString(body.strategy);
  }
  if ("vintageYear" in body) {
    const raw = body.vintageYear;
    if (raw === null || raw === undefined || raw === "") {
      data.vintageYear = null;
    } else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1900 || n > 2100) return { data, error: "Vintage year must be a 4-digit year" };
      data.vintageYear = n;
    }
  }
  if ("targetAmount" in body) {
    const raw = body.targetAmount;
    if (raw === null || raw === undefined || raw === "") {
      data.targetAmount = null;
    } else if (typeof raw === "number") {
      data.targetAmount = raw;
    } else {
      const n = parseNumeric(String(raw));
      if (n == null) return { data, error: "Target must be a dollar amount, e.g. $250M or 250,000,000" };
      data.targetAmount = n;
    }
  }

  return { data };
}

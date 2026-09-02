import type { AbstractKind } from "@prisma/client";
import { db } from "@/lib/db";
import { parseNumeric } from "@/lib/format";
import { emptyMetrics, type FundCardData, type FundDashboardData, type FundMetrics } from "./types";

export type { FundCardData, FundDashboardData, FundMetrics } from "./types";

/**
 * Template field keys the dashboard reads. Templates are editable, so we
 * look for a few common spellings and take the first one with a value.
 */
const AREA_KEYS = ["squareFeet", "rentableSquareFeet", "rentableArea", "leasedArea", "premisesSquareFeet", "buildingSquareFeet", "grossLeasableArea"];
const LOAN_KEYS = ["totalLoanAmount", "initialLoanAmount", "loanAmount", "principalAmount", "originalPrincipalBalance", "maximumLoanAmount"];
const ANNUAL_RENT_KEYS = ["annualBaseRent", "currentAnnualRent", "annualRent", "baseRentAnnual", "initialAnnualRent"];
const MONTHLY_RENT_KEYS = ["monthlyBaseRent", "currentMonthlyRent", "monthlyRent", "baseRentMonthly", "initialMonthlyRent"];

export interface AbstractLike {
  kind: AbstractKind;
  fields: { value: string; templateField: { key: string } }[];
  rentScheduleRows: { startDate: Date; endDate: Date; monthlyRent: string; order: number }[];
}

export interface AssetLike {
  abstracts: AbstractLike[];
}

function fieldValue(abstract: AbstractLike, keys: string[]): string | null {
  for (const key of keys) {
    const f = abstract.fields.find((x) => x.templateField.key === key && x.value.trim());
    if (f) return f.value;
  }
  return null;
}

/**
 * Current annual base rent for a lease: 12x the rent-schedule row covering
 * today (or the first/last row when today falls outside the schedule),
 * falling back to an annual or monthly rent field on the abstract.
 */
export function currentAnnualRent(abstract: AbstractLike, today: Date = new Date()): number {
  const rows = [...abstract.rentScheduleRows].sort((a, b) => a.order - b.order);
  if (rows.length) {
    const current =
      rows.find((r) => r.startDate <= today && today <= r.endDate) ??
      (today < rows[0].startDate ? rows[0] : rows[rows.length - 1]);
    const monthly = parseNumeric(current.monthlyRent);
    if (monthly != null && monthly > 0) return monthly * 12;
  }
  const annual = parseNumeric(fieldValue(abstract, ANNUAL_RENT_KEYS));
  if (annual != null && annual > 0) return annual;
  const monthly = parseNumeric(fieldValue(abstract, MONTHLY_RENT_KEYS));
  if (monthly != null && monthly > 0) return monthly * 12;
  return 0;
}

/** Rolls a set of assets (with their abstracts) up into dashboard metrics. */
export function summarizeAssets(assets: AssetLike[], today: Date = new Date()): FundMetrics {
  const m = emptyMetrics();
  m.assets = assets.length;
  for (const asset of assets) {
    for (const abstract of asset.abstracts) {
      m.contracts++;
      if (abstract.kind === "LEASE") {
        m.leases++;
        m.leasedArea += parseNumeric(fieldValue(abstract, AREA_KEYS)) ?? 0;
        m.inPlaceRent += currentAnnualRent(abstract, today);
      } else if (abstract.kind === "LOAN") {
        m.loans++;
        m.loanPrincipal += parseNumeric(fieldValue(abstract, LOAN_KEYS)) ?? 0;
      }
    }
  }
  return m;
}

function addMetrics(a: FundMetrics, b: FundMetrics): FundMetrics {
  return {
    assets: a.assets + b.assets,
    contracts: a.contracts + b.contracts,
    leases: a.leases + b.leases,
    loans: a.loans + b.loans,
    leasedArea: a.leasedArea + b.leasedArea,
    inPlaceRent: a.inPlaceRent + b.inPlaceRent,
    loanPrincipal: a.loanPrincipal + b.loanPrincipal,
  };
}

const abstractInclude = {
  abstracts: {
    include: {
      fields: { include: { templateField: { select: { key: true } } } },
      rentScheduleRows: true,
    },
  },
} as const;

/** Loads every fund + its assets and computes the card metrics for the Funds page. */
export async function getFundDashboard(): Promise<FundDashboardData> {
  const [funds, unaffiliatedAssets] = await Promise.all([
    db.fund.findMany({
      orderBy: [{ vintageYear: "asc" }, { name: "asc" }],
      include: { assets: { include: abstractInclude } },
    }),
    db.asset.findMany({ where: { fundId: null }, include: abstractInclude }),
  ]);

  const today = new Date();
  const cards: FundCardData[] = funds.map((f) => ({
    id: f.id,
    name: f.name,
    code: f.code,
    vintageYear: f.vintageYear,
    strategy: f.strategy,
    targetAmount: f.targetAmount,
    metrics: summarizeAssets(f.assets, today),
  }));
  const unaffiliated = summarizeAssets(unaffiliatedAssets, today);
  const totals = cards.reduce((acc, c) => addMetrics(acc, c.metrics), unaffiliated);

  return { funds: cards, unaffiliated, totals };
}

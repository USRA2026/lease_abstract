/**
 * Shared shapes for the Funds dashboard. Kept free of server imports so
 * client components can import the types without pulling in Prisma.
 */
export interface FundMetrics {
  /** Number of assets grouped under the fund. */
  assets: number;
  /** Number of abstracted contracts (leases + loans) across those assets. */
  contracts: number;
  leases: number;
  loans: number;
  /** Sum of leased square feet across lease abstracts. */
  leasedArea: number;
  /** Sum of current annual base rent across lease abstracts (whole dollars). */
  inPlaceRent: number;
  /** Sum of loan principal across loan abstracts (whole dollars). */
  loanPrincipal: number;
}

export interface FundCardData {
  id: string;
  name: string;
  code: string | null;
  vintageYear: number | null;
  strategy: string | null;
  targetAmount: number | null;
  metrics: FundMetrics;
}

export interface FundDashboardData {
  funds: FundCardData[];
  /** Assets with no fund assigned. */
  unaffiliated: FundMetrics;
  /** Everything, affiliated or not. */
  totals: FundMetrics;
}

export function emptyMetrics(): FundMetrics {
  return { assets: 0, contracts: 0, leases: 0, loans: 0, leasedArea: 0, inPlaceRent: 0, loanPrincipal: 0 };
}

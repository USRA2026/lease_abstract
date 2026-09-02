import { getFundDashboard } from "@/lib/funds/metrics";
import { FundsDashboard } from "@/components/FundsDashboard";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const data = await getFundDashboard();

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <FundsDashboard funds={data.funds} unaffiliated={data.unaffiliated} totals={data.totals} />
    </div>
  );
}

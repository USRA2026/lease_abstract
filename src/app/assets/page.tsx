import Link from "next/link";
import { db } from "@/lib/db";
import { FundFilter } from "@/components/FundFilter";

export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: { searchParams: { fund?: string } }) {
  const fundId = searchParams.fund;

  const [assets, funds] = await Promise.all([
    db.asset.findMany({
      where: fundId ? { fundId } : undefined,
      include: { fund: true, _count: { select: { abstracts: true } } },
      orderBy: { name: "asc" },
    }),
    db.fund.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-usra-primary">Assets</h1>
        <FundFilter funds={funds} selected={fundId} />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Fund</th>
              <th className="px-5 py-3 font-semibold">Abstracts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset, i) => (
              <tr key={asset.id} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                <td className="px-5 py-3">
                  <Link href={`/assets/${asset.id}`} className="font-medium text-usra-primary hover:underline">
                    {asset.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-usra-gray">
                  {asset.fund ? (
                    <Link href={`/assets?fund=${asset.fund.id}`} className="hover:text-usra-primary hover:underline">
                      {asset.fund.name}
                    </Link>
                  ) : (
                    "Unassigned"
                  )}
                </td>
                <td className="px-5 py-3 text-[#091E30]">{asset._count.abstracts}</td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-4 text-center text-usra-gray">
                  No assets match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

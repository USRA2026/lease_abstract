import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const funds = await db.fund.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
  const unassignedCount = await db.asset.count({ where: { fundId: null } });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-usra-primary">Funds</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Assets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {funds.map((fund, i) => (
              <tr key={fund.id} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                <td className="px-5 py-3">
                  <Link href={`/assets?fund=${fund.id}`} className="font-medium text-usra-primary hover:underline">
                    {fund.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-[#091E30]">{fund._count.assets}</td>
              </tr>
            ))}
            {unassignedCount > 0 && (
              <tr className={funds.length % 2 === 1 ? "bg-usra-pale/20" : ""}>
                <td className="px-5 py-3 text-usra-gray">Unassigned</td>
                <td className="px-5 py-3 text-[#091E30]">{unassignedCount}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

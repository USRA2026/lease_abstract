import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const assets = await db.asset.findMany({
    include: { _count: { select: { abstracts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-usra-primary">Assets</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
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
                <td className="px-5 py-3 text-[#091E30]">{asset._count.abstracts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

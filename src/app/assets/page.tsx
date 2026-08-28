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
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Assets</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Abstracts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/assets/${asset.id}`} className="font-medium text-accent hover:underline">
                    {asset.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{asset._count.abstracts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatShortDate, percentCompleteColor } from "@/lib/format";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const asset = await db.asset.findUnique({
    where: { id: params.id },
    include: { abstracts: { include: { template: true }, orderBy: { updatedAt: "desc" } } },
  });
  if (!asset) notFound();

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-2 text-sm text-slate-400">
        <Link href="/assets" className="hover:underline">
          Assets
        </Link>{" "}
        &gt; <span className="text-slate-600">{asset.name}</span>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{asset.name}</h1>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Template</th>
              <th className="px-5 py-3 font-medium">% Complete</th>
              <th className="px-5 py-3 font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {asset.abstracts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/abstracts/${a.id}`} className="font-medium text-accent hover:underline">
                    {a.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{a.template.name}</td>
                <td className="px-5 py-3">
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      percentCompleteColor(a.percentComplete)
                    )}
                  >
                    {a.percentComplete}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">{formatShortDate(a.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { formatShortDate, percentCompleteColor } from "@/lib/format";
import { Search } from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function AbstractsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();

  const abstracts = await db.abstract.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { asset: true, template: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Abstracts</h1>
        <Link
          href="/abstracts/upload"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light"
        >
          Create
        </Link>
      </div>

      <form className="mb-5">
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search abstracts..."
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Abstract Template</th>
              <th className="px-5 py-3 font-medium">% Complete</th>
              <th className="px-5 py-3 font-medium">Last Updated</th>
              <th className="px-5 py-3 font-medium">Asset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {abstracts.map((abstract) => (
              <tr key={abstract.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/abstracts/${abstract.id}`} className="font-medium text-accent hover:underline">
                    {abstract.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{abstract.template.name}</td>
                <td className="px-5 py-3">
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      percentCompleteColor(abstract.percentComplete)
                    )}
                  >
                    {abstract.percentComplete}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">{formatShortDate(abstract.updatedAt)}</td>
                <td className="px-5 py-3">
                  {abstract.asset ? (
                    <Link href={`/assets/${abstract.asset.id}`} className="text-accent hover:underline">
                      {abstract.asset.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {abstracts.length} abstract{abstracts.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

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
        <h1 className="text-2xl font-semibold text-usra-primary">Abstracts</h1>
        <Link
          href="/abstracts/upload"
          className="rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
        >
          Create
        </Link>
      </div>

      <form className="mb-5">
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-usra-gray" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search abstracts..."
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-[#091E30] shadow-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
          />
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Abstract Template</th>
              <th className="px-5 py-3 font-semibold">% Complete</th>
              <th className="px-5 py-3 font-semibold">Last Updated</th>
              <th className="px-5 py-3 font-semibold">Asset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {abstracts.map((abstract, i) => (
              <tr key={abstract.id} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                <td className="px-5 py-3">
                  <Link href={`/abstracts/${abstract.id}`} className="font-medium text-usra-primary hover:underline">
                    {abstract.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-[#091E30]">{abstract.template.name}</td>
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
                <td className="px-5 py-3 text-[#091E30]">{formatShortDate(abstract.updatedAt)}</td>
                <td className="px-5 py-3">
                  {abstract.asset ? (
                    <Link href={`/assets/${abstract.asset.id}`} className="text-usra-primary hover:underline">
                      {abstract.asset.name}
                    </Link>
                  ) : (
                    <span className="text-usra-gray">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-usra-gray">
        {abstracts.length} abstract{abstracts.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

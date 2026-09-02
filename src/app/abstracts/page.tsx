import Link from "next/link";
import type { Prisma } from "@prisma/client";
import clsx from "clsx";
import { db } from "@/lib/db";
import { formatShortDate, percentCompleteColor } from "@/lib/format";
import { AbstractFilters, UNASSIGNED_FUND, type AbstractFilterValues } from "@/components/AbstractFilters";

export const dynamic = "force-dynamic";

function buildWhere(f: AbstractFilterValues): Prisma.AbstractWhereInput {
  const and: Prisma.AbstractWhereInput[] = [];

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { asset: { name: { contains: f.q, mode: "insensitive" } } },
        { asset: { fund: { name: { contains: f.q, mode: "insensitive" } } } },
        { documents: { some: { title: { contains: f.q, mode: "insensitive" } } } },
        { documents: { some: { acronym: { equals: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.fund === UNASSIGNED_FUND) {
    and.push({ OR: [{ assetId: null }, { asset: { fundId: null } }] });
  } else if (f.fund) {
    and.push({ asset: { fundId: f.fund } });
  }
  if (f.asset) and.push({ assetId: f.asset });
  if (f.template) and.push({ templateId: f.template });
  if (f.status === "complete") and.push({ percentComplete: { gte: 100 } });
  else if (f.status === "inprogress") and.push({ percentComplete: { gt: 0, lt: 100 } });
  else if (f.status === "notstarted") and.push({ percentComplete: { lte: 0 } });

  return and.length ? { AND: and } : {};
}

export default async function AbstractsPage({ searchParams }: { searchParams: AbstractFilterValues }) {
  const filters: AbstractFilterValues = {
    q: searchParams.q?.trim() || undefined,
    fund: searchParams.fund || undefined,
    asset: searchParams.asset || undefined,
    template: searchParams.template || undefined,
    status: searchParams.status || undefined,
  };

  const [abstracts, funds, assets, templates] = await Promise.all([
    db.abstract.findMany({
      where: buildWhere(filters),
      include: {
        asset: { include: { fund: { select: { id: true, name: true, code: true } } } },
        template: true,
        _count: { select: { documents: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.fund.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.asset.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, fundId: true } }),
    db.template.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const total = await db.abstract.count();
  const isFiltered = Object.values(filters).some(Boolean);

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

      <AbstractFilters funds={funds} assets={assets} templates={templates} current={filters} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Abstract Template</th>
              <th className="px-5 py-3 font-semibold">% Complete</th>
              <th className="px-5 py-3 font-semibold">Docs</th>
              <th className="px-5 py-3 font-semibold">Last Updated</th>
              <th className="px-5 py-3 font-semibold">Asset</th>
              <th className="px-5 py-3 font-semibold">Fund</th>
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
                <td className="px-5 py-3 text-[#091E30]">{abstract._count.documents}</td>
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
                <td className="px-5 py-3">
                  {abstract.asset?.fund ? (
                    <Link href={`/abstracts?fund=${abstract.asset.fund.id}`} className="text-usra-primary hover:underline">
                      {abstract.asset.fund.code ?? abstract.asset.fund.name}
                    </Link>
                  ) : (
                    <span className="text-usra-gray">Unaffiliated</span>
                  )}
                </td>
              </tr>
            ))}
            {abstracts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-usra-gray">
                  {isFiltered ? "No abstracts match these filters." : "No abstracts yet. Create one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-usra-gray">
        {isFiltered
          ? `${abstracts.length} of ${total} abstract${total === 1 ? "" : "s"}`
          : `${abstracts.length} abstract${abstracts.length === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}

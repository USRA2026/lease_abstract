import { db } from "@/lib/db";
import { AssetsManager } from "@/components/AssetsManager";

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
      <AssetsManager
        selectedFund={fundId}
        funds={funds.map((f) => ({ id: f.id, name: f.name }))}
        assets={assets.map((a) => ({
          id: a.id,
          name: a.name,
          fundId: a.fundId,
          fundName: a.fund?.name ?? null,
          abstractCount: a._count.abstracts,
        }))}
      />
    </div>
  );
}

import { db } from "@/lib/db";
import { FundsManager } from "@/components/FundsManager";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const funds = await db.fund.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
  const unassignedCount = await db.asset.count({ where: { fundId: null } });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <FundsManager
        funds={funds.map((f) => ({ id: f.id, name: f.name, assetCount: f._count.assets }))}
        unassignedCount={unassignedCount}
      />
    </div>
  );
}

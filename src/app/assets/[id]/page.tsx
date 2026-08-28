import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatShortDate } from "@/lib/format";
import { AssetDetailClient } from "@/components/AssetDetailClient";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const asset = await db.asset.findUnique({
    where: { id: params.id },
    include: {
      fund: true,
      abstracts: { include: { template: true }, orderBy: { updatedAt: "desc" } },
      documents: { include: { abstract: true }, orderBy: { order: "asc" } },
    },
  });
  if (!asset) notFound();

  return (
    <AssetDetailClient
      assetId={asset.id}
      assetName={asset.name}
      fundName={asset.fund?.name}
      fundId={asset.fund?.id}
      abstracts={asset.abstracts.map((a) => ({
        id: a.id,
        name: a.name,
        templateName: a.template.name,
        percentComplete: a.percentComplete,
        updatedAt: formatShortDate(a.updatedAt),
      }))}
      documents={asset.documents.map((d) => ({
        id: d.id,
        title: d.title,
        acronym: d.acronym,
        fileName: d.fileName,
        pageCount: d.pageCount,
        abstractName: d.abstract?.name ?? null,
      }))}
    />
  );
}

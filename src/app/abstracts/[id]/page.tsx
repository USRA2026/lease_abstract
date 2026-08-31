import { AbstractDetailClient } from "@/components/AbstractDetailClient";
import { getAbstractDetail } from "@/lib/abstracts/getAbstractDetail";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AbstractDetailPage({ params }: { params: { id: string } }) {
  const [abstract, assets] = await Promise.all([
    getAbstractDetail(params.id),
    db.asset.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AbstractDetailClient
      abstractId={abstract.id}
      name={abstract.name}
      templateName={abstract.templateName}
      assetName={abstract.assetName}
      assetId={abstract.assetId}
      percentComplete={abstract.percentComplete}
      sections={abstract.sections}
      documents={abstract.documents}
      rentSchedule={abstract.rentSchedule}
      reportingRequirements={abstract.reportingRequirements}
      missingDocuments={abstract.missingDocuments}
      assets={assets}
    />
  );
}

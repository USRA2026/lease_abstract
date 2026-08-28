import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await db.template.findMany({
    include: { sections: { include: { fields: true } }, _count: { select: { abstracts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-usra-primary">Templates</h1>
      <div className="space-y-6">
        {templates.map((t) => {
          const fieldCount = t.sections.reduce((sum, s) => sum + s.fields.length, 0);
          return (
            <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-usra-navy">{t.name}</h2>
                <span className="text-xs text-usra-gray">
                  {t._count.abstracts} abstract{t._count.abstracts === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mb-3 text-xs text-usra-gray">
                {t.sections.length} sections · {fieldCount} fields
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.sections.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-usra-pale/50 px-2.5 py-0.5 text-xs text-usra-navy"
                    title={s.fields.map((f) => f.label).join(", ")}
                  >
                    {s.name} ({s.fields.length})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

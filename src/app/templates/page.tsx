import { db } from "@/lib/db";
import { TemplateEditor, type EditorField } from "@/components/TemplateEditor";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await db.template.findMany({
    include: {
      sections: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } },
      _count: { select: { abstracts: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <TemplateEditor
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          kind: t.kind,
          abstractCount: t._count.abstracts,
          sections: t.sections.map((s) => ({
            id: s.id,
            name: s.name,
            fields: s.fields.map(
              (f): EditorField => ({ id: f.id, label: f.label, fieldType: f.fieldType, helpText: f.helpText })
            ),
          })),
        }))}
      />
    </div>
  );
}

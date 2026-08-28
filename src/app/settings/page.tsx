import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const team = await db.team.findFirst({ include: { users: true } });
  const aiProvider = process.env.AI_PROVIDER ?? "mock";
  const storageDriver = process.env.STORAGE_DRIVER ?? "local";

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Settings</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Team</h2>
        <div className="text-sm text-slate-800">{team?.name}</div>
        <div className="mt-2 space-y-1">
          {team?.users.map((u) => (
            <div key={u.id} className="text-sm text-slate-600">
              {u.name ?? u.email} &middot; {u.email}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">AI &amp; Storage</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">AI provider</dt>
            <dd className="font-medium text-slate-800">{aiProvider}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Storage driver</dt>
            <dd className="font-medium text-slate-800">{storageDriver}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          Set AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY and STORAGE_DRIVER=azure in your environment to switch this
          deployment from the local mock provider to Azure OpenAI + Azure Blob Storage. See infra/README.md.
        </p>
      </div>
    </div>
  );
}

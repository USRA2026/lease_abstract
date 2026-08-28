import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const team = await db.team.findFirst({ include: { users: true } });
  const aiProvider = process.env.AI_PROVIDER ?? "mock";
  const storageDriver = process.env.STORAGE_DRIVER ?? "local";

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-usra-primary">Settings</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-usra-navy">Team</h2>
        <div className="text-sm text-[#091E30]">{team?.name}</div>
        <div className="mt-2 space-y-1">
          {team?.users.map((u) => (
            <div key={u.id} className="text-sm text-usra-gray">
              {u.name ?? u.email} &middot; {u.email}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-usra-navy">AI &amp; Storage</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-usra-gray">AI provider</dt>
            <dd className="font-medium text-[#091E30]">{aiProvider}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-usra-gray">Storage driver</dt>
            <dd className="font-medium text-[#091E30]">{storageDriver}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-usra-gray">
          Set AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY and STORAGE_DRIVER=azure in your environment to switch this
          deployment from the local mock provider to Azure OpenAI + Azure Blob Storage. See infra/README.md.
        </p>
      </div>
    </div>
  );
}

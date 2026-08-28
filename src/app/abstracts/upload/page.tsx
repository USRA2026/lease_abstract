"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateAbstractPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"LEASE" | "LOAN">("LEASE");
  const [assetName, setAssetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/abstracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind, assetName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create abstract");
      router.push(`/abstracts/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-8 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-usra-primary">Create Abstract</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-usra-navy">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riverfront Distribution Center Lease"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-usra-navy">Abstract Template</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "LEASE" | "LOAN")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
          >
            <option value="LEASE">Lease</option>
            <option value="LOAN">Loan</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-usra-navy">Asset</label>
          <input
            required
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g. Riverfront Distribution Center"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
          />
        </div>
        {error && <div className="text-sm text-red-700">{error}</div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create abstract"}
        </button>
        <p className="text-xs text-usra-gray">
          You&apos;ll upload the lease or loan PDFs on the next screen. The AI abstraction pipeline runs automatically
          on each upload.
        </p>
      </form>
    </div>
  );
}

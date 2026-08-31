"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export interface FundRow {
  id: string;
  name: string;
  assetCount: number;
}

export function FundsManager({ funds, unassignedCount }: { funds: FundRow[]; unassignedCount: number }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!res.ok) throw new Error(data.error ?? `Request failed (HTTP ${res.status})`);
      router.refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createFund() {
    if (!newName.trim()) return;
    if (await call("/api/funds", "POST", { name: newName.trim() })) {
      setNewName("");
      setCreating(false);
    }
  }

  async function renameFund(id: string) {
    if (!editName.trim()) return;
    if (await call(`/api/funds/${id}`, "PATCH", { name: editName.trim() })) {
      setEditingId(null);
    }
  }

  async function deleteFund(id: string, name: string, assetCount: number) {
    const msg =
      assetCount > 0
        ? `Delete fund "${name}"? Its ${assetCount} asset${assetCount === 1 ? "" : "s"} will become Unassigned (assets are not deleted).`
        : `Delete fund "${name}"?`;
    if (!window.confirm(msg)) return;
    await call(`/api/funds/${id}`, "DELETE");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-usra-primary">Funds</h1>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
          >
            <Plus size={16} /> New Fund
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-usra-pale bg-usra-pale/20 p-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createFund();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Fund name (e.g. USRA Net Lease Fund I)"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-usra-primary"
          />
          <button
            disabled={busy || !newName.trim()}
            onClick={createFund}
            className="rounded-md bg-usra-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-usra-navy disabled:opacity-50"
          >
            Create
          </button>
          <button onClick={() => setCreating(false)} className="rounded-md px-2 py-1.5 text-sm text-usra-gray hover:text-usra-navy">
            Cancel
          </button>
        </div>
      )}

      {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Assets</th>
              <th className="w-24 px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {funds.map((fund, i) => (
              <tr key={fund.id} className={i % 2 === 1 ? "bg-usra-pale/20" : ""}>
                <td className="px-5 py-3">
                  {editingId === fund.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameFund(fund.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-usra-primary"
                    />
                  ) : (
                    <Link href={`/assets?fund=${fund.id}`} className="font-medium text-usra-primary hover:underline">
                      {fund.name}
                    </Link>
                  )}
                </td>
                <td className="px-5 py-3 text-[#091E30]">{fund.assetCount}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === fund.id ? (
                      <>
                        <button onClick={() => renameFund(fund.id)} disabled={busy} className="text-usra-primary hover:text-usra-navy" title="Save">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-usra-gray hover:text-usra-navy" title="Cancel">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(fund.id);
                            setEditName(fund.name);
                          }}
                          className="text-usra-gray hover:text-usra-primary"
                          title="Rename"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteFund(fund.id, fund.name, fund.assetCount)}
                          className="text-usra-gray hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {unassignedCount > 0 && (
              <tr className={funds.length % 2 === 1 ? "bg-usra-pale/20" : ""}>
                <td className="px-5 py-3 text-usra-gray">Unassigned</td>
                <td className="px-5 py-3 text-[#091E30]">{unassignedCount}</td>
                <td className="px-5 py-3" />
              </tr>
            )}
            {funds.length === 0 && unassignedCount === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-4 text-center text-usra-gray">
                  No funds yet. Create one to group your assets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

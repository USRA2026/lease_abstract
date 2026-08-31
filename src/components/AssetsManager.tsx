"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { FundFilter } from "./FundFilter";

export interface FundOption {
  id: string;
  name: string;
}

export interface AssetRow {
  id: string;
  name: string;
  fundId: string | null;
  fundName: string | null;
  abstractCount: number;
}

export function AssetsManager({
  assets,
  funds,
  selectedFund,
}: {
  assets: AssetRow[];
  funds: FundOption[];
  selectedFund?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFund, setNewFund] = useState("");
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

  async function createAsset() {
    if (!newName.trim()) return;
    if (await call("/api/assets", "POST", { name: newName.trim(), fundId: newFund || null })) {
      setNewName("");
      setNewFund("");
      setCreating(false);
    }
  }

  async function renameAsset(id: string) {
    if (!editName.trim()) return;
    if (await call(`/api/assets/${id}`, "PATCH", { name: editName.trim() })) setEditingId(null);
  }

  async function setAssetFund(id: string, fundId: string) {
    await call(`/api/assets/${id}`, "PATCH", { fundId: fundId || null });
  }

  async function deleteAsset(id: string, name: string, abstractCount: number) {
    const msg =
      abstractCount > 0
        ? `Delete asset "${name}"? Its ${abstractCount} abstract${abstractCount === 1 ? "" : "s"} will be detached (not deleted), and any asset-level documents will be removed.`
        : `Delete asset "${name}"? Any asset-level documents will be removed.`;
    if (!window.confirm(msg)) return;
    await call(`/api/assets/${id}`, "DELETE");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-usra-primary">Assets</h1>
        <div className="flex items-center gap-3">
          <FundFilter funds={funds} selected={selectedFund} />
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
            >
              <Plus size={16} /> New Asset
            </button>
          )}
        </div>
      </div>

      {creating && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-usra-pale bg-usra-pale/20 p-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createAsset();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Asset / property name"
            className="min-w-[240px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-usra-primary"
          />
          <select
            value={newFund}
            onChange={(e) => setNewFund(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-usra-primary"
          >
            <option value="">Unassigned fund</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !newName.trim()}
            onClick={createAsset}
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
              <th className="px-5 py-3 font-semibold">Fund</th>
              <th className="px-5 py-3 font-semibold">Abstracts</th>
              <th className="w-24 px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset, i) => (
              <tr key={asset.id} className={i % 2 === 1 ? "bg-usra-pale/20" : ""}>
                <td className="px-5 py-3">
                  {editingId === asset.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameAsset(asset.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-usra-primary"
                    />
                  ) : (
                    <Link href={`/assets/${asset.id}`} className="font-medium text-usra-primary hover:underline">
                      {asset.name}
                    </Link>
                  )}
                </td>
                <td className="px-5 py-3">
                  <select
                    value={asset.fundId ?? ""}
                    disabled={busy}
                    onChange={(e) => setAssetFund(asset.id, e.target.value)}
                    className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm text-usra-gray outline-none hover:border-slate-300 focus:border-usra-primary"
                  >
                    <option value="">Unassigned</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3 text-[#091E30]">{asset.abstractCount}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === asset.id ? (
                      <>
                        <button onClick={() => renameAsset(asset.id)} disabled={busy} className="text-usra-primary hover:text-usra-navy" title="Save">
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
                            setEditingId(asset.id);
                            setEditName(asset.name);
                          }}
                          className="text-usra-gray hover:text-usra-primary"
                          title="Rename"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteAsset(asset.id, asset.name, asset.abstractCount)}
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
            {assets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-4 text-center text-usra-gray">
                  No assets match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

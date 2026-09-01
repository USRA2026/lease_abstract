"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

const MODELS = [
  { id: "claude-opus-5", label: "Claude Opus 5", note: "Highest quality — $5 / $25 per 1M tokens" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", note: "Balanced — $2 / $10 per 1M tokens" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", note: "Cheapest / fastest — $1 / $5 per 1M tokens" },
];

export function ModelSelector({ current }: { current: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "claude-opus-5");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    setValue(next);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiModel: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          value={value}
          disabled={saving}
          onChange={(e) => save(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-usra-primary"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {saving && <Loader2 size={15} className="animate-spin text-usra-gray" />}
        {saved && !saving && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-usra-gray">{MODELS.find((m) => m.id === value)?.note}</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export interface FilterOption {
  id: string;
  name: string;
}

export interface AssetFilterOption extends FilterOption {
  fundId: string | null;
}

export interface AbstractFilterValues {
  q?: string;
  fund?: string;
  asset?: string;
  template?: string;
  status?: string;
}

export const UNASSIGNED_FUND = "unassigned";

/**
 * Filter bar for the Abstracts list. State lives in the URL query string so
 * filtered views are shareable and the server component does the querying.
 */
export function AbstractFilters({
  funds,
  assets,
  templates,
  current,
}: {
  funds: FilterOption[];
  assets: AssetFilterOption[];
  templates: FilterOption[];
  current: AbstractFilterValues;
}) {
  const router = useRouter();
  const [q, setQ] = useState(current.q ?? "");

  function push(next: AbstractFilterValues) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/abstracts?${qs}` : "/abstracts");
  }

  function update(patch: Partial<AbstractFilterValues>) {
    const next: AbstractFilterValues = { ...current, q: q.trim(), ...patch };
    // Picking a fund drops an asset selection that isn't in that fund.
    if (patch.fund !== undefined && next.asset) {
      const a = assets.find((x) => x.id === next.asset);
      if (a && next.fund) {
        const inFund = next.fund === UNASSIGNED_FUND ? a.fundId === null : a.fundId === next.fund;
        if (!inFund) next.asset = "";
      }
    }
    push(next);
  }

  const visibleAssets = current.fund
    ? assets.filter((a) => (current.fund === UNASSIGNED_FUND ? a.fundId === null : a.fundId === current.fund))
    : assets;
  const active = Boolean(current.q || current.fund || current.asset || current.template || current.status);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() });
        }}
        className="relative"
      >
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-usra-gray" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => q.trim() !== (current.q ?? "") && update({ q: q.trim() })}
          placeholder="Search abstracts, assets, documents..."
          className="w-72 rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-[#091E30] shadow-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
        />
      </form>

      <FilterSelect label="Fund" value={current.fund ?? ""} onChange={(fund) => update({ fund })}>
        <option value="">All funds</option>
        {funds.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
        <option value={UNASSIGNED_FUND}>Unaffiliated</option>
      </FilterSelect>

      <FilterSelect label="Asset" value={current.asset ?? ""} onChange={(asset) => update({ asset })}>
        <option value="">All assets</option>
        {visibleAssets.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Template" value={current.template ?? ""} onChange={(template) => update({ template })}>
        <option value="">All templates</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Status" value={current.status ?? ""} onChange={(status) => update({ status })}>
        <option value="">Any status</option>
        <option value="complete">Complete</option>
        <option value="inprogress">In progress</option>
        <option value="notstarted">Not started</option>
      </FilterSelect>

      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            push({});
          }}
          className="flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-usra-gray hover:text-usra-primary"
        >
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-usra-gray">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[14rem] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#091E30] shadow-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
      >
        {children}
      </select>
    </label>
  );
}

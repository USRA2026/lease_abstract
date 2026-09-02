"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import { formatCompactArea, formatCompactCurrency } from "@/lib/format";
import type { FundCardData, FundMetrics } from "@/lib/funds/types";

interface FundFormValues {
  name: string;
  code: string;
  vintageYear: string;
  strategy: string;
  targetAmount: string;
}

const EMPTY_FORM: FundFormValues = { name: "", code: "", vintageYear: "", strategy: "", targetAmount: "" };

function formFromFund(f: FundCardData): FundFormValues {
  return {
    name: f.name,
    code: f.code ?? "",
    vintageYear: f.vintageYear ? String(f.vintageYear) : "",
    strategy: f.strategy ?? "",
    targetAmount: f.targetAmount ? formatCompactCurrency(f.targetAmount) : "",
  };
}

function toBody(v: FundFormValues) {
  return {
    name: v.name.trim(),
    code: v.code.trim() || null,
    vintageYear: v.vintageYear.trim() || null,
    strategy: v.strategy.trim() || null,
    targetAmount: v.targetAmount.trim() || null,
  };
}

export function FundsDashboard({
  funds,
  unaffiliated,
  totals,
}: {
  funds: FundCardData[];
  unaffiliated: FundMetrics;
  totals: FundMetrics;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  async function createFund(values: FundFormValues) {
    if (await call("/api/funds", "POST", toBody(values))) setCreating(false);
  }

  async function updateFund(id: string, values: FundFormValues) {
    if (await call(`/api/funds/${id}`, "PATCH", toBody(values))) setEditingId(null);
  }

  async function deleteFund(fund: FundCardData) {
    const n = fund.metrics.assets;
    const msg =
      n > 0
        ? `Delete fund "${fund.name}"? Its ${n} asset${n === 1 ? "" : "s"} will become Unaffiliated (assets and abstracts are not deleted).`
        : `Delete fund "${fund.name}"?`;
    if (!window.confirm(msg)) return;
    await call(`/api/funds/${fund.id}`, "DELETE");
  }

  const showUnaffiliated = unaffiliated.assets > 0 || funds.length === 0;

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-usra-primary">Funds</h1>
          <p className="mt-1 text-sm text-usra-gray">
            Portfolio roll-up by investment vehicle. Metrics are computed from the abstracts attached to each fund&apos;s assets.
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex flex-shrink-0 items-center gap-2 rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
          >
            <Plus size={16} /> New fund
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {creating && (
        <div className="mb-6 rounded-lg border border-usra-pale bg-usra-pale/20 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-usra-navy">New fund</h2>
          <FundForm initial={EMPTY_FORM} busy={busy} submitLabel="Create fund" onSubmit={createFund} onCancel={() => setCreating(false)} />
        </div>
      )}

      <TotalsStrip totals={totals} fundCount={funds.length} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {funds.map((fund) =>
          editingId === fund.id ? (
            <div key={fund.id} className="rounded-lg border border-usra-primary/40 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-3">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-usra-navy">Edit fund</h2>
              <FundForm
                initial={formFromFund(fund)}
                busy={busy}
                submitLabel="Save changes"
                onSubmit={(values) => updateFund(fund.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <FundCard key={fund.id} fund={fund} onEdit={() => setEditingId(fund.id)} onDelete={() => deleteFund(fund)} />
          )
        )}
        {showUnaffiliated && <UnaffiliatedCard metrics={unaffiliated} />}
      </div>

      {funds.length === 0 && unaffiliated.assets === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-usra-gray">
          No funds yet. Create one, then assign assets to it from the Assets page.
        </div>
      )}
    </div>
  );
}

function TotalsStrip({ totals, fundCount }: { totals: FundMetrics; fundCount: number }) {
  const items = [
    { label: "Funds", value: fundCount.toLocaleString() },
    { label: "Assets", value: totals.assets.toLocaleString() },
    { label: "Contracts", value: totals.contracts.toLocaleString() },
    { label: "Leased area", value: formatCompactArea(totals.leasedArea) },
    { label: "In-place rent", value: formatCompactCurrency(totals.inPlaceRent) },
    { label: "Loan principal", value: formatCompactCurrency(totals.loanPrincipal) },
  ];
  return (
    <div className="mb-6 grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-usra-gray">{it.label}</div>
          <div className="text-lg font-semibold text-[#091E30]">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

function FundCard({ fund, onEdit, onDelete }: { fund: FundCardData; onEdit: () => void; onDelete: () => void }) {
  const m = fund.metrics;
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-usra-primary/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {fund.code ? (
            <span className="rounded bg-usra-navy px-2 py-0.5 text-xs font-semibold tracking-wide text-white">{fund.code}</span>
          ) : (
            <span className="rounded border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400">No code</span>
          )}
          {fund.vintageYear && (
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-usra-gray">{fund.vintageYear} vintage</span>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button onClick={onEdit} className="rounded p-1 text-slate-400 hover:bg-usra-pale/40 hover:text-usra-primary" title="Edit fund">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete fund">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Link href={`/assets?fund=${fund.id}`} className="text-base font-semibold leading-snug text-usra-primary hover:underline">
        {fund.name}
      </Link>
      <div className="mt-0.5 min-h-[1.25rem] text-sm text-usra-gray">{fund.strategy ?? ""}</div>

      <MetricGrid metrics={m} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-usra-gray">
        <div>
          Loan principal <span className="font-medium text-[#091E30]">{formatCompactCurrency(m.loanPrincipal)}</span>
          <span className="mx-1.5 text-slate-300">·</span>
          target <span className="font-medium text-[#091E30]">{formatCompactCurrency(fund.targetAmount)}</span>
        </div>
        <Link href={`/abstracts?fund=${fund.id}`} className="flex-shrink-0 text-usra-primary hover:underline">
          Abstracts
        </Link>
      </div>
    </div>
  );
}

function UnaffiliatedCard({ metrics }: { metrics: FundMetrics }) {
  return (
    <div className="flex flex-col rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold tracking-wide text-usra-gray">UNAFFILIATED</span>
      </div>
      <div className="text-base font-semibold leading-snug text-usra-navy">Unaffiliated assets</div>
      <div className="mt-0.5 min-h-[1.25rem] text-sm text-usra-gray">Not yet assigned to a fund</div>

      <MetricGrid metrics={metrics} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs text-usra-gray">
        <div>
          Loan principal <span className="font-medium text-[#091E30]">{formatCompactCurrency(metrics.loanPrincipal)}</span>
        </div>
        <Link href="/abstracts?fund=unassigned" className="flex-shrink-0 text-usra-primary hover:underline">
          Abstracts
        </Link>
      </div>
    </div>
  );
}

function MetricGrid({ metrics: m }: { metrics: FundMetrics }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
      <Metric label="Assets" value={m.assets.toLocaleString()} />
      <Metric label="Contracts" value={m.contracts.toLocaleString()} hint={contractsHint(m)} />
      <Metric label="Leased area" value={formatCompactArea(m.leasedArea)} />
      <Metric label="In-place rent" value={formatCompactCurrency(m.inPlaceRent)} hint={m.inPlaceRent ? "annual base rent" : undefined} />
    </dl>
  );
}

function contractsHint(m: FundMetrics): string | undefined {
  if (!m.contracts) return undefined;
  const parts: string[] = [];
  if (m.leases) parts.push(`${m.leases} lease${m.leases === 1 ? "" : "s"}`);
  if (m.loans) parts.push(`${m.loans} loan${m.loans === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-usra-gray">{label}</dt>
      <dd className="text-lg font-semibold leading-tight text-[#091E30]">{value}</dd>
      {hint && <dd className="text-[11px] text-usra-gray">{hint}</dd>}
    </div>
  );
}

function FundForm({
  initial,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FundFormValues;
  busy: boolean;
  submitLabel: string;
  onSubmit: (values: FundFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<FundFormValues>(initial);
  const set = (key: keyof FundFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const canSubmit = values.name.trim().length > 0 && !busy;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(values);
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="grid gap-3 md:grid-cols-12"
    >
      <FormField label="Fund name" className="md:col-span-5">
        <input autoFocus value={values.name} onChange={set("name")} placeholder="USRA Industrial Partners I" className={inputClass} />
      </FormField>
      <FormField label="Code" className="md:col-span-2">
        <input value={values.code} onChange={set("code")} placeholder="IP-I" className={clsx(inputClass, "uppercase")} />
      </FormField>
      <FormField label="Vintage" className="md:col-span-2">
        <input value={values.vintageYear} onChange={set("vintageYear")} placeholder="2021" inputMode="numeric" className={inputClass} />
      </FormField>
      <FormField label="Target size" className="md:col-span-3">
        <input value={values.targetAmount} onChange={set("targetAmount")} placeholder="$250M" className={inputClass} />
      </FormField>
      <FormField label="Strategy" className="md:col-span-9">
        <input value={values.strategy} onChange={set("strategy")} placeholder="Industrial / last-mile, net lease" className={inputClass} />
      </FormField>
      <div className="flex items-end justify-end gap-2 md:col-span-3">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-sm text-usra-gray hover:text-usra-navy">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#091E30] outline-none focus:border-usra-primary focus:ring-1 focus:ring-usra-primary";

function FormField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-usra-gray">{label}</span>
      {children}
    </label>
  );
}

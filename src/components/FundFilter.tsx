"use client";

import { useRouter } from "next/navigation";

export function FundFilter({ funds, selected }: { funds: { id: string; name: string }[]; selected?: string }) {
  const router = useRouter();

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v ? `/assets?fund=${v}` : "/assets");
      }}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#091E30] focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
    >
      <option value="">All Funds</option>
      {funds.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileStack, Building2, LayoutTemplate, Settings } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/abstracts", label: "Abstracts", icon: FileStack },
  { href: "/assets", label: "Assets", icon: Building2 },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-navy-950 text-slate-200">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-sm font-semibold text-white">U.S. Realty Advisors</div>
        <div className="text-xs text-slate-400">Contract Abstraction</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active ? "bg-accent text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4 text-xs text-slate-400">
        Signed in as
        <div className="truncate text-slate-200">dgrazioli@usrallc.com</div>
      </div>
    </aside>
  );
}

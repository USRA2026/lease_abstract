"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileStack, Building2, Landmark, LayoutTemplate, Settings } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/abstracts", label: "Abstracts", icon: FileStack },
  { href: "/assets", label: "Assets", icon: Building2 },
  { href: "/funds", label: "Funds", icon: Landmark },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-white/5 bg-usra-deep text-slate-200">
      <div className="border-b border-white/10 px-5 py-6">
        <Image src="/brand/usra-logo-white.png" alt="U.S. Realty Advisors" width={180} height={47} priority unoptimized />
        <div className="mt-2 text-xs tracking-wide text-white/50">Contract Abstraction</div>
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
                active ? "bg-usra-primary text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4 text-xs text-white/40">
        <div className="text-slate-300">dgrazioli@usrallc.com</div>
        <div className="mt-3 leading-relaxed">
          U.S. Realty Advisors
          <br />
          1345 Avenue of the Americas, 21FL
          <br />
          New York, NY 10105
        </div>
      </div>
    </aside>
  );
}

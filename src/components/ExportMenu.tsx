"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, FileText, File } from "lucide-react";

const FORMATS = [
  { key: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet },
  { key: "docx", label: "Word (.docx)", icon: FileText },
  { key: "pdf", label: "PDF (.pdf)", icon: File },
] as const;

export function ExportMenu({ abstractId }: { abstractId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-usra-navy px-4 py-2 text-sm font-medium text-usra-navy hover:bg-usra-pale/30"
      >
        <Download size={16} /> Export <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          {FORMATS.map((f) => (
            <a
              key={f.key}
              href={`/api/abstracts/${abstractId}/export/${f.key}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#091E30] hover:bg-usra-pale/30"
              onClick={() => setOpen(false)}
            >
              <f.icon size={14} className="text-usra-gray" /> {f.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import type { HighlightRect } from "./PdfCanvas";

const PdfCanvas = dynamic(() => import("./PdfCanvas"), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-slate-400">Loading viewer...</div>,
});

export interface ViewerDocument {
  id: string;
  title: string;
  acronym: string;
  pageCount: number;
}

export interface ActiveCitation {
  documentId: string;
  page: number;
  rects: HighlightRect[];
  label?: string;
  snippet?: string;
  fieldLabel?: string;
}

export function DocumentViewer({
  documents,
  active,
  onDocumentChange,
  onClose,
  onAskAi,
  askAiOpen,
  backLabel = "Back to abstract",
}: {
  documents: ViewerDocument[];
  active: ActiveCitation;
  onDocumentChange: (documentId: string, page: number) => void;
  onClose: () => void;
  onAskAi?: () => void;
  askAiOpen?: boolean;
  backLabel?: string;
}) {
  const doc = documents.find((d) => d.id === active.documentId) ?? documents[0];
  const [page, setPage] = useState(active.page);

  useEffect(() => {
    setPage(active.page);
  }, [active.documentId, active.page]);

  if (!doc) return null;

  const rectsForPage = doc.id === active.documentId && page === active.page ? active.rects : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-usra-deep px-4 py-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-medium text-slate-200 hover:text-white"
        >
          <ChevronLeft size={16} /> {backLabel}
        </button>
        <select
          value={doc.id}
          onChange={(e) => {
            const next = documents.find((d) => d.id === e.target.value);
            if (next) onDocumentChange(next.id, 1);
          }}
          className="rounded border border-white/20 bg-usra-deep px-2 py-1 text-xs text-slate-200"
        >
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.acronym} | {d.title}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-300">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded p-1 hover:bg-white/10">
            <ChevronLeft size={14} />
          </button>
          <span>
            {page} / {doc.pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(doc.pageCount, p + 1))}
            className="rounded p-1 hover:bg-white/10"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {onAskAi && (
          <button
            onClick={onAskAi}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
              askAiOpen ? "bg-usra-primary text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Sparkles size={14} /> Ask AI
          </button>
        )}
        <button onClick={onClose} className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        {active.snippet && page === active.page && doc.id === active.documentId && (
          <div className="mx-auto mb-3 max-w-[700px] rounded-md border border-usra-pale bg-usra-pale/30 p-3 text-xs text-[#091E30] shadow-sm">
            {active.fieldLabel && <div className="mb-1 font-semibold text-usra-navy">{active.fieldLabel}</div>}
            <div>{active.snippet}</div>
            {active.label && <div className="mt-1 text-usra-gray">{active.label}</div>}
          </div>
        )}
        <div className="mx-auto w-fit">
          <PdfCanvas fileUrl={`/api/documents/${doc.id}/file`} pageNumber={page} rects={rectsForPage} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import clsx from "clsx";
import { CitationPill } from "./CitationPill";
import { UploadDocumentForm } from "./UploadDocumentForm";
import { DocumentViewer, type ActiveCitation } from "./DocumentViewer";
import { ChatPanel, type ChatCitation } from "./ChatPanel";
import type { HighlightRect } from "./PdfCanvas";
import { percentCompleteColor } from "@/lib/format";

export interface CitationData {
  id: string;
  documentId: string;
  page: number;
  label: string;
  snippet: string;
  highlightRects: HighlightRect[];
}

export interface FieldRowData {
  key: string;
  label: string;
  value: string | null;
  citations: CitationData[];
}

export interface SectionData {
  name: string;
  fields: FieldRowData[];
}

export interface DocumentData {
  id: string;
  title: string;
  acronym: string;
  fileName: string;
  pageCount: number;
}

export interface RentRow {
  start: string;
  end: string;
  monthlyRent: string;
  percentIncrease: string | null;
  sourceDocument: string;
}

export interface ReportingRow {
  item: string;
  frequency: string;
  dueBy: string;
}

export interface AbstractDetailProps {
  abstractId: string;
  name: string;
  templateName: string;
  assetName?: string;
  assetId?: string;
  percentComplete: number;
  sections: SectionData[];
  documents: DocumentData[];
  rentSchedule: RentRow[];
  reportingRequirements: ReportingRow[];
  missingDocuments?: string | null;
}

export function AbstractDetailClient(props: AbstractDetailProps) {
  const [mode, setMode] = useState<"fields" | "viewer">("fields");
  const [chatOpen, setChatOpen] = useState(false);
  const [active, setActive] = useState<ActiveCitation | null>(null);

  function openCitation(citation: CitationData, fieldLabel?: string) {
    setActive({
      documentId: citation.documentId,
      page: citation.page,
      rects: citation.highlightRects,
      label: citation.label,
      snippet: citation.snippet,
      fieldLabel,
    });
    setMode("viewer");
  }

  function openChatCitation(citation: ChatCitation) {
    setActive({
      documentId: citation.documentId,
      page: citation.page,
      rects: citation.highlightRects,
      label: citation.label,
      snippet: citation.snippet,
    });
    setChatOpen(true);
    setMode("viewer");
  }

  function openAskAi() {
    if (!active && props.documents.length > 0) {
      setActive({ documentId: props.documents[0].id, page: 1, rects: [] });
    }
    setChatOpen(true);
    setMode("viewer");
  }

  const viewerDocuments = props.documents.map((d) => ({ id: d.id, title: d.title, acronym: d.acronym, pageCount: d.pageCount }));

  if (mode === "viewer" && active) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 overflow-hidden">
          <DocumentViewer
            documents={viewerDocuments}
            active={active}
            onDocumentChange={(documentId, page) => setActive((prev) => ({ ...(prev as ActiveCitation), documentId, page, rects: [] }))}
            onClose={() => setMode("fields")}
            onAskAi={() => setChatOpen((v) => !v)}
            askAiOpen={chatOpen}
          />
        </div>
        {chatOpen && <ChatPanel abstractId={props.abstractId} onCitationSelect={openChatCitation} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-2 text-sm text-slate-400">
        <Link href="/abstracts" className="hover:underline">
          Abstracts
        </Link>{" "}
        &gt; <span className="text-slate-600">{props.name}</span>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{props.name}</h1>
        <button
          onClick={openAskAi}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light"
        >
          <Sparkles size={16} /> Ask AI
        </button>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Field label="Name" value={props.name} />
        <Field label="Asset" value={props.assetName ?? "—"} href={props.assetId ? `/assets/${props.assetId}` : undefined} />
        <Field label="Template" value={props.templateName} />
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">% Complete</div>
          <span
            className={clsx(
              "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              percentCompleteColor(props.percentComplete)
            )}
          >
            {props.percentComplete}
          </span>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Documents</h2>
          <UploadDocumentForm abstractId={props.abstractId} />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">File Name</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Acronym</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {props.documents.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <button
                      className="text-accent hover:underline"
                      onClick={() => {
                        setActive({ documentId: d.id, page: 1, rects: [] });
                        setMode("viewer");
                      }}
                    >
                      {d.fileName}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{d.title}</td>
                  <td className="px-4 py-2 text-slate-500">{d.acronym}</td>
                </tr>
              ))}
              {props.documents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-slate-400">
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {props.sections.map((section) => (
        <section key={section.name} className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.name}</h2>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
            {section.fields.map((field) => (
              <div key={field.key} className="grid grid-cols-[220px_1fr] gap-4 px-5 py-3">
                <div className="text-sm text-slate-500">{field.label}</div>
                <div className="text-sm text-slate-800">
                  {field.value ? (
                    <span>
                      {field.value}
                      {field.citations.map((c) => (
                        <CitationPill key={c.id} label={c.label} onClick={() => openCitation(c, field.label)} />
                      ))}
                    </span>
                  ) : (
                    <span className="italic text-slate-300">Not yet abstracted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {props.rentSchedule.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Base Rent Schedule</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Start</th>
                  <th className="px-4 py-2 font-medium">End</th>
                  <th className="px-4 py-2 font-medium">$/Month</th>
                  <th className="px-4 py-2 font-medium">% Increase</th>
                  <th className="px-4 py-2 font-medium">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {props.rentSchedule.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2">{row.start}</td>
                    <td className="px-4 py-2">{row.end}</td>
                    <td className="px-4 py-2">{row.monthlyRent}</td>
                    <td className="px-4 py-2">{row.percentIncrease ?? "N/A"}</td>
                    <td className="px-4 py-2 text-slate-500">{row.sourceDocument}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {props.reportingRequirements.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Loan Reporting Requirements</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Frequency</th>
                  <th className="px-4 py-2 font-medium">Due By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {props.reportingRequirements.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2">{row.item}</td>
                    <td className="px-4 py-2">{row.frequency}</td>
                    <td className="px-4 py-2 text-slate-500">{row.dueBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {props.missingDocuments && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Missing Documents</h2>
          <div className="whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {props.missingDocuments}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      {href ? (
        <Link href={href} className="text-sm text-accent hover:underline">
          {value}
        </Link>
      ) : (
        <div className="text-sm text-slate-800">{value}</div>
      )}
    </div>
  );
}

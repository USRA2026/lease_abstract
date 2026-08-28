"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import clsx from "clsx";
import { CitationPill } from "./CitationPill";
import { ExportMenu } from "./ExportMenu";
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
      <div className="mb-2 text-sm text-usra-gray">
        <Link href="/abstracts" className="hover:underline">
          Abstracts
        </Link>{" "}
        &gt; <span className="text-[#091E30]">{props.name}</span>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-usra-primary">{props.name}</h1>
        <div className="flex items-center gap-3">
          <ExportMenu abstractId={props.abstractId} />
          <button
            onClick={openAskAi}
            className="flex items-center gap-2 rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
          >
            <Sparkles size={16} /> Ask AI
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Field label="Name" value={props.name} />
        <Field label="Asset" value={props.assetName ?? "Unassigned"} href={props.assetId ? `/assets/${props.assetId}` : undefined} />
        <Field label="Template" value={props.templateName} />
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-usra-gray">% Complete</div>
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-usra-navy">Documents</h2>
          <UploadDocumentForm uploadUrl={`/api/abstracts/${props.abstractId}/upload`} />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-4 py-2 font-semibold">File Name</th>
                <th className="px-4 py-2 font-semibold">Title</th>
                <th className="px-4 py-2 font-semibold">Acronym</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {props.documents.map((d, i) => (
                <tr key={d.id} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                  <td className="px-4 py-2">
                    <button
                      className="text-usra-primary hover:underline"
                      onClick={() => {
                        setActive({ documentId: d.id, page: 1, rects: [] });
                        setMode("viewer");
                      }}
                    >
                      {d.fileName}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-[#091E30]">{d.title}</td>
                  <td className="px-4 py-2 text-usra-gray">{d.acronym}</td>
                </tr>
              ))}
              {props.documents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-usra-gray">
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
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-usra-navy">{section.name}</h2>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
            {section.fields.map((field) => (
              <div key={field.key} className="grid grid-cols-[220px_1fr] gap-4 px-5 py-3">
                <div className="text-sm text-usra-gray">{field.label}</div>
                <div className="text-sm text-[#091E30]">
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
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-usra-navy">Base Rent Schedule</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-2 font-semibold">Start</th>
                  <th className="px-4 py-2 font-semibold">End</th>
                  <th className="px-4 py-2 font-semibold">$/Month</th>
                  <th className="px-4 py-2 font-semibold">% Increase</th>
                  <th className="px-4 py-2 font-semibold">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {props.rentSchedule.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                    <td className="px-4 py-2 text-[#091E30]">{row.start}</td>
                    <td className="px-4 py-2 text-[#091E30]">{row.end}</td>
                    <td className="px-4 py-2 text-[#091E30]">{row.monthlyRent}</td>
                    <td className="px-4 py-2 text-[#091E30]">{row.percentIncrease ?? "N/A"}</td>
                    <td className="px-4 py-2 text-usra-gray">{row.sourceDocument}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {props.reportingRequirements.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-usra-navy">Loan Reporting Requirements</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-2 font-semibold">Item</th>
                  <th className="px-4 py-2 font-semibold">Frequency</th>
                  <th className="px-4 py-2 font-semibold">Due By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {props.reportingRequirements.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                    <td className="px-4 py-2 text-[#091E30]">{row.item}</td>
                    <td className="px-4 py-2 text-[#091E30]">{row.frequency}</td>
                    <td className="px-4 py-2 text-usra-gray">{row.dueBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {props.missingDocuments && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-usra-navy">Missing Documents</h2>
          <div className="whitespace-pre-wrap rounded-lg border border-usra-pale bg-usra-pale/20 p-4 text-sm text-usra-navy">
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
      <div className="text-xs font-medium uppercase tracking-wide text-usra-gray">{label}</div>
      {href ? (
        <Link href={href} className="text-sm text-usra-primary hover:underline">
          {value}
        </Link>
      ) : (
        <div className="text-sm text-[#091E30]">{value}</div>
      )}
    </div>
  );
}

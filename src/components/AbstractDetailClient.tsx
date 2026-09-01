"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Pencil, Trash2, Check, Wand2, Loader2 } from "lucide-react";
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
  templateFieldId: string;
  label: string;
  value: string | null;
  citations: CitationData[];
}

export interface AssetOption {
  id: string;
  name: string;
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
  assets: AssetOption[];
}

export function AbstractDetailClient(props: AbstractDetailProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"fields" | "viewer">("fields");
  const [chatOpen, setChatOpen] = useState(false);
  const [active, setActive] = useState<ActiveCitation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(props.name);
  const [assetId, setAssetId] = useState(props.assetId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);

  async function apiCall(url: string, method: string, body?: unknown) {
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!res.ok) throw new Error(data.error ?? `Request failed (HTTP ${res.status})`);
    return data;
  }

  async function saveField(templateFieldId: string, value: string) {
    try {
      await apiCall(`/api/abstracts/${props.abstractId}/fields`, "PATCH", { templateFieldId, value });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveName() {
    if (name.trim() === props.name || !name.trim()) return;
    try {
      await apiCall(`/api/abstracts/${props.abstractId}`, "PATCH", { name: name.trim() });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveAsset(nextAssetId: string) {
    setAssetId(nextAssetId);
    try {
      await apiCall(`/api/abstracts/${props.abstractId}`, "PATCH", { assetId: nextAssetId || null });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function reExtract() {
    setExtracting(true);
    setExtractMsg(null);
    setError(null);
    try {
      const data = await apiCall(`/api/abstracts/${props.abstractId}/extract`, "POST");
      setExtractMsg(`AI (${data.provider ?? "n/a"}) filled ${data.fieldsFound ?? 0} field value(s) across all documents.`);
      router.refresh();
    } catch (err) {
      setError(`Re-extraction failed: ${(err as Error).message}`);
    } finally {
      setExtracting(false);
    }
  }

  async function deleteAbstract() {
    if (!window.confirm(`Delete abstract "${props.name}"? This removes its fields, documents, and citations. This cannot be undone.`)) return;
    try {
      await apiCall(`/api/abstracts/${props.abstractId}`, "DELETE");
      router.push("/abstracts");
    } catch (err) {
      setError((err as Error).message);
    }
  }

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

      <div className="mb-6 flex items-start justify-between gap-4">
        {editMode ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-1.5 text-2xl font-semibold text-usra-primary outline-none focus:border-usra-primary"
          />
        ) : (
          <h1 className="text-2xl font-semibold text-usra-primary">{props.name}</h1>
        )}
        <div className="flex flex-shrink-0 items-center gap-3">
          <button
            onClick={() => setEditMode((v) => !v)}
            className={clsx(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
              editMode ? "bg-usra-primary text-white hover:bg-usra-navy" : "border border-slate-300 text-usra-navy hover:border-usra-primary hover:text-usra-primary"
            )}
          >
            {editMode ? <Check size={16} /> : <Pencil size={16} />} {editMode ? "Done" : "Edit"}
          </button>
          {editMode && (
            <button
              onClick={deleteAbstract}
              className="flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
          {props.documents.length > 0 && (
            <button
              onClick={reExtract}
              disabled={extracting}
              title="Re-run AI abstraction across all attached documents"
              className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-usra-navy hover:border-usra-primary hover:text-usra-primary disabled:opacity-60"
            >
              {extracting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {extracting ? "Abstracting…" : "Re-extract all"}
            </button>
          )}
          <ExportMenu abstractId={props.abstractId} />
          <button
            onClick={openAskAi}
            className="flex items-center gap-2 rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
          >
            <Sparkles size={16} /> Ask AI
          </button>
        </div>
      </div>

      {extractMsg && <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">{extractMsg}</div>}
      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="mb-8 grid grid-cols-4 gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Field label="Name" value={props.name} />
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-usra-gray">Asset</div>
          {editMode ? (
            <select
              value={assetId}
              onChange={(e) => saveAsset(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-usra-primary"
            >
              <option value="">Unassigned</option>
              {props.assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : props.assetId ? (
            <Link href={`/assets/${props.assetId}`} className="text-sm text-usra-primary hover:underline">
              {props.assetName}
            </Link>
          ) : (
            <div className="text-sm text-[#091E30]">Unassigned</div>
          )}
        </div>
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
                  {editMode ? (
                    <EditableFieldValue
                      initialValue={field.value ?? ""}
                      onSave={(value) => saveField(field.templateFieldId, value)}
                    />
                  ) : field.value ? (
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

function EditableFieldValue({ initialValue, onSave }: { initialValue: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(initialValue);
  const multiline = initialValue.length > 60 || initialValue.includes("\n");

  function commit() {
    if (value !== initialValue) onSave(value);
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        rows={3}
        placeholder="Not yet abstracted"
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-usra-primary"
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder="Not yet abstracted"
      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-usra-primary"
    />
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

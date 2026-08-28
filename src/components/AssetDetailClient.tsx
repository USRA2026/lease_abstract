"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { percentCompleteColor } from "@/lib/format";
import { UploadDocumentForm } from "./UploadDocumentForm";
import { DocumentViewer, type ActiveCitation } from "./DocumentViewer";

export interface AssetAbstractRow {
  id: string;
  name: string;
  templateName: string;
  percentComplete: number;
  updatedAt: string;
}

export interface AssetDocumentRow {
  id: string;
  title: string;
  acronym: string;
  fileName: string;
  pageCount: number;
  abstractName: string | null;
}

export interface AssetDetailProps {
  assetId: string;
  assetName: string;
  fundName?: string;
  fundId?: string;
  abstracts: AssetAbstractRow[];
  documents: AssetDocumentRow[];
}

export function AssetDetailClient(props: AssetDetailProps) {
  const [active, setActive] = useState<ActiveCitation | null>(null);

  const viewerDocuments = props.documents.map((d) => ({
    id: d.id,
    title: d.title,
    acronym: d.acronym,
    pageCount: d.pageCount,
  }));

  if (active) {
    return (
      <div className="h-screen">
        <DocumentViewer
          documents={viewerDocuments}
          active={active}
          onDocumentChange={(documentId, page) => setActive((prev) => ({ ...(prev as ActiveCitation), documentId, page, rects: [] }))}
          onClose={() => setActive(null)}
          backLabel="Back to asset"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-2 text-sm text-usra-gray">
        <Link href="/assets" className="hover:underline">
          Assets
        </Link>{" "}
        &gt; <span className="text-[#091E30]">{props.assetName}</span>
      </div>
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold text-usra-primary">{props.assetName}</h1>
        {props.fundName && (
          <Link href={`/assets?fund=${props.fundId}`} className="text-sm text-usra-gray hover:text-usra-primary hover:underline">
            {props.fundName}
          </Link>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-usra-navy">Abstracts</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Template</th>
                <th className="px-5 py-3 font-semibold">% Complete</th>
                <th className="px-5 py-3 font-semibold">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {props.abstracts.map((a, i) => (
                <tr key={a.id} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                  <td className="px-5 py-3">
                    <Link href={`/abstracts/${a.id}`} className="font-medium text-usra-primary hover:underline">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[#091E30]">{a.templateName}</td>
                  <td className="px-5 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        percentCompleteColor(a.percentComplete)
                      )}
                    >
                      {a.percentComplete}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#091E30]">{a.updatedAt}</td>
                </tr>
              ))}
              {props.abstracts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-4 text-center text-usra-gray">
                    No abstracts for this asset yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-usra-navy">Documents</h2>
          <UploadDocumentForm
            uploadUrl={`/api/assets/${props.assetId}/documents`}
            label="Upload a document to this asset"
            busyLabel="Uploading..."
          />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-usra-navy text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-4 py-2 font-semibold">File Name</th>
                <th className="px-4 py-2 font-semibold">Title</th>
                <th className="px-4 py-2 font-semibold">Abstract</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {props.documents.map((d, i) => (
                <tr key={d.id} className={i % 2 === 1 ? "bg-usra-pale/20 hover:bg-usra-pale/40" : "hover:bg-usra-pale/30"}>
                  <td className="px-4 py-2">
                    <button
                      className="text-usra-primary hover:underline"
                      onClick={() => setActive({ documentId: d.id, page: 1, rects: [] })}
                    >
                      {d.fileName}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-[#091E30]">{d.title}</td>
                  <td className="px-4 py-2 text-usra-gray">{d.abstractName ?? "Unattached"}</td>
                </tr>
              ))}
              {props.documents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-usra-gray">
                    No documents for this asset yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type ItemStatus = "pending" | "uploading" | "done" | "error";
interface UploadItem {
  name: string;
  status: ItemStatus;
  message?: string;
}

export function UploadDocumentForm({
  uploadUrl,
  label = "Drag & drop PDFs here, or click to browse",
  hint = "One or more PDF files",
}: {
  uploadUrl: string;
  label?: string;
  hint?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  async function uploadOne(file: File, index: number): Promise<void> {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, status: "uploading" } : it)));
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      const raw = await res.text();
      let data: {
        error?: string;
        document?: { title?: string };
        extraction?: { provider?: string; fieldsFound?: number };
        extractionError?: string | null;
      } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(raw?.slice(0, 300) || `Upload failed (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error ?? `Upload failed (HTTP ${res.status})`);

      let message: string;
      if (data.extraction) {
        message = `AI (${data.extraction.provider ?? "n/a"}) filled ${data.extraction.fieldsFound ?? 0} field(s)`;
      } else if (data.extractionError) {
        message = `Uploaded, but AI abstraction failed: ${data.extractionError}`;
      } else {
        message = "Uploaded";
      }
      setItems((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, status: data.extractionError ? "error" : "done", message } : it
        )
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, status: "error", message: (err as Error).message } : it))
      );
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length === 0) return;

    const startIndex = items.length;
    setItems((prev) => [...prev, ...files.map((f) => ({ name: f.name, status: "pending" as ItemStatus }))]);
    setBusy(true);
    // Sequential so the AI abstraction pipeline isn't hit with N parallel jobs.
    for (let i = 0; i < files.length; i++) {
      await uploadOne(files[i], startIndex + i);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy && e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={`flex w-72 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-4 text-center text-xs transition ${
          dragging
            ? "border-usra-primary bg-usra-pale/30 text-usra-primary"
            : "border-slate-300 text-usra-gray hover:border-usra-primary hover:text-usra-primary"
        }`}
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
        <span className="font-medium">{busy ? "Uploading…" : label}</span>
        <span className="text-[11px] text-slate-400">{hint}</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="w-72 space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px]">
              {it.status === "uploading" && <Loader2 size={13} className="mt-0.5 flex-shrink-0 animate-spin text-usra-primary" />}
              {it.status === "pending" && <Loader2 size={13} className="mt-0.5 flex-shrink-0 text-slate-300" />}
              {it.status === "done" && <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-green-600" />}
              {it.status === "error" && <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-amber-600" />}
              <span className="min-w-0">
                <span className="font-medium text-[#091E30]">{it.name}</span>
                {it.message && <span className="text-usra-gray"> — {it.message}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

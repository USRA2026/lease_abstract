"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

export function UploadDocumentForm({
  uploadUrl,
  label = "Upload a PDF to abstract",
  busyLabel = "Uploading + abstracting...",
}: {
  uploadUrl: string;
  label?: string;
  busyLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      // Read as text first so a non-JSON error body (e.g. a raw 500) becomes a
      // readable message instead of an "Unexpected end of JSON input" crash.
      const raw = await res.text();
      let data: { error?: string; document?: { title?: string }; extraction?: { provider?: string; fieldsFound?: number } } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(raw?.slice(0, 300) || `Upload failed (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error ?? `Upload failed (HTTP ${res.status})`);
      const docTitle = data.document?.title ?? "document";
      setMessage(
        data.extraction
          ? `Uploaded "${docTitle}". AI (${data.extraction.provider ?? "n/a"}) found ${data.extraction.fieldsFound ?? 0} field value(s).`
          : `Uploaded "${docTitle}".`
      );
      router.refresh();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-usra-gray hover:border-usra-primary hover:text-usra-primary">
        <UploadCloud size={14} />
        {busy ? busyLabel : label}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>
      {message && <div className="max-w-md text-xs text-usra-gray">{message}</div>}
    </div>
  );
}

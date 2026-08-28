"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

export function UploadDocumentForm({ abstractId }: { abstractId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/abstracts/${abstractId}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setMessage(
        `Uploaded "${data.document.title}". AI (${data.extraction?.provider ?? "n/a"}) found ${data.extraction?.fieldsFound ?? 0} field value(s).`
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
        {busy ? "Uploading + abstracting..." : "Upload a PDF to abstract"}
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

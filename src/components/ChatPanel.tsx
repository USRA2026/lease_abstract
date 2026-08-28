"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import type { HighlightRect } from "./PdfCanvas";

export interface ChatCitation {
  id: string;
  documentId: string;
  documentAcronym: string;
  page: number;
  label: string;
  snippet: string;
  highlightRects: HighlightRect[];
}

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: ChatCitation[];
}

export function ChatPanel({
  abstractId,
  onCitationSelect,
}: {
  abstractId: string;
  onCitationSelect: (citation: ChatCitation) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "USER", content: question, citations: [] }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/abstracts/${abstractId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chatSessionId: sessionId }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setSessionId(data.chatSessionId);
      setMessages((m) => [...m, { id: data.id, role: "ASSISTANT", content: data.content, citations: data.citations }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `error-${Date.now()}`, role: "ASSISTANT", content: "Something went wrong answering that. Try again.", citations: [] },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-usra-navy">
        <Sparkles size={16} className="text-usra-primary" /> Ask AI
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-xs text-usra-gray">
            Ask a question about the tenant, dates, rent, guaranty, or any other term in this abstract&apos;s source
            documents.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "USER"
                ? "ml-6 rounded-lg bg-usra-pale/40 p-3 text-sm text-[#091E30]"
                : "mr-2 rounded-lg bg-slate-50 p-3 text-sm text-[#091E30]"
            }
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.citations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {m.citations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onCitationSelect(c)}
                    className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-usra-primary ring-1 ring-usra-primary/30 hover:bg-usra-primary hover:text-white"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-xs text-usra-gray">Thinking...</div>}
      </div>
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Ask a question..."
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-usra-primary focus:outline-none focus:ring-1 focus:ring-usra-primary"
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-md bg-usra-primary p-2 text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-usra-gray">
          Ask AI&apos;s answers are based on this abstract and its associated documents. Ask AI can make mistakes.
          Please verify answers.
        </p>
      </div>
    </div>
  );
}

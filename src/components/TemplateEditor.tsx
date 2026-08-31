"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from "lucide-react";

const FIELD_TYPES = ["TEXT", "LONG_TEXT", "CURRENCY", "PERCENT", "DATE", "NUMBER"] as const;
type FieldType = (typeof FIELD_TYPES)[number];

export interface EditorField {
  id: string;
  label: string;
  fieldType: FieldType;
  helpText: string | null;
}
export interface EditorSection {
  id: string;
  name: string;
  fields: EditorField[];
}
export interface EditorTemplate {
  id: string;
  name: string;
  kind: "LEASE" | "LOAN";
  abstractCount: number;
  sections: EditorSection[];
}

export function TemplateEditor({ templates }: { templates: EditorTemplate[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"LEASE" | "LOAN">("LEASE");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!res.ok) throw new Error(data.error ?? `Request failed (HTTP ${res.status})`);
      router.refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createTemplate() {
    if (!newName.trim()) return;
    if (await call("/api/templates", "POST", { name: newName.trim(), kind: newKind })) {
      setNewName("");
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-usra-primary">Templates</h1>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-md bg-usra-primary px-4 py-2 text-sm font-medium text-white hover:bg-usra-navy"
          >
            <Plus size={16} /> New Template
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-usra-pale bg-usra-pale/20 p-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name"
            className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-usra-primary"
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as "LEASE" | "LOAN")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-usra-primary"
          >
            <option value="LEASE">Lease</option>
            <option value="LOAN">Loan</option>
          </select>
          <button
            disabled={busy || !newName.trim()}
            onClick={createTemplate}
            className="rounded-md bg-usra-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-usra-navy disabled:opacity-50"
          >
            Create
          </button>
          <button onClick={() => setCreating(false)} className="rounded-md px-2 py-1.5 text-sm text-usra-gray hover:text-usra-navy">
            Cancel
          </button>
        </div>
      )}

      {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="space-y-6">
        {templates.map((t) => {
          const fieldCount = t.sections.reduce((sum, s) => sum + s.fields.length, 0);
          const isOpen = expanded[t.id];
          return (
            <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [t.id]: !e[t.id] }))}
                  className="flex items-center gap-2 text-left"
                >
                  {isOpen ? <ChevronDown size={18} className="text-usra-gray" /> : <ChevronRight size={18} className="text-usra-gray" />}
                  <div>
                    <h2 className="text-lg font-semibold text-usra-navy">{t.name}</h2>
                    <p className="text-xs text-usra-gray">
                      {t.kind} · {t.sections.length} sections · {fieldCount} fields · {t.abstractCount} abstract
                      {t.abstractCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
                <InlineActions
                  onRename={(name) => call(`/api/templates/${t.id}`, "PATCH", { name })}
                  onDelete={() => {
                    if (window.confirm(`Delete template "${t.name}"?`)) call(`/api/templates/${t.id}`, "DELETE");
                  }}
                  currentName={t.name}
                  busy={busy}
                />
              </div>

              {!isOpen && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.sections.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-usra-pale/50 px-2.5 py-0.5 text-xs text-usra-navy"
                      title={s.fields.map((f) => f.label).join(", ")}
                    >
                      {s.name} ({s.fields.length})
                    </span>
                  ))}
                </div>
              )}

              {isOpen && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  {t.sections.map((section) => (
                    <SectionEditor key={section.id} section={section} call={call} busy={busy} />
                  ))}
                  <AddRow
                    placeholder="Add a section (e.g. Insurance)"
                    onAdd={(name) => call(`/api/templates/${t.id}/sections`, "POST", { name })}
                  />
                </div>
              )}
            </div>
          );
        })}
        {templates.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-usra-gray">
            No templates yet. Create one to define the sections and fields an abstract captures.
          </div>
        )}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  call,
  busy,
}: {
  section: EditorSection;
  call: (url: string, method: string, body?: unknown) => Promise<boolean>;
  busy: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <InlineName
          value={section.name}
          className="text-sm font-semibold text-usra-navy"
          onSave={(name) => call(`/api/sections/${section.id}`, "PATCH", { name })}
        />
        <InlineActions
          currentName={section.name}
          hideRename
          onDelete={() => {
            if (window.confirm(`Delete section "${section.name}" and its fields?`)) call(`/api/sections/${section.id}`, "DELETE");
          }}
          busy={busy}
        />
      </div>
      <div className="space-y-1.5">
        {section.fields.map((field) => (
          <FieldEditor key={field.id} field={field} call={call} busy={busy} />
        ))}
      </div>
      <div className="mt-2">
        <AddRow small placeholder="Add a field (e.g. Tenant Name)" onAdd={(label) => call(`/api/sections/${section.id}/fields`, "POST", { label })} />
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  call,
  busy,
}: {
  field: EditorField;
  call: (url: string, method: string, body?: unknown) => Promise<boolean>;
  busy: boolean;
}) {
  const [label, setLabel] = useState(field.label);
  return (
    <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label.trim() && label !== field.label && call(`/api/fields/${field.id}`, "PATCH", { label: label.trim() })}
        className="flex-1 rounded px-1 py-0.5 text-sm outline-none focus:bg-usra-pale/20"
      />
      <select
        value={field.fieldType}
        disabled={busy}
        onChange={(e) => call(`/api/fields/${field.id}`, "PATCH", { fieldType: e.target.value })}
        className="rounded border border-slate-200 bg-transparent px-1.5 py-0.5 text-xs text-usra-gray outline-none focus:border-usra-primary"
      >
        {FIELD_TYPES.map((ft) => (
          <option key={ft} value={ft}>
            {ft}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (window.confirm(`Delete field "${field.label}"?`)) call(`/api/fields/${field.id}`, "DELETE");
        }}
        className="text-usra-gray hover:text-red-600"
        title="Delete field"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function InlineName({ value, onSave, className }: { value: string; onSave: (name: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft.trim() && draft !== value) onSave(draft.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="rounded-md border border-slate-300 px-2 py-0.5 text-sm outline-none focus:border-usra-primary"
      />
    );
  }
  return (
    <button onClick={() => setEditing(true)} className={className} title="Click to rename">
      {value}
    </button>
  );
}

function InlineActions({
  currentName,
  onRename,
  onDelete,
  busy,
  hideRename,
}: {
  currentName: string;
  onRename?: (name: string) => void;
  onDelete: () => void;
  busy: boolean;
  hideRename?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);
  if (editing && onRename) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(draft.trim());
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          className="rounded-md border border-slate-300 px-2 py-0.5 text-sm outline-none focus:border-usra-primary"
        />
        <button
          onClick={() => {
            onRename(draft.trim());
            setEditing(false);
          }}
          className="text-usra-primary hover:text-usra-navy"
        >
          <Check size={16} />
        </button>
        <button onClick={() => setEditing(false)} className="text-usra-gray hover:text-usra-navy">
          <X size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {!hideRename && onRename && (
        <button
          onClick={() => {
            setDraft(currentName);
            setEditing(true);
          }}
          className="text-usra-gray hover:text-usra-primary"
          title="Rename"
        >
          <Pencil size={15} />
        </button>
      )}
      <button onClick={onDelete} disabled={busy} className="text-usra-gray hover:text-red-600" title="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function AddRow({ placeholder, onAdd, small }: { placeholder: string; onAdd: (name: string) => void; small?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
        }}
        placeholder={placeholder}
        className={`flex-1 rounded-md border border-dashed border-slate-300 px-2 outline-none focus:border-usra-primary ${
          small ? "py-1 text-xs" : "py-1.5 text-sm"
        }`}
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
        }}
        className={`flex items-center gap-1 rounded-md border border-slate-300 text-usra-navy hover:border-usra-primary hover:text-usra-primary ${
          small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
        }`}
      >
        <Plus size={small ? 12 : 14} /> Add
      </button>
    </div>
  );
}

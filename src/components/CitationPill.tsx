"use client";

export function CitationPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="ml-1 whitespace-nowrap align-baseline text-xs italic text-usra-gray hover:text-usra-primary hover:underline"
    >
      [{label}]
    </button>
  );
}

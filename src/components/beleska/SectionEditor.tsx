"use client";

import { useRef } from "react";

/**
 * Jedna tekstualna sekcija beleške: nadnaslov (label + hint), traka sa dugmićima za
 * markdown-lite oznake (video src/lib/beleska-markup.ts) i tekstualno polje.
 *
 * Dugmići ubacuju oznake OKO IZABRANOG teksta, pa profesorka ne mora da pamti sintaksu -
 * i posle ubacivanja izbor ostaje NA TEKSTU (ne na oznakama), da može odmah da nastavi da kuca.
 */

interface SectionEditorProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}

type WrapKind = "bold" | "italic" | "mark";

const WRAP_MARKERS: Record<WrapKind, string> = {
  bold: "**",
  italic: "*",
  mark: "==",
};

const WRAP_LABELS: Record<WrapKind, string> = {
  bold: "B",
  italic: "I",
  mark: "Marker",
};

export default function SectionEditor({ label, hint, value, onChange }: SectionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function applyWrap(kind: WrapKind) {
    const el = textareaRef.current;
    if (!el) return;
    const marker = WRAP_MARKERS[kind];
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
    onChange(next);
    const newStart = start + marker.length;
    const newEnd = newStart + selected.length;
    // requestAnimationFrame - nakon što React commit-uje novu vrednost u textarea, tek onda
    // sme da se pomeri selekcija, inače je ponovni render odmah poništi.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    });
  }

  function applyList() {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
    const next = value.slice(0, lineStart) + "- " + value.slice(lineStart);
    onChange(next);
    const newCursor = cursor + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => applyWrap("bold")}
          aria-label="Podebljaj izabrani tekst"
          className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-200 px-3 font-bold text-gray-700 hover:bg-gray-50"
        >
          {WRAP_LABELS.bold}
        </button>
        <button
          type="button"
          onClick={() => applyWrap("italic")}
          aria-label="Iskosi izabrani tekst"
          className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-200 px-3 italic text-gray-700 hover:bg-gray-50"
        >
          {WRAP_LABELS.italic}
        </button>
        <button
          type="button"
          onClick={() => applyWrap("mark")}
          aria-label="Obeleži izabrani tekst markerom"
          className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-gray-700 hover:bg-gray-50"
        >
          <span className="rounded-sm bg-koral-light px-1">{WRAP_LABELS.mark}</span>
        </button>
        <button
          type="button"
          onClick={applyList}
          aria-label="Ubaci stavku liste u red gde je kursor"
          className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-gray-700 hover:bg-gray-50"
        >
          Lista
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        rows={4}
        className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-plava focus:outline-none"
      />
    </div>
  );
}

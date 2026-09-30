"use client";

import { useEffect, useRef, useState } from "react";
import type { WortschatzRow } from "@/lib/class-notes";

/**
 * WORTSCHATZ tabela - najvažnije polje obrasca, jer ove reči odmah postaju kartice polaznika.
 * Skrojena za kucanje tokom časa: Tab prelazi sa nemačke reči na prevod (to radi pregledač
 * sam), a Enter u polju za prevod otvara nov red i prebacuje fokus u nemačko polje TOG reda.
 *
 * WortschatzRow (de/sr) nema id, a redovi moraju da se uklanjaju bez mešanja sadržaja - zato
 * ovde vodimo lokalni niz sa STABILNIM id-jem po redu (generisanim jednom, ne po indeksu) i
 * njega koristimo za React key i za fokus posle dodavanja reda. `rows`/`onChange` ka roditelju
 * ostaju čist WortschatzRow[] - id je isključivo unutrašnja stvar ove komponente.
 */

interface Row {
  id: string;
  de: string;
  sr: string;
}

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `w${idSeq}`;
}

function toRows(rows: WortschatzRow[]): Row[] {
  if (rows.length === 0) return [{ id: nextId(), de: "", sr: "" }];
  return rows.map((r) => ({ id: nextId(), de: r.de, sr: r.sr }));
}

function stripIds(rows: Row[]): WortschatzRow[] {
  return rows.map((r) => ({ de: r.de, sr: r.sr }));
}

function sameContent(a: WortschatzRow[], b: WortschatzRow[]): boolean {
  return a.length === b.length && a.every((r, i) => r.de === b[i]?.de && r.sr === b[i]?.sr);
}

export default function WortschatzTable({
  rows,
  onChange,
}: {
  rows: WortschatzRow[];
  onChange: (rows: WortschatzRow[]) => void;
}) {
  const [localRows, setLocalRows] = useState<Row[]>(() => toRows(rows));
  // Šta je OVA komponenta poslednje emitovala - da razlikuje "roditelj mi je vratio moju
  // sopstvenu promenu" (ignoriši, id-jevi ostaju stabilni) od "spoljni izvor je zamenio sadržaj"
  // (GET pri otvaranju ili nacrt iz localStorage-a koji ima prednost - tek tad resinhronizuj).
  const lastEmitted = useRef<WortschatzRow[]>(stripIds(localRows));
  const deInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocusId = useRef<string | null>(null);

  useEffect(() => {
    if (sameContent(rows, lastEmitted.current)) return;
    const next = toRows(rows);
    setLocalRows(next);
    lastEmitted.current = stripIds(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => {
    if (!pendingFocusId.current) return;
    deInputRefs.current[pendingFocusId.current]?.focus();
    pendingFocusId.current = null;
  });

  function emit(next: Row[]) {
    setLocalRows(next);
    const stripped = stripIds(next);
    lastEmitted.current = stripped;
    onChange(stripped);
  }

  function updateCell(id: string, field: "de" | "sr", value: string) {
    emit(localRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow(focusNew: boolean) {
    const row: Row = { id: nextId(), de: "", sr: "" };
    if (focusNew) pendingFocusId.current = row.id;
    emit([...localRows, row]);
  }

  function removeRow(id: string) {
    const next = localRows.filter((r) => r.id !== id);
    emit(next.length > 0 ? next : [{ id: nextId(), de: "", sr: "" }]);
  }

  function handleTranslationKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (index === localRows.length - 1) {
      addRow(true);
    } else {
      const next = localRows[index + 1];
      deInputRefs.current[next.id]?.focus();
    }
  }

  return (
    <div className="rounded-xl border border-plava-light bg-plava-light p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
        WORTSCHATZ{" "}
        <span className="font-normal normal-case text-gray-500">
          - ove reči odmah postaju kartice polaznika
        </span>
      </p>
      <div className="mb-2 hidden gap-2 px-1 text-xs font-medium text-gray-500 sm:flex">
        <span className="w-1/2">Nemački</span>
        <span className="w-1/2">Naš</span>
        <span className="w-[44px]" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        {localRows.map((row, i) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              ref={(el) => {
                deInputRefs.current[row.id] = el;
              }}
              type="text"
              value={row.de}
              onChange={(e) => updateCell(row.id, "de", e.target.value)}
              aria-label="Nemački"
              placeholder="die Bedingung, -en"
              className="min-h-[44px] w-1/2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-plava focus:outline-none"
            />
            <input
              type="text"
              value={row.sr}
              onChange={(e) => updateCell(row.id, "sr", e.target.value)}
              onKeyDown={(e) => handleTranslationKeyDown(e, i)}
              aria-label="Naš"
              placeholder="uslov, -i"
              className="min-h-[44px] w-1/2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-plava focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label={row.de ? `Ukloni red "${row.de}"` : `Ukloni red ${i + 1}`}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg text-gray-400 hover:bg-white hover:text-koral"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addRow(false)}
        className="mt-3 min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-plava hover:bg-plava-light"
      >
        + dodaj red
      </button>
    </div>
  );
}

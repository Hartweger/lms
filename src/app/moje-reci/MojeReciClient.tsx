"use client";
import { useEffect, useRef, useState } from "react";
import WordSetBlock from "@/components/lesson-blocks/WordSetBlock";
import type { StudentWordset } from "@/lib/beleske-student";
import { formatLessonDateShort } from "@/lib/beleske-date";

function reciLabel(n: number): string {
  return n === 1 ? "reč" : "reči";
}

// "čas" je muškog roda - 1 čas, 2/3/4 časa, 5+ časova (uobičajeno pravilo za naš jezik).
function casovaLabel(n: number): string {
  const zadnja = n % 10;
  const zadnjeDve = n % 100;
  if (zadnja === 1 && zadnjeDve !== 11) return "časa";
  if (zadnja >= 2 && zadnja <= 4 && (zadnjeDve < 10 || zadnjeDve >= 20)) return "časa";
  return "časova";
}

export default function MojeReciClient({
  sets,
  initialSetId,
}: {
  sets: StudentWordset[];
  initialSetId: string | null;
}) {
  const [uciSve, setUciSve] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Samo pri prvom prikazu stranice - ?set= dolazi iz linka na beleškama jednom,
    // ne prati kasnije promene liste.
    if (initialSetId && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sets.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Moje reči</h1>
        <p className="mt-6 rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
          Još nemaš reči. Pojaviće se posle prvog časa na kom profesorka upiše nove reči.
        </p>
      </main>
    );
  }

  const totalWords = sets.reduce((n, s) => n + s.items.length, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Moje reči</h1>
      <p className="text-sm text-gray-500 mb-6">Kartice iz svih tvojih časova, na jednom mestu.</p>

      {sets.length > 1 && (
        <div className="mb-6 rounded-xl border-2 border-plava bg-plava-light p-5 text-center">
          <h2 className="font-bold text-gray-900 mb-1">Sve reči</h2>
          <p className="text-sm text-gray-600 mb-4">
            {totalWords} {reciLabel(totalWords)} iz {sets.length} {casovaLabel(sets.length)}
          </p>
          <button
            onClick={() => setUciSve(true)}
            className="bg-plava text-white rounded-xl px-6 py-3 font-bold"
          >
            Uči sve
          </button>
        </div>
      )}

      {/*
        VAŽNO: svaki termin je SVOJ WordSetBlock, sa svojim setKey - "Sve reči" gore NIKAD ne
        pravi jedan zajednički set. card_id (src/lib/flashcard-card-id.ts) se izvodi iz set_key
        (src/lib/wordset-derive.ts: wordsetSetKey), pa bi ista reč upisana u dva različita
        termina, u zajedničkom setu, dobila DRUGAČIJI card_id nego u svom pravom setu - napredak
        za tu reč bi se onda brojao (i prikazivao) dvaput, u dva nepovezana zapisa. "Uči sve"
        zato samo otvara SVE postojeće WordSetBlock-ove odjednom (startMode="guided"), svaki i
        dalje piše napredak pod svojim izvornim setKey-om.
      */}
      <div className="space-y-6">
        {sets.map((s) => (
          <div key={s.id} ref={s.id === initialSetId ? targetRef : undefined}>
            <p className="text-xs text-gray-400 mb-1">{formatLessonDateShort(s.lessonDate)}</p>
            <WordSetBlock
              type="wordset"
              title={s.title}
              setKey={s.setKey}
              items={s.items}
              startMode={uciSve || s.id === initialSetId ? "guided" : undefined}
            />
          </div>
        ))}
      </div>
    </main>
  );
}

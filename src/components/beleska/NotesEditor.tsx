"use client";

import { useEffect, useRef, useState } from "react";
import {
  emptyNoteContent,
  TEXT_SECTIONS,
  type NoteContent,
  type TextSectionKey,
  type WortschatzRow,
} from "@/lib/class-notes";
import SectionEditor from "./SectionEditor";
import WortschatzTable from "./WortschatzTable";

/**
 * Ceo obrazac za belešku sa 1:1 časa - profesorka ga otvara TOKOM časa, uživo na Meet-u, pa
 * brzina i sigurnost kucanja imaju prednost nad izgledom.
 *
 * Nacrt u localStorage-u se piše SINHRONO na svaku izmenu (ne čeka odlaganje od 2s pre PUT-a) -
 * to je prava zaštita od gubitka kucanja pri iznenadnom zatvaranju kartice, jer poslednje
 * otkucano uvek stoji u localStorage-u pre nego što bi i najbrže zatvaranje moglo da stigne.
 * beforeunload dodatno pokuša fetch(..., { keepalive: true }) da otkucano stigne i do baze, ali
 * to je bonus, ne jedina odbrana.
 */

const SAVE_DELAY_MS = 2000;

type SaveState = "idle" | "saving" | "saved" | "error" | "paket_pun";

function draftKey(enrollmentId: string, date: string): string {
  return `beleska_nacrt_${enrollmentId}_${date}`;
}

function readDraft(enrollmentId: string, date: string): NoteContent | null {
  try {
    const raw = localStorage.getItem(draftKey(enrollmentId, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeDraft(parsed);
  } catch {
    return null;
  }
}

function writeDraft(enrollmentId: string, date: string, content: NoteContent) {
  try {
    localStorage.setItem(draftKey(enrollmentId, date), JSON.stringify(content));
  } catch {
    // privatni prozor ili pun localStorage - nacrt jednostavno neće biti dostupan, ne rušimo obrazac
  }
}

function clearDraft(enrollmentId: string, date: string) {
  try {
    localStorage.removeItem(draftKey(enrollmentId, date));
  } catch {
    // ništa - ako brisanje ne uspe, sledeće otvaranje će prosto ponovo ponuditi isti nacrt
  }
}

// Nacrt dolazi iz localStorage-a (proizvoljan JSON) - svedi ga na očekivani oblik pre upotrebe,
// isto kao što ruta radi za sadržaj iz baze (sanitizeNoteContent u api/profesor/class-notes).
function sanitizeDraft(raw: unknown): NoteContent | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const out = emptyNoteContent();
  for (const s of TEXT_SECTIONS) {
    const v = src[s.key];
    if (typeof v === "string" && v.trim().length > 0) out[s.key] = v;
  }
  const rows = Array.isArray(src.wortschatz) ? src.wortschatz : [];
  out.wortschatz = rows
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r): WortschatzRow => ({ de: String(r.de ?? ""), sr: String(r.sr ?? "") }));
  return out;
}

export default function NotesEditor({
  enrollmentId,
  studentName,
  date,
  onClose,
}: {
  enrollmentId: string;
  studentName: string;
  date: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState<NoteContent>(emptyNoteContent());
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const contentRef = useRef(content);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestId = useRef(0);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Učitavanje: GET za postojeću belešku, ali nacrt iz localStorage-a (ako postoji za baš ovaj
  // enrollment+datum) ima prednost nad onim iz baze - veza je možda pala pre poslednjeg snimanja.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const draft = readDraft(enrollmentId, date);

    (async () => {
      try {
        const res = await fetch(
          `/api/profesor/class-notes?enrollmentId=${encodeURIComponent(enrollmentId)}&date=${encodeURIComponent(date)}`
        );
        const j = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(j.error || "Beleška nije mogla da se učita.");
          if (draft) setContent(draft);
          return;
        }
        setLessonId(j.lessonId ?? null);
        // canCreate je bitno samo kad čas za ovaj datum još ne postoji - ako postoji, uređivanje
        // beleške je uvek dozvoljeno (isto pravilo kao u PUT ruti).
        setCanCreate(j.lessonId ? true : Boolean(j.canCreate));
        setContent(draft ?? (j.content as NoteContent) ?? emptyNoteContent());
      } catch {
        if (cancelled) return;
        setLoadError("Greška u mreži - ne mogu da učitam belešku.");
        // Mrežna greška ne sme da blokira kucanje ako nacrt već postoji - pravi problem (npr.
        // paket pun) će se javiti tek pri snimanju, gde ionako imamo poseban prikaz za to.
        if (draft) {
          setContent(draft);
          setCanCreate(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId, date]);

  async function doSave(): Promise<boolean> {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const myId = ++latestRequestId.current;
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const res = await fetch("/api/profesor/class-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, date, content: contentRef.current }),
      });
      const j = await res.json();
      // Stariji odgovor stigao posle novijeg zahteva (profesorka je nastavila da kuca dok je
      // ovaj bio u letu) - ne diraj stanje, noviji zahtev (već poslat ili u toku) je merodavan.
      if (myId !== latestRequestId.current) return res.ok;

      if (!res.ok) {
        if (j.code === "paket_pun") {
          setSaveState("paket_pun");
          setSaveMessage(j.error || "Paket je iskorišćen - čas nije upisan, beleška nije snimljena.");
        } else {
          setSaveState("error");
          setSaveMessage(j.error || "Greška pri snimanju.");
        }
        return false;
      }

      setSaveState("saved");
      setSaveMessage(null);
      setLessonId(j.lessonId ?? null);
      setCanCreate(true);
      clearDraft(enrollmentId, date);
      return true;
    } catch {
      if (myId !== latestRequestId.current) return false;
      setSaveState("error");
      setSaveMessage("Greška u mreži - pokušaj ponovo. Otkucano ostaje sačuvano lokalno.");
      return false;
    }
  }

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void doSave();
    }, SAVE_DELAY_MS);
  }

  function updateContent(patch: Partial<NoteContent>) {
    setContent((prev) => {
      const next = { ...prev, ...patch };
      writeDraft(enrollmentId, date, next);
      return next;
    });
    setSaveState("idle");
    setSaveMessage(null);
    scheduleSave();
  }

  function updateSection(key: TextSectionKey, value: string) {
    updateContent({ [key]: value } as Partial<NoteContent>);
  }

  // Snimi na zatvaranje kartice/pregledača dok odlaganje od 2s još nije prošlo - bonus uz nacrt
  // koji je već upisan sinhrono; keepalive dozvoljava zahtevu da preživi unload.
  useEffect(() => {
    function handleBeforeUnload() {
      if (!saveTimer.current) return;
      try {
        void fetch("/api/profesor/class-notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentId, date, content: contentRef.current }),
          keepalive: true,
        });
      } catch {
        // najbolji mogući pokušaj - nacrt u localStorage-u je prava zaštita
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enrollmentId, date]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function handleClose() {
    if (blocked) {
      // Nema na šta da se veže (paket pun/arhiviran, čas za ovaj datum ne postoji) - obrazac se
      // ni ne prikazuje, pa nema ni otkucanog teksta koji bi snimanje moglo da izgubi.
      onClose();
      return;
    }
    const ok = await doSave();
    if (ok) onClose();
    // Ako snimanje ne uspe, dijalog ostaje otvoren sa vidljivom porukom (paket_pun ili greška) -
    // otkucano ostaje i u nacrtu, profesorka ne gubi ništa, ali zatvaranje se ne dešava tiho.
  }

  function saveStatusLabel(): string {
    switch (saveState) {
      case "saving":
        return "snimam...";
      case "saved":
        return "snimljeno";
      case "error":
        return saveMessage || "greška pri snimanju";
      case "paket_pun":
        return saveMessage || "paket je iskorišćen";
      default:
        return "";
    }
  }

  const blocked = !loading && !lessonId && !canCreate;
  const temaSection = TEXT_SECTIONS.find((s) => s.key === "tema")!;
  const restSections = TEXT_SECTIONS.filter((s) => s.key !== "tema");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 md:p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Beleške za današnji čas
            </h2>
            <p className="text-sm text-gray-500">
              {studentName || "Polaznik"} · {new Date(date).toLocaleDateString("sr-Latn")}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          {loading && <p className="text-sm text-gray-400">Učitavam belešku...</p>}

          {loadError && (
            <p className="rounded-lg bg-koral-light px-3 py-2 text-sm text-koral-dark">{loadError}</p>
          )}

          {!loading && blocked && (
            <p className="rounded-lg bg-koral-light px-3 py-2 text-sm text-koral-dark">
              Paket je iskorišćen - za ovaj datum ne može da se upiše nov čas, pa ni beleška nema na
              šta da se veže. Dodaj čas u panelu ili otvori nov paket, pa se vrati ovde.
            </p>
          )}

          {!loading && !blocked && (
            <>
              {saveState === "paket_pun" && (
                <p className="rounded-lg bg-koral-light px-3 py-2 text-sm text-koral-dark">
                  {saveMessage}
                </p>
              )}
              {saveState === "error" && (
                <p className="rounded-lg bg-koral-light px-3 py-2 text-sm text-koral-dark">
                  {saveMessage}
                </p>
              )}

              <SectionEditor
                label={temaSection.label}
                hint={temaSection.hint}
                value={content.tema ?? ""}
                onChange={(v) => updateSection("tema", v)}
              />

              <WortschatzTable
                rows={content.wortschatz}
                onChange={(rows) => updateContent({ wortschatz: rows })}
              />

              {restSections.map((s) => (
                <SectionEditor
                  key={s.key}
                  label={s.label}
                  hint={s.hint}
                  value={content[s.key] ?? ""}
                  onChange={(v) => updateSection(s.key, v)}
                />
              ))}

              <p className="text-xs text-gray-400">
                Sekciju koju ostaviš praznu polaznik neće videti - ni naslov. Reči iz tabele odmah
                postaju njegove kartice za vežbanje.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-4 md:p-6">
          <p className="min-h-[1.25rem] text-xs text-gray-400">{!blocked && saveStatusLabel()}</p>
          <div className="flex gap-2">
            {!blocked && (
              <button
                type="button"
                onClick={() => void doSave()}
                disabled={saveState === "saving"}
                className="min-h-[44px] rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Snimi sad
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleClose()}
              className="min-h-[44px] rounded-lg bg-plava px-4 text-sm font-medium text-white hover:bg-plava-dark"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

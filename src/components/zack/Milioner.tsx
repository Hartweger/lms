"use client";

// Milioner: provera celine, ne igra za sličice.
//
// ŠTA OVDE NAMERNO NEMA
// ---------------------
// Nema srca, nema kesice, nema sličica i nema rekorda. Milioner ne dodiruje
// nijednu rutu koja nešto upisuje. Razlog je što provera znanja i skupljanje ne
// smeju da se pomešaju: dete koje na proveri gubi sličice prestane da bira
// odgovor koji misli da je tačan i počne da bira odgovor koji je siguran.
// Zato ovde nema šta da se izgubi, pa nema ni straha.
//
// I NEMA OCENE. Na kraju stoji samo koliko je tačnih od ukupno. Bez procenata,
// bez „odlično" i bez „probaj ponovo, biće bolje". Slab rezultat se ne
// komentariše nijednom rečju - to je pravilo, a ne ukras.
//
// UVODNI EKRAN NOSI SAMO NAZIVE
// -----------------------------
// Prvi ekran je spisak naziva gramatičkih tačaka koje ulaze u partiju, i ništa
// više. Ceo taj ekran, zajedno sa dugmetom „Kreni", staje na 375x812 bez
// skrolovanja, i to je jedini razlog zašto objašnjenja tu ne stoje razmotana.
// Ranije su stajala, pa je ekran bio visok jedan i po telefon: dete koje je
// došlo da igra palcem stigne do dna za dve sekunde i ne pročita ništa.
//
// Ništa se time ne gubi. Objašnjenje i primer i dalje su tu, tap na naziv ih
// otvori, ponovni tap ih sklopi. A isti taj tekst stiže i kao pomoć „pitaj
// profesorku", u trenutku kad dete ne zna odgovor, dakle onda kad ga stvarno
// čita. To je i ceo smisao te pomoći: ne pokazuje odgovor nego pravilo po kom
// se do odgovora dolazi.
//
// GDE ŽIVI PRAVILO O OBRAĐENOM GRADIVU
// ------------------------------------
// Ruta vraća samo dozvoljeno gradivo, a `sastaviPartiju` isti uslov proverava
// još jednom, ovde na strani deteta. Nijedno od ta dva mesta se ne oslanja na
// ono drugo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  polaPola,
  sastaviPartiju,
  zameniPitanje,
  type GramatickaTacka,
  type GramatickoPitanje,
  type PitanjePartije,
} from "@/lib/zack/milioner";

// Papir, iste boje kao i ostatak zacka.
const PODLOGA = "#F4F1E9";
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const PLAVA = "#0B54C9";
const ZELENA = "#1E7A4B";

/** Koliko odziv stoji na ekranu. Greška duže, jer se uz nju čita i tačan odgovor. */
const ZADRZI_TACNO = 850;
const ZADRZI_GRESKU = 1900;

/** Vidljiv fokus, isti za sve što se klikće. Zaobljenje se dodaje uz njega. */
const FOKUS =
  "outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default";
/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const DUGME = `rounded-2xl ${FOKUS}`;

type Odziv = { tacno: boolean; tekst: string };
type Pomoc = "pola" | "profesorka" | "zamena";
/**
 * Kraj partije nema svoju fazu: on je stanje u kom je `indeks` prešao poslednje
 * pitanje. Zasebna faza bi bila drugi izvor iste istine, pa bi pre ili kasnije
 * neko od njih dvoje kasnio.
 */
type Faza = "ucitavam" | "podsetnik" | "pitanja" | "greska" | "prazno";

// ── Čitanje odgovora rute ───────────────────────────────────────────────────
//
// Odgovor sopstvene rute se ne uzima na veru. Nije stvar nepoverenja, nego toga
// da jedan pokvaren red ne sme da obori ekran detetu usred provere.

function jeTacka(v: unknown): v is GramatickaTacka {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.redni_broj === "number" &&
    typeof o.naziv === "string" &&
    typeof o.objasnjenje === "string" &&
    (o.primer === null || typeof o.primer === "string") &&
    typeof o.od_lekcije === "number"
  );
}

function jePitanje(v: unknown): v is GramatickoPitanje {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.gramatika_id === "string" &&
    typeof o.pitanje === "string" &&
    Array.isArray(o.opcije) &&
    typeof o.tacan === "number" &&
    typeof o.tezina === "number"
  );
}

type Gradivo = { brojLekcije: number; tacke: GramatickaTacka[]; pitanja: GramatickoPitanje[] };

function citajGradivo(telo: unknown): Gradivo | null {
  if (typeof telo !== "object" || telo === null) return null;
  const o = telo as Record<string, unknown>;
  if (typeof o.brojLekcije !== "number") return null;
  return {
    brojLekcije: o.brojLekcije,
    tacke: (Array.isArray(o.tacke) ? o.tacke : []).filter(jeTacka),
    pitanja: (Array.isArray(o.pitanja) ? o.pitanja : []).filter(jePitanje),
  };
}

// ── Ekran ───────────────────────────────────────────────────────────────────

export default function Milioner({
  childId,
  lekcijaId,
  onIzlaz,
}: {
  childId: string;
  lekcijaId: string;
  /** Povratak na ekran lekcije. Milioner nema šta da preda, pa ne nosi ništa. */
  onIzlaz: () => void;
}) {
  const [faza, setFaza] = useState<Faza>("ucitavam");

  // Sve tačke koje su detetu dozvoljene, ne samo one iz partije. Zamenjeno
  // pitanje ume da dođe iz tačke koja u podsetniku nije stajala, a „pitaj
  // profesorku" i tada mora da nađe objašnjenje.
  const [sveTacke, setSveTacke] = useState<GramatickaTacka[]>([]);
  /** Tačke koje ulaze u ovu partiju. To je ono što dete čita pre nego što krene. */
  const [tacke, setTacke] = useState<GramatickaTacka[]>([]);
  const [pitanja, setPitanja] = useState<PitanjePartije[]>([]);
  const [rezerva, setRezerva] = useState<PitanjePartije[]>([]);

  const [indeks, setIndeks] = useState(0);
  const [tacnih, setTacnih] = useState(0);
  const [odziv, setOdziv] = useState<Odziv | null>(null);
  const [izabrano, setIzabrano] = useState<number | null>(null);

  // Potrošene pomoći. Ostaju na ekranu i kad su potrošene, samo ugašene: dugme
  // koje nestane dete traži i misli da je nešto pokvarilo.
  const [potroseno, setPotroseno] = useState<Record<Pomoc, boolean>>({
    pola: false,
    profesorka: false,
    zamena: false,
  });
  /** Mesta koja ostaju posle „pola-pola". `null` znači da su svi odgovori na ekranu. */
  const [vidljiva, setVidljiva] = useState<number[] | null>(null);
  /** Otvoreno objašnjenje profesorke, samo za tekuće pitanje. */
  const [savet, setSavet] = useState<string | null>(null);
  /** Šta se javlja čitaču ekrana kad se pomoć potroši. */
  const [najava, setNajava] = useState("");

  const tajmer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (tajmer.current !== null) clearTimeout(tajmer.current);
    };
  }, []);

  // Gradivo se dovlači jednom, pri otvaranju. Partija se sastavlja odmah, da
  // podsetnik pokaže baš one tačke koje su u nju ušle.
  useEffect(() => {
    let ziv = true;
    void (async () => {
      try {
        const odgovor = await fetch(`/api/zack/${childId}/milioner`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lekcijaId }),
        });
        if (!odgovor.ok) throw new Error(`milioner ${odgovor.status}`);
        const gradivo = citajGradivo(await odgovor.json());
        if (!ziv) return;
        if (!gradivo) {
          setFaza("greska");
          return;
        }

        // Slučajnost se ubrizgava OVDE. Unutar `sastaviPartiju` nema nijednog
        // poziva ka `Math.random`, da bi partija mogla da se ponovi u testu.
        const partija = sastaviPartiju(
          gradivo.tacke,
          gradivo.pitanja,
          gradivo.brojLekcije,
          Math.random
        );
        setSveTacke(gradivo.tacke);
        setTacke(partija.tacke);
        setPitanja(partija.pitanja);
        setRezerva(partija.rezerva);
        setFaza(partija.pitanja.length === 0 ? "prazno" : "podsetnik");
      } catch {
        if (ziv) setFaza("greska");
      }
    })();
    return () => {
      ziv = false;
    };
  }, [childId, lekcijaId]);

  const pitanje: PitanjePartije | undefined = pitanja[indeks];

  const objasnjenje = useMemo(() => {
    if (!pitanje) return null;
    return sveTacke.find((t) => t.id === pitanje.gramatikaId) ?? null;
  }, [pitanje, sveTacke]);

  const naOdgovor = useCallback(
    (i: number) => {
      // Dok odziv stoji, telo je zaključano, da drugi tap ne upadne u odgovor
      // koji je već primljen.
      if (!pitanje || odziv !== null) return;

      const tacno = i === pitanje.tacan;
      if (tacno) setTacnih((t) => t + 1);
      setIzabrano(i);
      // Greška ne prekida partiju i ne nosi ime brenda: neutralno „Ups!" i ODMAH
      // tačan odgovor, pa se ide dalje. Bez prekora i bez drugog pokušaja.
      setOdziv({
        tacno,
        tekst: tacno ? "Zack!" : `Ups! ${pitanje.opcije[pitanje.tacan]}`,
      });

      tajmer.current = setTimeout(
        () => {
          setOdziv(null);
          setIzabrano(null);
          setVidljiva(null);
          setSavet(null);
          setIndeks((x) => x + 1);
        },
        tacno ? ZADRZI_TACNO : ZADRZI_GRESKU
      );
    },
    [odziv, pitanje]
  );

  const naPolaPola = useCallback(() => {
    if (!pitanje || odziv !== null || potroseno.pola) return;
    setVidljiva(polaPola(pitanje, Math.random));
    setPotroseno((p) => ({ ...p, pola: true }));
    setNajava("Pola-pola: ostala su dva odgovora.");
  }, [odziv, pitanje, potroseno.pola]);

  const naProfesorku = useCallback(() => {
    if (!pitanje || odziv !== null || potroseno.profesorka) return;
    // Objašnjenje tačke iz koje je BAŠ OVO pitanje. To je cela pomoć: pravilo,
    // nikad odgovor.
    setSavet(objasnjenje?.objasnjenje ?? "Podsetnik za ovo pitanje nije pri ruci.");
    setPotroseno((p) => ({ ...p, profesorka: true }));
    setNajava(`Profesorka kaže: ${objasnjenje?.objasnjenje ?? ""}`);
  }, [objasnjenje, odziv, pitanje, potroseno.profesorka]);

  const naZamenu = useCallback(() => {
    if (!pitanje || odziv !== null || potroseno.zamena) return;

    const uPartiji = new Set(pitanja.map((p) => p.id));
    const nova = zameniPitanje(rezerva, pitanje, uPartiji);
    if (!nova) {
      // Zamene nema. Pomoć se NE troši, da dete ne izgubi pomoć ni za šta.
      setNajava("Nema drugog pitanja za zamenu, pa ova pomoć ostaje.");
      return;
    }

    setPitanja((niz) => niz.map((p, i) => (i === indeks ? nova : p)));
    setRezerva((r) => r.filter((p) => p.id !== nova.id));
    setVidljiva(null);
    setSavet(null);
    setPotroseno((p) => ({ ...p, zamena: true }));
    setNajava("Stiglo je drugo pitanje.");
  }, [indeks, odziv, pitanje, pitanja, potroseno.zamena, rezerva]);

  // ── Ekrani koji nisu partija ──────────────────────────────────────────────

  if (faza === "ucitavam") {
    return (
      <Okvir>
        <p className="py-16 text-center text-[17px]" style={{ color: PRIGUSEN }}>
          Samo trenutak...
        </p>
      </Okvir>
    );
  }

  if (faza === "greska") {
    return (
      <Okvir>
        <p
          className="rounded-2xl border p-4 text-[16px] leading-relaxed"
          style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
        >
          Pitanja sad nisu stigla. Ništa nije izgubljeno, probaj malo kasnije.
        </p>
        <Izlaz naKlik={onIzlaz} natpis="Nazad na lekciju" />
      </Okvir>
    );
  }

  if (faza === "prazno") {
    return (
      <Okvir>
        <p
          className="rounded-2xl border p-4 text-[16px] leading-relaxed"
          style={{ background: PAPIR, borderColor: IVICA, color: PRIGUSEN }}
        >
          Za ovu lekciju još nema pitanja iz gramatike. Vrati se malo kasnije.
        </p>
        <Izlaz naKlik={onIzlaz} natpis="Nazad na lekciju" />
      </Okvir>
    );
  }

  // ── Podsetnik pre partije ─────────────────────────────────────────────────
  if (faza === "podsetnik") {
    return (
      <Okvir>
        {/* Uvod je namerno kratak. Svaki red teksta ovde gura „Kreni" ka dnu, a
            ceo ekran mora da stane bez skrolovanja i kad tačaka bude osam. */}
        <p className="text-[15px] leading-normal" style={{ color: MASTILO }}>
          Nema srca i nema sličica, samo gradivo sa časa. Tapni naziv ako hoćeš da obnoviš.
        </p>

        <ul className="mt-2 space-y-1.5">
          {tacke.map((t) => (
            <li key={t.id}>
              <TackaUPodsetniku tacka={t} />
            </li>
          ))}
        </ul>

        <p className="mt-2 text-center text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
          {`Pitanja: ${pitanja.length}. Imaš i tri pomoći.`}
        </p>

        <button
          type="button"
          onClick={() => setFaza("pitanja")}
          className={`${DUGME} font-heading mt-2 block min-h-[60px] w-full text-[19px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
          style={{ background: MASTILO, color: "#FFFFFF" }}
        >
          Kreni
        </button>
        <Izlaz naKlik={onIzlaz} natpis="Ipak ne sad" />
      </Okvir>
    );
  }

  // ── Kraj ──────────────────────────────────────────────────────────────────
  //
  // Samo broj. Bez procenta, bez ocene, bez ijedne reči o tome da li je to malo
  // ili mnogo. Dete koje je odgovorilo tri od petnaest to već zna, i ne treba mu
  // rečenica koja to potvrđuje.
  if (!pitanje) {
    return (
      <Okvir>
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <p
            className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
            style={{ color: PRIGUSEN }}
          >
            Kraj provere
          </p>
          <p className="mt-3" aria-live="polite">
            <span className="sr-only">{`Tačnih odgovora: ${tacnih} od ${pitanja.length}`}</span>
            <span
              aria-hidden="true"
              className="font-heading flex flex-wrap items-baseline justify-center gap-x-2 tabular-nums"
            >
              <span className="text-[40px] font-bold leading-none" style={{ color: MASTILO }}>
                {tacnih}
              </span>
              <span className="text-[18px] font-bold" style={{ color: PRIGUSEN }}>
                od
              </span>
              <span className="text-[40px] font-bold leading-none" style={{ color: MASTILO }}>
                {pitanja.length}
              </span>
            </span>
          </p>
        </div>
        <Izlaz naKlik={onIzlaz} natpis="Nazad na lekciju" />
      </Okvir>
    );
  }

  // ── Partija ───────────────────────────────────────────────────────────────

  const zakljucano = odziv !== null;
  const presao = indeks + (zakljucano ? 1 : 0);
  const popunjeno = Math.round((indeks / pitanja.length) * 100);

  return (
    <Okvir>
      {/* Potrošene pomoći i savet profesorke stižu i do čitača ekrana. */}
      <p aria-live="polite" className="sr-only">
        {najava}
      </p>

      <div className="flex items-baseline justify-between gap-3">
        <p
          className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          Provera celine
        </p>
        <p className="font-heading text-[15px] font-bold tabular-nums" style={{ color: PRIGUSEN }}>
          <span className="sr-only">{`Pitanje ${indeks + 1} od ${pitanja.length}, prešao si ${presao}`}</span>
          <span aria-hidden="true">{`${indeks + 1} / ${pitanja.length}`}</span>
        </p>
      </div>

      <p className="mt-2">
        <span
          aria-hidden="true"
          className="block h-2.5 w-full overflow-hidden rounded-full"
          style={{ background: "#E7E1D1" }}
        >
          <span
            className="block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${popunjeno}%`, background: MASTILO }}
          />
        </span>
      </p>

      {/* Traka odziva stoji uvek, i kad je prazna, da se ekran ne pomeri kad se
          poruka pojavi - dete bi promašilo dugme koje je skočilo. */}
      <p
        aria-live="assertive"
        className="font-heading mt-3 flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 text-center text-[18px] font-bold leading-snug [overflow-wrap:anywhere]"
        style={{
          background: odziv ? (odziv.tacno ? "#E4F0E9" : "#FBE7E5") : "transparent",
          color: odziv ? (odziv.tacno ? ZELENA : MASTILO) : "transparent",
        }}
      >
        {odziv ? odziv.tekst : ""}
      </p>

      <div
        className="mt-2 rounded-2xl border px-5 py-5 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <p
          className="font-heading text-[21px] font-bold leading-snug tracking-tight [overflow-wrap:anywhere]"
          style={{ color: MASTILO }}
        >
          {pitanje.pitanje}
        </p>
      </div>

      <ul className="mt-3 space-y-2.5">
        {pitanje.opcije.map((opcija, i) => {
          // „Pola-pola" ne izbacuje dugmad nego ih gasi. Mesto ostaje isto, pa
          // se ostali odgovori ne pomeraju pod prstom.
          const sklonjeno = vidljiva !== null && !vidljiva.includes(i);
          const pokazi = zakljucano && i === pitanje.tacan;
          const promasaj = zakljucano && i === izabrano && i !== pitanje.tacan;
          return (
            <li key={`${pitanje.id}-${i}`} className={sklonjeno ? "invisible" : undefined}>
              <button
                type="button"
                onClick={() => naOdgovor(i)}
                disabled={zakljucano || sklonjeno}
                aria-hidden={sklonjeno}
                tabIndex={sklonjeno ? -1 : undefined}
                lang="de"
                className={`${DUGME} font-heading block min-h-[56px] w-full border-2 px-4 py-3 text-left text-[18px] font-bold leading-snug [overflow-wrap:anywhere] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                style={{
                  background: pokazi ? "#E4F0E9" : promasaj ? "#FBE7E5" : PAPIR,
                  borderColor: pokazi ? ZELENA : promasaj ? "#E5342A" : IVICA,
                  color: MASTILO,
                }}
              >
                {opcija}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Savet profesorke: pravilo, nikad odgovor. Stoji dok traje pitanje. */}
      {savet && (
        <p
          className="mt-3 rounded-xl border border-l-4 px-4 py-3 text-[15px] leading-relaxed"
          style={{
            background: PAPIR,
            borderColor: IVICA,
            borderLeftColor: PLAVA,
            color: PRIGUSEN,
          }}
        >
          {savet}
        </p>
      )}

      {/* ── Tri pomoći ────────────────────────────────────────────────────
          Svaka po jednom u partiji. Potrošena ostaje na ekranu, ugašena i
          precrtana, jer dete mora da vidi šta je potrošilo. */}
      <ul className="mt-4 grid grid-cols-3 gap-2">
        <li>
          <DugmePomoci
            natpis="Pola-pola"
            potroseno={potroseno.pola}
            zakljucano={zakljucano}
            naKlik={naPolaPola}
          />
        </li>
        <li>
          <DugmePomoci
            natpis="Pitaj profesorku"
            potroseno={potroseno.profesorka}
            zakljucano={zakljucano}
            naKlik={naProfesorku}
          />
        </li>
        <li>
          <DugmePomoci
            natpis="Zameni pitanje"
            potroseno={potroseno.zamena}
            zakljucano={zakljucano}
            naKlik={naZamenu}
          />
        </li>
      </ul>

      <Izlaz naKlik={onIzlaz} natpis="Dosta za sad" />
    </Okvir>
  );
}

// ── Delovi ──────────────────────────────────────────────────────────────────

function Okvir({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: PODLOGA }}>
      <h1
        className="font-heading text-[19px] font-bold leading-tight tracking-tight"
        style={{ color: MASTILO }}
      >
        Milioner
      </h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * Jedan red uvodnog spiska: naziv gramatičke tačke, i ništa više dok dete samo
 * ne zatraži. Tap na naziv otvori objašnjenje i primer, ponovni tap ih sklopi.
 *
 * Zatvoreno je podrazumevano stanje i to nije ušteda na prikazu nego cela
 * poenta ekrana: kad su sva objašnjenja razmotana, „Kreni" padne ispod ivice
 * ekrana i dete do njega skroluje ne čitajući. Isti tekst živi i u pomoći
 * „pitaj profesorku", gde ga dete pročita jer mu baš tad treba.
 *
 * Otvaranje radi i tastaturom, jer je naziv obično dugme, i nosi
 * `aria-expanded`, pa čitač ekrana zna da iza naziva ima još teksta. Dugme
 * stoji u `h2`, da spisak i dalje bude naslovna struktura kroz koju čitač
 * ekrana ume da skače, kao što je bio i pre nego što se sklopio.
 */
function TackaUPodsetniku({ tacka }: { tacka: GramatickaTacka }) {
  const [otvoreno, setOtvoreno] = useState(false);
  const idTela = `podsetnik-telo-${tacka.id}`;

  return (
    <div
      className="rounded-xl border border-l-4"
      style={{ background: PAPIR, borderColor: IVICA, borderLeftColor: PLAVA }}
    >
      <h2>
        <button
          type="button"
          onClick={() => setOtvoreno((o) => !o)}
          aria-expanded={otvoreno}
          aria-controls={idTela}
          className={`${FOKUS} font-heading flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-[16px] font-bold leading-snug`}
          style={{ color: MASTILO }}
        >
          <span>{tacka.naziv}</span>
          <Strelica otvoreno={otvoreno} />
        </button>
      </h2>

      {/* `hidden` umesto uklanjanja iz stabla: `aria-controls` gore mora da
          pokazuje na nešto što stvarno postoji i kad je sklopljeno. */}
      <div id={idTela} hidden={!otvoreno} className="px-4 pb-3.5">
        <p className="text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
          {tacka.objasnjenje}
        </p>
        {tacka.primer && (
          <p
            lang="de"
            className="font-heading mt-2 text-[15px] font-bold leading-snug"
            style={{ color: PLAVA }}
          >
            {tacka.primer}
          </p>
        )}
      </div>
    </div>
  );
}

/** Znak da naziv ima šta da otvori. Okretanje staje uz `prefers-reduced-motion`. */
function Strelica({ otvoreno }: { otvoreno: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`h-5 w-5 flex-none motion-safe:transition-transform motion-safe:duration-150 ${
        otvoreno ? "rotate-180" : ""
      }`}
      fill="none"
      stroke={PLAVA}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  );
}

function DugmePomoci({
  natpis,
  potroseno,
  zakljucano,
  naKlik,
}: {
  natpis: string;
  potroseno: boolean;
  zakljucano: boolean;
  naKlik: () => void;
}) {
  return (
    <button
      type="button"
      onClick={naKlik}
      disabled={potroseno || zakljucano}
      className={`${DUGME} font-heading flex min-h-[54px] w-full items-center justify-center border-2 px-1.5 py-2 text-center text-[13px] font-bold leading-tight [overflow-wrap:anywhere] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.97]`}
      style={{
        background: potroseno ? "transparent" : PAPIR,
        borderColor: IVICA,
        color: potroseno ? PRIGUSEN : MASTILO,
        opacity: potroseno ? 0.55 : 1,
        textDecoration: potroseno ? "line-through" : "none",
      }}
    >
      <span className="sr-only">{potroseno ? `${natpis}, potrošeno` : natpis}</span>
      <span aria-hidden="true">{natpis}</span>
    </button>
  );
}

function Izlaz({ naKlik, natpis }: { naKlik: () => void; natpis: string }) {
  return (
    <button
      type="button"
      onClick={naKlik}
      className={`${DUGME} font-heading mt-4 block min-h-[52px] w-full border-2 text-[17px] font-bold`}
      style={{ background: "transparent", borderColor: IVICA, color: PRIGUSEN }}
    >
      {natpis}
    </button>
  );
}

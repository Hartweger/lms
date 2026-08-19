"use client";

// Milioner: provera celine, ne igra za sličice.
//
// ZAŠTO OVAJ EKRAN JEDINI NIJE PAPIR
// ----------------------------------
// Ceo zack! je namerno papirnog izgleda, jer je album sa sličicama glavna slika
// proizvoda. Milioner je jedini ekran koji nije igra za sličice nego provera
// celine, i jedini format koji dete prepoznaje sa televizije. Zato je ovde
// studio: duboko plava podloga sa sjajem u sredini, šestougaone trake, zlatna
// slova i lestvica napretka.
//
// IZUZETAK JE ZAKLJUČAN NA OVAJ JEDAN EKRAN. Ništa van ovog fajla ne sme da
// potamni. Staza, lekcija, album i ostale igre ostaju papir. Zato ovde nema
// nijedne globalne klase ni promene teme: tamno živi u `fixed` sloju koji
// postoji samo dok je Milioner na ekranu i nestane sa njim.
//
// ŠTA OVDE NAMERNO NEMA
// ---------------------
// Nema srca, nema kesice, nema sličica i nema rekorda. Jedino što Milioner
// upisuje je memorija grešaka (`/api/zack/*/greska`, pošalji-i-zaboravi), i to
// nije rezultat: promašeno pitanje se nigde ne pokazuje, samo dobija prednost
// u sledećoj partiji. Razlog za sve ostalo je što provera znanja i skupljanje
// ne smeju da se pomešaju: dete koje na proveri gubi sličice prestane da bira
// odgovor koji misli da je tačan i počne da bira odgovor koji je siguran.
// Zato ovde nema šta da se izgubi, pa nema ni straha.
//
// I NEMA OCENE. Na kraju stoji samo koliko je tačnih od ukupno. Bez procenata,
// bez „odlično" i bez „probaj ponovo, biće bolje". Slab rezultat se ne
// komentariše nijednom rečju - to je pravilo, a ne ukras.
//
// NETAČAN ODGOVOR SE NE KAŽNJAVA IZGLEDOM. Promašaj dobije prigušeno crveno i
// ništa više: nema drmanja, nema blicanja, nema zvuka. To je informacija, a ne
// kazna, i tako mora i da izgleda.
//
// TELEFON JE USLOV, NE DODATAK
// ----------------------------
// Ekran je `fixed inset-0`, dakle tačno jedan vidokrug, i stranica se nikad ne
// skroluje. Ono što ne stane skroluje UNUTAR svog dela (spisak tačaka u uvodu,
// telo objašnjenja u pomoći), pa „Kreni" i odgovori nikad ne padnu ispod ivice.
//
// Odgovori idu jedan ispod drugog, preko cele širine. Nikad dva po dva: naši
// odgovori su cele rečenice („Es regnet, deshalb bleibe ich zu Hause."), pa u
// pola širine telefona prelome se u četiri reda i preklope se međusobno.
//
// Lestvica od petnaest stepenica uspravno pored ne staje na 375px, jer bi
// pojela širinu koja odgovorima treba za drugi red. Zato leži vodoravno, ali
// ostaje lestvica: pređene stepenice su prigušene, tekuća je zlatna i viša,
// buduće su tamne, a svaka peta je viša kao međustanica.
//
// UVODNI EKRAN NOSI SAMO NAZIVE
// -----------------------------
// Prvi ekran je spisak naziva gramatičkih tačaka koje ulaze u partiju, i ništa
// više. Tap na naziv otvori objašnjenje i primer, ponovni tap ih sklopi.
// Razmotana objašnjenja bi gurnula „Kreni" ispod ivice ekrana, pa dete koje je
// došlo da igra palcem stigne do dna za dve sekunde i ne pročita ništa.
//
// Spisak zna da bude dugačak: u partiju ume da uđe i petnaest tačaka. Zato on
// skroluje unutar sebe, dok „Kreni" stoji zakucan na dnu vidokruga.
//
// Ništa se time ne gubi. Isti tekst stiže i kao pomoć „pitaj profesorku", u
// trenutku kad dete ne zna odgovor, dakle onda kad ga stvarno čita. To je i ceo
// smisao te pomoći: ne pokazuje odgovor nego pravilo po kom se do njega dolazi.
//
// GDE ŽIVI PRAVILO O OBRAĐENOM GRADIVU
// ------------------------------------
// Ruta vraća samo dozvoljeno gradivo, a `sastaviPartiju` isti uslov proverava
// još jednom, ovde na strani deteta. Nijedno od ta dva mesta se ne oslanja na
// ono drugo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Isticanje from "@/components/zack/Isticanje";
import {
  polaPola,
  sastaviPartiju,
  zameniPitanje,
  type GramatickaTacka,
  type GramatickoPitanje,
  type PitanjePartije,
} from "@/lib/zack/milioner";

// ── Studio ──────────────────────────────────────────────────────────────────
//
// Svi odnosi su izmereni, ne procenjeni (WCAG 2.1, relativna osvetljenost):
//   bela na najsvetlijem delu podloge (SJAJ)   13.96:1
//   bela na najtamnijem delu podloge (NOC)     18.48:1
//   zlatna na SJAJ                              6.47:1
//   zlatna na NOC                               8.57:1
//   bela na PANEL (odgovor, pitanje)           14.35:1
//   zlatna na PANEL                             6.65:1
//   PRIGUSENA na SJAJ                           7.43:1
//   TAMNO na ZLATNA (izabran odgovor)           8.13:1
//   TAMNO na ZELENA (tačan odgovor)             5.11:1
//   bela na CRVENA (promašaj)                   8.11:1
// Bela na zelenoj daje samo 3.43:1, zato tačan odgovor nosi tamna slova, a ne
// bela. Isto važi i za zlatnu podlogu. Ovo je aplikacija za decu i tu se ne
// pogađa napamet.
const NOC = "#08122E";
const SJAJ = "#0E2A5C";
const PANEL = "#12275A";
const IVICA = "#5B8FE3";
const IVICA_MRTVA = "#2B4A8A";
const ZLATNA = "#E8A33D";
const ZELENA = "#2E9E4F";
const CRVENA = "#8E2F2A";
const BELA = "#FFFFFF";
const PRIGUSENA = "#A9BEE4";
const TAMNO = "#0A1836";

const PODLOGA = `radial-gradient(115% 78% at 50% 34%, ${SJAJ} 0%, ${NOC} 72%)`;

/** Šestougao sa televizije: ravan gore i dole, zašiljen levo i desno. */
const HEX = "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)";
/** Isti oblik, sitniji šiljak - za stepenice lestvice. */
const HEX_SITNO = "polygon(4px 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 4px 100%, 0 50%)";

/** Koliko izabran odgovor stoji zlatan pre nego što se otkrije. To je onaj tajac. */
const ZAKLJUCAJ = 600;
/** Koliko otkriven odgovor stoji na ekranu. Greška duže, jer se uz nju čita i tačan odgovor. */
const ZADRZI_TACNO = 850;
const ZADRZI_GRESKU = 1900;

/**
 * Vidljiv fokus. Bela, jer se na tamnoplavoj podlozi tamna kontura izgubi, a
 * bela se vidi i na zlatnoj i na zelenoj traci (odnos preko 3:1).
 */
const FOKUS =
  "outline-offset-2 focus-visible:outline-[3px] focus-visible:outline-white disabled:cursor-default";

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

type Gradivo = {
  brojLekcije: number;
  tacke: GramatickaTacka[];
  pitanja: GramatickoPitanje[];
  /** Ranije promašena pitanja (ključ → koliko puta). Prednost pri izboru. */
  greske: Map<string, number>;
};

function citajGradivo(telo: unknown): Gradivo | null {
  if (typeof telo !== "object" || telo === null) return null;
  const o = telo as Record<string, unknown>;
  if (typeof o.brojLekcije !== "number") return null;

  // Greške su samo prednost pri izboru, pa pokvaren red ovde ne obara ništa:
  // takav se preskoči i partija se sastavi kao da grešaka nema.
  const greske = new Map<string, number>();
  if (typeof o.greske === "object" && o.greske !== null && !Array.isArray(o.greske)) {
    for (const [kljuc, vrednost] of Object.entries(o.greske)) {
      if (typeof vrednost === "number" && Number.isFinite(vrednost) && vrednost > 0) {
        greske.set(kljuc, vrednost);
      }
    }
  }

  return {
    brojLekcije: o.brojLekcije,
    tacke: (Array.isArray(o.tacke) ? o.tacke : []).filter(jeTacka),
    pitanja: (Array.isArray(o.pitanja) ? o.pitanja : []).filter(jePitanje),
    greske,
  };
}

const SLOVA = ["A", "B", "C", "D", "E", "F"];

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

  // Potrošene pomoći. Ostaju na ekranu i kad su potrošene, samo ugašene i
  // precrtane: krug koji nestane dete traži i misli da je nešto pokvarilo.
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

  /** Fokus se posle zatvaranja objašnjenja vraća na krug iz kog je otvoreno. */
  const krugProfesorke = useRef<HTMLButtonElement | null>(null);

  // Spisak tačaka u uvodu ume da bude duži od ekrana (u partiju ulazi i po
  // petnaest tačaka), pa skroluje unutar sebe. Da li ispod ima još, NE pogađa se
  // po broju tačaka - nazivi su različite dužine, pa se meri.
  const spisak = useRef<HTMLUListElement | null>(null);
  const [imaJos, setImaJos] = useState(false);
  useEffect(() => {
    const element = spisak.current;
    if (element === null) return;
    const meri = () => setImaJos(element.scrollTop + element.clientHeight < element.scrollHeight - 1);
    meri();
    element.addEventListener("scroll", meri);
    window.addEventListener("resize", meri);
    return () => {
      element.removeEventListener("scroll", meri);
      window.removeEventListener("resize", meri);
    };
  }, [tacke]);

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
          Math.random,
          gradivo.greske
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

  // Telo je zaključano od trenutka tapa, a ne od trenutka otkrivanja: između to
  // dvoje stoji tajac u kom odgovor svetli zlatno, i tu ne sme da upadne drugi
  // tap ni potrošena pomoć.
  const zakljucano = izabrano !== null;
  const otkriveno = odziv !== null;

  /**
   * Promašeno pitanje se beleži u pozadini, pošalji-i-zaboravi: poziv se ne
   * čeka i njegov pad se namerno guta, jer partija ne sme da zavisi od mreže.
   * Sledeća partija promašenom pitanju daje prednost - i to je sve; detetu se
   * ovo nigde ne pokazuje.
   */
  const posaljiGresku = useCallback(
    (pitanjeId: string) => {
      void fetch(`/api/zack/${childId}/greska`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitanjeIdovi: [pitanjeId] }),
        // Dete ume da zatvori karticu čim vidi da je promašilo.
        keepalive: true,
      }).catch(() => {
        /* Partija se ne prekida zbog mreže. */
      });
    },
    [childId]
  );

  const naOdgovor = useCallback(
    (i: number) => {
      if (!pitanje || izabrano !== null) return;

      const tacno = i === pitanje.tacan;
      if (tacno) setTacnih((t) => t + 1);
      else posaljiGresku(pitanje.id);
      // Prvo samo zlatno, kao kad se odgovor zaključa u emisiji. Boja ishoda
      // dolazi tek posle tajca.
      setIzabrano(i);

      tajmer.current = setTimeout(() => {
        // Greška ne prekida partiju i ne nosi ime brenda: neutralno „Ups!" i
        // ODMAH tačan odgovor, pa se ide dalje. Bez prekora i bez drugog
        // pokušaja.
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
      }, ZAKLJUCAJ);
    },
    [izabrano, pitanje, posaljiGresku]
  );

  const naPolaPola = useCallback(() => {
    if (!pitanje || zakljucano || potroseno.pola) return;
    setVidljiva(polaPola(pitanje, Math.random));
    setPotroseno((p) => ({ ...p, pola: true }));
    setNajava("Pola-pola: ostala su dva odgovora.");
  }, [pitanje, potroseno.pola, zakljucano]);

  const naProfesorku = useCallback(() => {
    if (!pitanje || zakljucano || potroseno.profesorka) return;
    // Objašnjenje tačke iz koje je BAŠ OVO pitanje. To je cela pomoć: pravilo,
    // nikad odgovor.
    setSavet(objasnjenje?.objasnjenje ?? "Podsetnik za ovo pitanje nije pri ruci.");
    setPotroseno((p) => ({ ...p, profesorka: true }));
    setNajava("Profesorka je otvorila objašnjenje.");
  }, [objasnjenje, pitanje, potroseno.profesorka, zakljucano]);

  const zatvoriSavet = useCallback(() => {
    setSavet(null);
    krugProfesorke.current?.focus();
  }, []);

  const naZamenu = useCallback(() => {
    if (!pitanje || zakljucano || potroseno.zamena) return;

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
  }, [indeks, pitanje, pitanja, potroseno.zamena, rezerva, zakljucano]);

  // ── Ekrani koji nisu partija ──────────────────────────────────────────────

  if (faza === "ucitavam") {
    return (
      <Studio>
        <p className="flex flex-1 items-center justify-center text-[17px]" style={{ color: PRIGUSENA }}>
          Samo trenutak...
        </p>
      </Studio>
    );
  }

  if (faza === "greska" || faza === "prazno") {
    return (
      <Studio>
        <div className="flex flex-1 items-center justify-center">
          <p
            className="rounded-2xl border px-5 py-4 text-center text-[16px] leading-relaxed"
            style={{ background: PANEL, borderColor: IVICA, color: BELA }}
          >
            {faza === "greska"
              ? "Pitanja sad nisu stigla. Ništa nije izgubljeno, probaj malo kasnije."
              : "Za ovu lekciju još nema pitanja iz gramatike. Vrati se malo kasnije."}
          </p>
        </div>
        <Izlaz naKlik={onIzlaz} natpis="Nazad na lekciju" />
      </Studio>
    );
  }

  // ── Podsetnik pre partije ─────────────────────────────────────────────────
  if (faza === "podsetnik") {
    return (
      <Studio>
        {/* Uvod je namerno kratak: svaki red teksta ovde jede visinu spiska. */}
        <p className="mt-1 text-[14px] leading-snug" style={{ color: PRIGUSENA }}>
          Nema srca i nema sličica, samo gradivo sa časa. Tapni naziv ako hoćeš da obnoviš.
        </p>

        {/* Spisak zna da bude dugačak, pa skroluje UNUTAR sebe. Stranica ne
            skroluje nikad, a „Kreni" ostaje zakucan na dnu vidokruga. */}
        <div className="relative mt-2 flex min-h-0 flex-1 flex-col justify-center">
          {/* `max-h-full` drži spisak unutar okvira, pa ga `justify-center`
              centrira kad je kratak, a nikad ga ne pomeri kad je dug: tada je
              tačno visok koliko i okvir i skroluje unutar sebe. */}
          <ul
            ref={spisak}
            className="max-h-full w-full space-y-1.5 overflow-y-auto overscroll-contain pr-0.5"
          >
            {tacke.map((t) => (
              <li key={t.id}>
                <TackaUPodsetniku tacka={t} />
              </li>
            ))}
          </ul>
          {/* Znak da spisak ide dalje nadole, i to samo kad stvarno ide. Čist
              ukras, van stabla za čitač ekrana. */}
          {imaJos && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 block h-7"
              style={{ background: `linear-gradient(to top, ${NOC}, transparent)` }}
            />
          )}
        </div>

        <p className="mt-1 text-center text-[14px] leading-snug" style={{ color: PRIGUSENA }}>
          {`Pitanja: ${pitanja.length}. Imaš i tri pomoći.`}
        </p>

        <button
          type="button"
          onClick={() => setFaza("pitanja")}
          className={`${FOKUS} font-heading mt-2 block w-full text-[20px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
        >
          <Sestougao ivica={ZLATNA} ispuna={ZLATNA} visina="min-h-[58px]">
            <span className="w-full text-center tracking-wide" style={{ color: TAMNO }}>
              Kreni
            </span>
          </Sestougao>
        </button>
        <Izlaz naKlik={onIzlaz} natpis="Ipak ne sad" />
      </Studio>
    );
  }

  // ── Kraj ──────────────────────────────────────────────────────────────────
  //
  // Samo broj. Bez procenta, bez ocene, bez ijedne reči o tome da li je to malo
  // ili mnogo. Dete koje je odgovorilo tri od petnaest to već zna, i ne treba mu
  // rečenica koja to potvrđuje.
  if (!pitanje) {
    return (
      <Studio>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <p
              className="font-heading text-center text-[12px] font-bold uppercase tracking-[.22em]"
              style={{ color: ZLATNA }}
            >
              Kraj provere
            </p>
            <div className="mt-3">
              <Sestougao ivica={IVICA} ispuna={PANEL} visina="min-h-[104px]">
                <p className="w-full text-center" aria-live="polite">
                  <span className="sr-only">{`Tačnih odgovora: ${tacnih} od ${pitanja.length}`}</span>
                  <span
                    aria-hidden="true"
                    className="font-heading flex flex-wrap items-baseline justify-center gap-x-2.5 tabular-nums"
                  >
                    <span className="text-[46px] font-bold leading-none" style={{ color: ZLATNA }}>
                      {tacnih}
                    </span>
                    <span className="text-[18px] font-bold" style={{ color: PRIGUSENA }}>
                      od
                    </span>
                    <span className="text-[46px] font-bold leading-none" style={{ color: BELA }}>
                      {pitanja.length}
                    </span>
                  </span>
                </p>
              </Sestougao>
            </div>
          </div>
        </div>
        <Izlaz naKlik={onIzlaz} natpis="Nazad na lekciju" />
      </Studio>
    );
  }

  // ── Partija ───────────────────────────────────────────────────────────────

  return (
    <Studio>
      {/* Potrošene pomoći i zamenjeno pitanje stižu i do čitača ekrana. */}
      <p aria-live="polite" className="sr-only">
        {najava}
      </p>

      <Lestvica indeks={indeks} ukupno={pitanja.length} />

      <Pomoci
        potroseno={potroseno}
        zakljucano={zakljucano}
        naPola={naPolaPola}
        naProfesorku={naProfesorku}
        naZamenu={naZamenu}
        nosacProfesorke={krugProfesorke}
      />

      {/* Tabla (odziv, pitanje, odgovori) stoji pri dnu, kao u emisiji, a prazan
          prostor ide iznad nje. `mt-auto` je taj potisak. Kad tabla na niskom
          telefonu ne stane, ona se skuplja i skroluje unutar sebe, pa „Dosta za
          sad" i lestvica gore ostaju na svom mestu. */}
      <div className="mt-auto min-h-0 overflow-y-auto overscroll-contain">
      {/* Traka odziva stoji uvek, i kad je prazna, da se ekran ne pomeri kad se
          poruka pojavi - dete bi promašilo dugme koje je skočilo. */}
      <p
        aria-live="assertive"
        className="font-heading mt-2 flex min-h-[2.5rem] items-center justify-center rounded-lg px-3 text-center text-[17px] font-bold leading-snug [overflow-wrap:anywhere]"
        style={{
          background: odziv ? (odziv.tacno ? ZELENA : CRVENA) : "transparent",
          color: odziv ? (odziv.tacno ? TAMNO : BELA) : "transparent",
        }}
        lang={odziv && !odziv.tacno ? "de" : undefined}
      >
        {odziv ? odziv.tekst : ""}
      </p>

      <div className="mt-2">
        <Sestougao ivica={IVICA} ispuna={PANEL} visina="min-h-[82px]">
          <p
            className="font-heading w-full text-center text-[17px] font-bold leading-snug tracking-tight [overflow-wrap:anywhere]"
            style={{ color: BELA }}
          >
            {pitanje.pitanje}
          </p>
        </Sestougao>
      </div>

      {/* Odgovori idu JEDAN ISPOD DRUGOG, preko cele širine. Nikad dva po dva:
          naši odgovori su cele nemačke rečenice i u pola širine se preklope. */}
      <ul className="mt-2 flex flex-col gap-2">
        {pitanje.opcije.map((opcija, i) => {
          // „Pola-pola" ne izbacuje dugmad nego ih gasi. Mesto ostaje isto, pa
          // se ostali odgovori ne pomeraju pod prstom.
          const sklonjeno = vidljiva !== null && !vidljiva.includes(i);
          const cekaOtkrivanje = !otkriveno && i === izabrano;
          const pokazi = otkriveno && i === pitanje.tacan;
          const promasaj = otkriveno && i === izabrano && i !== pitanje.tacan;

          const ispuna = cekaOtkrivanje ? ZLATNA : pokazi ? ZELENA : promasaj ? CRVENA : PANEL;
          const ivica = cekaOtkrivanje ? ZLATNA : pokazi ? ZELENA : promasaj ? CRVENA : IVICA;
          const slovo = cekaOtkrivanje || pokazi ? TAMNO : promasaj ? BELA : ZLATNA;
          const tekst = cekaOtkrivanje || pokazi ? TAMNO : BELA;

          return (
            <li key={`${pitanje.id}-${i}`} className={sklonjeno ? "invisible" : undefined}>
              <button
                type="button"
                onClick={() => naOdgovor(i)}
                disabled={zakljucano || sklonjeno}
                aria-hidden={sklonjeno || undefined}
                tabIndex={sklonjeno ? -1 : undefined}
                className={`${FOKUS} block w-full motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
              >
                <Sestougao ivica={ivica} ispuna={ispuna} visina="min-h-[58px]">
                  <span
                    className="font-heading w-6 flex-none text-left text-[17px] font-bold tabular-nums"
                    style={{ color: slovo }}
                    aria-hidden="true"
                  >
                    {SLOVA[i] ?? ""}
                  </span>
                  <span
                    lang="de"
                    className="font-heading flex-1 text-left text-[16px] font-bold leading-snug [overflow-wrap:anywhere]"
                    style={{ color: tekst }}
                  >
                    {opcija}
                  </span>
                </Sestougao>
              </button>
            </li>
          );
        })}
      </ul>
      </div>

      <Izlaz naKlik={onIzlaz} natpis="Dosta za sad" />

      {/* Savet profesorke: pravilo, nikad odgovor. Objašnjenja umeju da budu i
          po tri stotine slova, pa stoje u sloju koji sme da skroluje, umesto da
          guraju odgovore ispod ivice ekrana. */}
      {savet !== null && (
        <SavetProfesorke tekst={savet} primer={objasnjenje?.primer ?? null} naZatvori={zatvoriSavet} />
      )}
    </Studio>
  );
}

// ── Delovi ──────────────────────────────────────────────────────────────────

/**
 * Studio: tačno jedan vidokrug, nikad više. `fixed inset-0` znači da stranica
 * ispod ostaje netaknuta i da se nikad ne skroluje, pa `document.body` ostaje
 * visok tačno koliko i prozor.
 *
 * Tamno počinje i završava se OVDE. Nema nijedne globalne klase, nijedne
 * promene teme i nijednog stila koji bi procurio na papirni deo aplikacije.
 */
function Studio({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col px-3 pb-2 pt-2"
      style={{ background: PODLOGA }}
    >
      <h1
        className="font-heading flex-none text-center text-[15px] font-bold uppercase leading-none tracking-[.34em]"
        style={{ color: ZLATNA }}
      >
        Milioner
      </h1>
      {children}
    </div>
  );
}

/**
 * Lestvica pitanja. Na televiziji stoji uspravno pored table, ali petnaest
 * stepenica uspravno ne staje na telefon od 375px, a i da staje, pojela bi
 * širinu koju odgovorima treba za drugi red teksta. Zato leži vodoravno.
 *
 * Ostaje lestvica, ne broj: pređene stepenice su prigušene, tekuća je zlatna i
 * najviša, buduće su tamne, a svaka peta je viša kao međustanica u emisiji.
 * Tačan broj ide čitaču ekrana, jer se iz oblika ne čita precizno.
 */
function Lestvica({ indeks, ukupno }: { indeks: number; ukupno: number }) {
  return (
    <div className="mt-2 flex-none">
      <p className="sr-only" aria-live="off">
        {`Pitanje ${indeks + 1} od ${ukupno}`}
      </p>
      <div aria-hidden="true" className="flex h-[32px] items-center gap-[3px]">
        {Array.from({ length: ukupno }, (_, i) => {
          const presao = i < indeks;
          const tekuca = i === indeks;
          // Svaka peta stepenica je viša, kao međustanica u emisiji. Bez toga se
          // petnaest jednakih crtica slije u jednu traku i prestane da bude
          // lestvica.
          const medjustanica = (i + 1) % 5 === 0;
          const visina = tekuca ? 32 : medjustanica ? 24 : 16;
          return (
            <span
              key={i}
              className="block flex-1 motion-safe:transition-all motion-safe:duration-200"
              style={{
                height: `${visina}px`,
                clipPath: HEX_SITNO,
                // Pređene su prigušeno zlatne (već ispenjano), tekuća puna
                // zlatna, buduće plave. Buduće moraju da se vide: kad su boje
                // podloge, lestvice nema, ostane samo jedna zlatna mrlja.
                background: tekuca ? ZLATNA : presao ? ZLATNA : IVICA_MRTVA,
                opacity: presao ? 0.42 : 1,
              }}
            />
          );
        })}
      </div>
      <p
        className="font-heading mt-1 text-center text-[13px] font-bold tabular-nums leading-none"
        style={{ color: ZLATNA }}
        aria-hidden="true"
      >
        {`${indeks + 1} / ${ukupno}`}
      </p>
    </div>
  );
}

/**
 * Tri pomoći kao krugovi pri vrhu, kao u emisiji. Potrošena ostaje na ekranu,
 * prigušena i precrtana zlatnom crtom, jer dete mora da vidi šta je potrošilo.
 *
 * Potrošen krug NIJE `disabled` nego `aria-disabled`. Razlog je pristupačnost:
 * pravo `disabled` dugme ispada iz reda za tastaturu, pa dete koje ide tabom
 * uopšte ne sazna da je ta pomoć postojala i da je potrošena.
 */
function Pomoci({
  potroseno,
  zakljucano,
  naPola,
  naProfesorku,
  naZamenu,
  nosacProfesorke,
}: {
  potroseno: Record<Pomoc, boolean>;
  zakljucano: boolean;
  naPola: () => void;
  naProfesorku: () => void;
  naZamenu: () => void;
  nosacProfesorke: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <ul className="mt-1.5 flex flex-none items-start justify-center gap-6">
      <li>
        <KrugPomoci
          natpis="Pola-pola"
          opis="Ostaju dva odgovora"
          potroseno={potroseno.pola}
          zakljucano={zakljucano}
          naKlik={naPola}
        >
          <span className="font-heading text-[13px] font-bold tabular-nums">50:50</span>
        </KrugPomoci>
      </li>
      <li>
        <KrugPomoci
          natpis="Pitaj profesorku"
          opis="Otvara objašnjenje pravila"
          potroseno={potroseno.profesorka}
          zakljucano={zakljucano}
          naKlik={naProfesorku}
          nosac={nosacProfesorke}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
          </svg>
        </KrugPomoci>
      </li>
      <li>
        <KrugPomoci
          natpis="Zameni pitanje"
          opis="Stiže drugo pitanje"
          potroseno={potroseno.zamena}
          zakljucano={zakljucano}
          naKlik={naZamenu}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 9.5A8.5 8.5 0 0 1 18 6.4" />
            <path d="M18 3v4h-4" />
            <path d="M20.5 14.5A8.5 8.5 0 0 1 6 17.6" />
            <path d="M6 21v-4h4" />
          </svg>
        </KrugPomoci>
      </li>
    </ul>
  );
}

function KrugPomoci({
  natpis,
  opis,
  potroseno,
  zakljucano,
  naKlik,
  nosac,
  children,
}: {
  natpis: string;
  opis: string;
  potroseno: boolean;
  zakljucano: boolean;
  naKlik: () => void;
  nosac?: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  const ugaseno = potroseno || zakljucano;
  return (
    <button
      ref={nosac}
      type="button"
      onClick={naKlik}
      aria-disabled={ugaseno}
      className={`${FOKUS} flex w-[76px] flex-col items-center gap-1 rounded-xl py-0.5 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.94]`}
    >
      <span className="sr-only">{potroseno ? `${natpis}, potrošeno. ${opis}.` : `${natpis}. ${opis}.`}</span>
      <span
        aria-hidden="true"
        className="relative flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full border-2"
        style={{
          background: potroseno ? "transparent" : PANEL,
          borderColor: potroseno ? IVICA_MRTVA : ZLATNA,
          color: potroseno ? PRIGUSENA : ZLATNA,
          opacity: zakljucano && !potroseno ? 0.5 : 1,
        }}
      >
        {children}
        {potroseno && (
          <span
            className="absolute left-1 right-1 top-1/2 block h-[2px] -translate-y-1/2 rotate-[-38deg] rounded-full"
            style={{ background: ZLATNA }}
          />
        )}
      </span>
      <span
        aria-hidden="true"
        className="font-heading text-center text-[10px] font-bold leading-tight"
        style={{
          color: potroseno ? PRIGUSENA : BELA,
          textDecoration: potroseno ? "line-through" : "none",
        }}
      >
        {natpis}
      </span>
    </button>
  );
}

/**
 * Objašnjenje profesorke u sloju preko table.
 *
 * Zašto sloj, a ne red teksta ispod odgovora: objašnjenja iz baze umeju da budu
 * i po tri stotine slova, pa bi ispod odgovora gurnula pola table ispod ivice
 * telefona. Ovako tekst dobija svoje mesto, sme da skroluje unutar sebe, i
 * zatvara se kad ga dete pročita.
 *
 * Fokus ulazi na dugme za zatvaranje i vraća se na krug iz kog je otvoren, a
 * `Escape` zatvara, jer se sloj otvara i tastaturom.
 */
function SavetProfesorke({
  tekst,
  primer,
  naZatvori,
}: {
  tekst: string;
  primer: string | null;
  naZatvori: () => void;
}) {
  const zatvori = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    zatvori.current?.focus();
  }, []);

  useEffect(() => {
    const naTaster = (dogadjaj: KeyboardEvent) => {
      if (dogadjaj.key === "Escape") naZatvori();
    };
    document.addEventListener("keydown", naTaster);
    return () => document.removeEventListener("keydown", naTaster);
  }, [naZatvori]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4" style={{ background: "rgba(4, 9, 24, 0.78)" }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="milioner-savet-naslov"
        className="flex max-h-full w-full flex-col rounded-2xl border-2 p-4"
        style={{ background: PANEL, borderColor: ZLATNA }}
      >
        <p
          id="milioner-savet-naslov"
          className="font-heading flex-none text-[12px] font-bold uppercase tracking-[.2em]"
          style={{ color: ZLATNA }}
        >
          Profesorka kaže
        </p>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <p className="text-[15px] leading-relaxed" style={{ color: BELA }}>
            <Isticanje tekst={tekst} tema="tamna" />
          </p>
          {primer && (
            <p lang="de" className="font-heading mt-2 text-[15px] font-bold leading-snug" style={{ color: ZLATNA }}>
              <Isticanje tekst={primer} tema="tamna" />
            </p>
          )}
        </div>
        <button
          ref={zatvori}
          type="button"
          onClick={naZatvori}
          className={`${FOKUS} font-heading mt-3 block min-h-[48px] w-full flex-none rounded-xl border-2 text-[16px] font-bold`}
          style={{ borderColor: ZLATNA, color: ZLATNA }}
        >
          Razumem
        </button>
      </div>
    </div>
  );
}

/**
 * Šestougao sa televizije: ravan gore i dole, zašiljen levo i desno. Ivica je
 * spoljni oblik, ispuna unutrašnji, dva piksela uži sa svake strane.
 *
 * Oblik NE stoji na samom dugmetu nego unutar njega. Da stoji na dugmetu,
 * `clip-path` bi odsekao i konturu fokusa, pa dete koje ide tastaturom ne bi
 * videlo gde se nalazi.
 */
function Sestougao({
  ivica,
  ispuna,
  visina,
  children,
}: {
  ivica: string;
  ispuna: string;
  visina: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="block w-full p-[2px] motion-safe:transition-colors motion-safe:duration-200"
      style={{ background: ivica, clipPath: HEX }}
    >
      <span
        className={`flex w-full items-center gap-1 py-2 pl-6 pr-5 motion-safe:transition-colors motion-safe:duration-200 ${visina}`}
        style={{ background: ispuna, clipPath: HEX }}
      >
        {children}
      </span>
    </span>
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
 * ekrana ume da skače.
 */
function TackaUPodsetniku({ tacka }: { tacka: GramatickaTacka }) {
  const [otvoreno, setOtvoreno] = useState(false);
  const idTela = `podsetnik-telo-${tacka.id}`;

  return (
    <div
      className="rounded-lg border border-l-4"
      style={{ background: PANEL, borderColor: IVICA_MRTVA, borderLeftColor: ZLATNA }}
    >
      <h2>
        <button
          type="button"
          onClick={() => setOtvoreno((o) => !o)}
          aria-expanded={otvoreno}
          aria-controls={idTela}
          className={`${FOKUS} font-heading flex min-h-[46px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[14px] font-bold leading-snug`}
          style={{ color: BELA }}
        >
          <span>{tacka.naziv}</span>
          <Strelica otvoreno={otvoreno} />
        </button>
      </h2>

      {/* `hidden` umesto uklanjanja iz stabla: `aria-controls` gore mora da
          pokazuje na nešto što stvarno postoji i kad je sklopljeno. */}
      <div id={idTela} hidden={!otvoreno} className="px-3 pb-3">
        <p className="text-[14px] leading-relaxed" style={{ color: PRIGUSENA }}>
          <Isticanje tekst={tacka.objasnjenje} tema="tamna" />
        </p>
        {tacka.primer && (
          <p lang="de" className="font-heading mt-1.5 text-[14px] font-bold leading-snug" style={{ color: ZLATNA }}>
            <Isticanje tekst={tacka.primer} tema="tamna" />
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
      stroke={ZLATNA}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  );
}

function Izlaz({ naKlik, natpis }: { naKlik: () => void; natpis: string }) {
  return (
    <button
      type="button"
      onClick={naKlik}
      className={`${FOKUS} font-heading mt-2 block min-h-[46px] w-full flex-none rounded-xl border text-[15px] font-bold`}
      style={{ background: "transparent", borderColor: IVICA_MRTVA, color: PRIGUSENA }}
    >
      {natpis}
    </button>
  );
}

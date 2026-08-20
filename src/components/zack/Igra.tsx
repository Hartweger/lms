"use client";

// Ljuska igre i tela igara koja se hrane spiskom reči. Rečenične igre imaju
// svoja tela u `Recenice.tsx`, ali istu ovu ljusku: srca, traka napretka,
// odziv, izlaz i ponovno slanje su im zajednički, jer bi druga ljuska značila
// drugi brojač zarađenog.
//
// GLAS
// ----
// Ime brenda se javlja SAMO na uspehu: tačan odgovor kaže „Zack!". Greška nikad
// ne nosi ime, nego neutralno „Ups!" i ODMAH tačan odgovor. Nema „pokušaj
// ponovo", nema prekora, nema drugog pokušaja. Dete od 11 do 14 godina prekor
// pamti duže nego reč.
//
// GDE ŽIVI STANJE
// ---------------
// Srca, napredak i spisak tačnih vodi isključivo `lib/zack/sesija.ts`. Ovde se
// ne pravi nikakvo paralelno stanje za to, jer bi se dva brojača srca pre ili
// kasnije razišla. Lokalno stanje ovde je samo ono što sesija ne zna: šta je
// dete upravo kliknulo i šta trenutno piše u odzivu.
//
// NAPREDAK SE ŠALJE ODMAH, PA SE NA KRAJU ŠALJE JOŠ JEDNOM
// --------------------------------------------------------
// Posle SVAKOG tačnog odgovora ide poziv ka /api/zack/<childId>/zaradi. Ne na
// kraju igre. Dete koje zatvori karticu nasred igre ne sme ništa da izgubi.
// Taj poziv ide u pozadini i njegov pad ne ruši igru.
//
// Ali poziv u pozadini sme da padne u tišini, pa on sam NIJE dokaz da je reč
// stigla. Zato se ceo spisak tačnih na kraju partije predaje roditelju kroz
// `onKraj`, koji ga šalje ponovo i ovog puta ČEKA odgovor. Ruta je idempotentna,
// pa ponovljeno slanje ne može ništa da pokvari ni da duplira.
//
// Iz istog razloga izlaz iz igre („Dosta za sad") stoji OVDE, a ne u ekranu
// lekcije: samo ovde se zna šta je dete do tog trenutka zaradilo. Izlaz koji
// ekran lekcije sam odradi ne bi imao šta da ponovo pošalje.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SPRATOVA_NAJVISE,
  type Igra as VrstaIgre,
  type IgraReci as VrstaIgreReci,
  type Pitanje,
} from "@/lib/zack/pitanja";
// Pitanja partije se prave kroz ponavljanje, ne direktno: uz reči ove lekcije
// se umeša i po koja STARA reč (izbledela ili ranije promašena), da se ono što
// bledi samo vrati pred dete. Prva lekcija nema starih i radi kao i uvek.
import { pitanjaSaStarima, type StaraRec } from "@/lib/zack/ponavljanje";
import { BOJA_MNOZINA, bojaZaRod, promesaj, type Rec, type Rod } from "@/lib/zack/rec";
// Rečenična pitanja se prave iz zapisa rečenice, a ne iz reči, pa imaju svoju
// fabriku. Sesija, srca i tok su im isti kao i svima ostalima.
import { recenicnaPitanja, type Recenica } from "@/lib/zack/recenice";
import { Dopuna, Slagalica } from "@/components/zack/Recenice";
// Skakač je drugo telo za isto pitanje o rodu, pa im je i pomoć oko članova
// zajednička. Živi u `Skakac.tsx` zato što ljuska već uvozi taj fajl, pa uvoz u
// suprotnom smeru ne bi bio put nego krug.
import Skakac, {
  bezClana,
  CLANOVI,
  jeClan,
  NATPIS_RODA,
  slovaNaRodu,
} from "@/components/zack/Skakac";
import {
  novaSesija,
  odgovori,
  oduzmiSrce,
  odustani,
  tacniRecIdovi,
  zabeleziTacne,
  SRCA,
  type Sesija,
} from "@/lib/zack/sesija";

export const NAZIVI: Record<VrstaIgre, string> = {
  "brzo-biranje": "Brzo biranje",
  rod: "Der, die ili das",
  skakac: "Der-Die-Das skakač",
  mnozina: "Množina",
  diktat: "Diktat",
  parovi: "Parovi",
  "ucenje-reci": "Nauči reči",
  "ucenje-recenica": "Nauči rečenice",
  slagalica: "Složi rečenicu",
  dopuna: "Dopuni rečenicu",
};

// Papir, ne gejmerski ekran.
const PODLOGA = "#F4F1E9";
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const ZELENA = "#1E7A4B";
const CRVENA = "#E5342A";

/** Koliko pitanja ima jedna partija. Parovi se unutar `napraviPitanja` sami sabiju na 6. */
const PITANJA_PO_PARTIJI = 8;

/**
 * Skakač je izuzetak: njegova partija se ne završava na broju reči nego kad se
 * potroše srca. Zato dobija tok pitanja koji se ponavlja (svaki krug u novom
 * rasporedu) do gornje granice penjanja, a ta granica postoji samo da tok ne
 * bude beskonačan. Bez ovoga bi svaka partija stala na broju imenica u lekciji,
 * pa bi rekord bio taj isti broj zauvek i ne bi imao šta da se obori.
 */
function kolikoPitanja(vrsta: VrstaIgreReci): number {
  return vrsta === "skakac" ? SPRATOVA_NAJVISE : PITANJA_PO_PARTIJI;
}

/** Igre koje se prave od REČENICA. Učenje rečenica je blaži prikaz slagalice. */
type VrstaIgreRecenica = "slagalica" | "dopuna" | "ucenje-recenica";

/**
 * Podela na dve fabrike pitanja, kao vrednost i kao tip. Predikat postoji da bi
 * druga grana bila SUŽENA na igre od reči: `kolikoPitanja` i `pitanjaSaStarima`
 * rečeničnu vrstu ne umeju da obrade, a `as` bi ovde bio nada, ne provera.
 */
function jeRecenicna(vrsta: VrstaIgre): vrsta is VrstaIgreRecenica {
  return vrsta === "slagalica" || vrsta === "dopuna" || vrsta === "ucenje-recenica";
}

/** Koliko odziv stoji na ekranu. Greška duže, jer se uz nju čita i tačan odgovor. */
const ZADRZI_TACNO = 850;
const ZADRZI_GRESKU = 1900;

type Odziv = { tacno: boolean; tekst: string };

/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const DUGME =
  "rounded-2xl outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default";

// ── Srca ────────────────────────────────────────────────────────────────────

function Srce({ puno }: { puno: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 flex-none">
      <path
        d="M12 20.6l-1.5-1.4C5.2 14.5 2 11.6 2 8.1 2 5.4 4.1 3.3 6.8 3.3c1.5 0 3 .7 3.9 1.9l1.3 1.6 1.3-1.6c.9-1.2 2.4-1.9 3.9-1.9C19.9 3.3 22 5.4 22 8.1c0 3.5-3.2 6.4-8.5 11.1z"
        fill={puno ? CRVENA : "none"}
        stroke={puno ? CRVENA : "#C4BCA6"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Učenje rečenica NEMA srca i to se vidi: tamo se greška ne kažnjava, pa red
 * srca koji stoji pun i nepomičan ne bi bio istina nego pretnja koja se nikad
 * ne ostvaruje. Ostale igre ih imaju uvek.
 */
function srcaZaVrstu(vrsta: VrstaIgre, srca: number): number | null {
  return vrsta === "ucenje-recenica" ? null : srca;
}

function Srca({ srca }: { srca: number }) {
  const preostalo = Math.max(0, srca);
  return (
    <p className="flex items-center gap-1">
      {/* Srca se ne smeju preneti samo slikom, pa uz njih ide i tekst za čitač. */}
      <span className="sr-only">{`Preostala srca: ${preostalo} od ${SRCA}`}</span>
      {Array.from({ length: SRCA }, (_, i) => (
        <Srce key={i} puno={i < preostalo} />
      ))}
    </p>
  );
}

// ── Ljuska ──────────────────────────────────────────────────────────────────

export default function Igra({
  childId,
  reci,
  stare = [],
  recenice = [],
  stareRecenice = [],
  vrsta,
  rekord,
  onKraj,
}: {
  childId: string;
  reci: Rec[];
  /**
   * Stare reči iz ranijih lekcija koje smeju da se umešaju u partiju: samo one
   * koje dete VEĆ IMA u albumu, sa oznakom izbledelosti i brojem grešaka.
   * Tačan odgovor na staru reč kroz `zaradi` samo osveži datum (i time vrati
   * boju) - novu sličicu ne pravi, pa ni kesicu ne dira.
   */
  stare?: StaraRec[];
  /** Rečenice OVE lekcije - hrane slagalicu, dopunu i učenje rečenica. */
  recenice?: Recenica[];
  /**
   * Rečenice ranijih lekcija, za ponavljanje u rečeničnim igrama. Biraju se
   * preko svoje glavne reči, istim pravilom kao stare reči. Učenje rečenica ih
   * ne dobija: tamo se uči OVA lekcija.
   */
  stareRecenice?: Recenica[];
  /**
   * Sve igre, i one od reči i one od rečenica: ljuska sada zaista ume da nacrta
   * i rečenično pitanje, pa nema razloga da im prolaz bude zatvoren. Koja se
   * fabrika pitanja koristi, odlučuje `jeRecenicna`.
   */
  vrsta: VrstaIgre;
  /**
   * Lični rekord u skakaču na ovoj lekciji, ili ništa ako ga još nema. Ljuska ga
   * samo prosleđuje telu igre; upisuje ga ekran lekcije na kraju partije.
   */
  rekord?: number | null;
  /**
   * Kraj partije. Uz spisak tačnih ide i dokle se koza popela u skakaču, jer je
   * visina drugi rezultat te igre, pored sličica. Ostale igre javljaju nulu.
   *
   * `prosloSve` kaže da li je dete stiglo kroz sva pitanja, za razliku od
   * izlaza na „Dosta za sad" ili partije koja je pala na srcima. Katanci učenja
   * gledaju baš to. Partija BEZ ijednog pitanja se broji kao prođena: prazna
   * faza ne sme da zaključa ono što stoji iza nje.
   */
  onKraj: (tacniRecIdovi: string[], sprat: number, prosloSve: boolean) => void;
}) {
  // Sesija se pravi tek posle montiranja. Pitanja se mešaju preko Math.random,
  // pa bi računanje u prvom renderu dalo drugačiji redosled na serveru nego u
  // pretraživaču i React bi prijavio neslaganje pri hidraciji.
  const [sesija, setSesija] = useState<Sesija | null>(null);
  const [odziv, setOdziv] = useState<Odziv | null>(null);

  // Sesija ide dalje ODMAH po odgovoru, da srce nestane u istom trenutku kad i
  // greška - dete mora da vidi zbog čega ga je izgubilo. Da se pitanje ne bi
  // istog časa promenilo, telo igre se za vreme odziva prikazuje zamrznuto.
  // Ovo NIJE paralelno stanje: srca, napredak i spisak tačnih i dalje dolaze
  // isključivo iz sesije, zamrznuto je samo ono što se crta.
  const [zamrznuto, setZamrznuto] = useState<Pitanje | null>(null);
  // Ključ tela igre. Ne sme da bude `sesija.indeks`, jer se indeks pomera dok
  // odziv još stoji, pa bi se telo prevremeno prekrojilo i pobrisalo obojen
  // tačan odgovor koji dete baš tada čita.
  const [korak, setKorak] = useState(0);

  // `reci` je novi niz pri svakom renderu roditelja, pa ne sme u zavisnosti
  // efekta - partija bi se vrtela u krug i dete nikad ne bi videlo pitanje.
  const reciRef = useRef(reci);
  useEffect(() => {
    reciRef.current = reci;
  }, [reci]);

  // Isti razlog i za stare reči.
  const stareRef = useRef(stare);
  useEffect(() => {
    stareRef.current = stare;
  }, [stare]);

  // I za rečenice: i one stižu kao nov niz pri svakom renderu roditelja.
  const receniceRef = useRef(recenice);
  useEffect(() => {
    receniceRef.current = recenice;
  }, [recenice]);

  const stareReceniceRef = useRef(stareRecenice);
  useEffect(() => {
    stareReceniceRef.current = stareRecenice;
  }, [stareRecenice]);

  /**
   * Dokle se koza popela u skakaču. Ref, ne stanje: ljuska time ništa ne crta,
   * samo prosleđuje broj dalje na kraju partije, pa bi stanje značilo render
   * više posle svakog skoka. Ostale igre ga ostavljaju na nuli.
   */
  const visina = useRef(0);
  const naVisinu = useCallback((sprat: number) => {
    visina.current = sprat;
  }, []);

  useEffect(() => {
    if (jeRecenicna(vrsta)) {
      // Učenje rečenica je PROLAZ KROZ LEKCIJU, ne partija od osam pitanja:
      // ide se kroz sve podobne rečenice lekcije i bez ijedne stare, jer se uči
      // ova lekcija. Vežbe (slagalica i dopuna) idu normalnu partiju, sa
      // umešanim rečenicama starih reči.
      const ucenje = vrsta === "ucenje-recenica";
      // Pogrešni odgovori i pravilo velikog slova gledaju u ZAJEDNIČKI skup
      // reči, da pitanje o staroj reči ne bude prepoznatljivo po tome što nudi
      // manje ili drugačije reči.
      const pool = [...reciRef.current, ...stareRef.current.map((s) => s.rec)];
      setSesija(
        novaSesija(
          recenicnaPitanja(
            receniceRef.current,
            ucenje ? [] : stareReceniceRef.current,
            ucenje ? [] : stareRef.current,
            // Učenje rečenica je blaži prikaz slagalice, pa i pitanja nosi
            // njena - isto kao što skakač nosi pitanja o rodu.
            ucenje ? "slagalica" : vrsta,
            ucenje ? receniceRef.current.length : PITANJA_PO_PARTIJI,
            Math.random,
            pool
          )
        )
      );
    } else {
      // Ovde je `vrsta` sužena na igre od reči, pa `kolikoPitanja` i
      // `pitanjaSaStarima` dobijaju tačno ono što umeju da obrade.
      setSesija(
        novaSesija(
          pitanjaSaStarima(
            reciRef.current,
            stareRef.current,
            vrsta,
            kolikoPitanja(vrsta),
            Math.random
          )
        )
      );
    }
    setOdziv(null);
    setZamrznuto(null);
    setKorak((k) => k + 1);
    visina.current = 0;
  }, [vrsta]);

  const tajmer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (tajmer.current) clearTimeout(tajmer.current);
  }, []);

  /**
   * Slanje u toku igre. Ide u pozadini, ne čeka se i njegov pad se namerno guta,
   * jer se igra ne sme prekidati zbog mreže. Ono što ovde ne stigne, hvata
   * ponovno slanje na kraju partije (vidi `onKraj`).
   */
  const posaljiZaradjeno = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      void fetch(`/api/zack/${childId}/zaradi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recIdovi }),
        // Dete često zatvori karticu čim odgovori. Bez ovoga pretraživač
        // prekine poziv u letu i sličica propadne.
        keepalive: true,
      }).catch(() => {
        /* Igra se ne prekida zbog mreže. */
      });
    },
    [childId]
  );

  /**
   * Beleženje greške, isti pošalji-i-zaboravi obrazac kao slanje zarađenog:
   * ne čeka se, pad se guta, igra se zbog mreže ne prekida i ne usporava. Za
   * razliku od zarađenog, greška se na kraju NE šalje ponovo: izgubljena
   * greška je gubitak koji sme da se desi - sledeća ista će je zapamtiti.
   */
  const posaljiGresku = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      void fetch(`/api/zack/${childId}/greska`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recIdovi }),
        // Dete ume da zatvori karticu i posle greške.
        keepalive: true,
      }).catch(() => {
        /* Igra se ne prekida zbog mreže. */
      });
    },
    [childId]
  );

  const javi = useCallback((o: Odziv) => {
    setOdziv(o);
    if (tajmer.current) clearTimeout(tajmer.current);
    tajmer.current = setTimeout(
      () => {
        setOdziv(null);
        setZamrznuto(null);
        setKorak((k) => k + 1);
      },
      o.tacno ? ZADRZI_TACNO : ZADRZI_GRESKU
    );
  }, []);

  /** Igre sa jednim odgovorom po pitanju. Parovi ovo NE koriste. */
  const naOdgovor = useCallback(
    (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => {
      // Tačno se zarađuje, netačno se pamti - oba u pozadini, nijedno ne koči.
      if (tacno) posaljiZaradjeno(tacniRecIdovi(pitanje));
      else posaljiGresku(tacniRecIdovi(pitanje));
      setZamrznuto(pitanje);
      setSesija((s) => (s ? odgovori(s, tacno) : s));
      javi({ tacno, tekst: tacno ? "Zack!" : `Ups! ${tacanTekst}` });
    },
    [javi, posaljiGresku, posaljiZaradjeno]
  );

  const naSpojen = useCallback(
    (recId: string) => {
      posaljiZaradjeno([recId]);
      setSesija((s) => (s ? zabeleziTacne(s, [recId]) : s));
      javi({ tacno: true, tekst: "Zack!" });
    },
    [javi, posaljiZaradjeno]
  );

  const naPromasaj = useCallback(
    (tacanTekst: string, recId: string) => {
      // Pamti se reč koja je bila CILJ spajanja, jer je nju dete promašilo.
      posaljiGresku([recId]);
      setSesija((s) => (s ? oduzmiSrce(s) : s));
      javi({ tacno: false, tekst: `Ups! ${tacanTekst}` });
    },
    [javi, posaljiGresku]
  );

  /**
   * Izlaz na zahtev deteta. Ne prekida ništa nasilno: `odustani` samo zatvara
   * sesiju, pa kraj prođe istim putem kao i odigrana partija i sve što je dete
   * zabeležilo ode na ponovno slanje. Parovi koriste isto ovo.
   */
  const izadji = useCallback(() => {
    setSesija((s) => (s ? odustani(s) : s));
  }, []);

  // Kraj se javlja roditelju tačno jednom, i tek pošto odziv odstoji svoje.
  // Bez čekanja na odziv, poslednja greška bi odnela treće srce i ekran bi
  // odleteo dalje pre nego što dete pročita tačan odgovor.
  const javljenKraj = useRef(false);
  const onKrajRef = useRef(onKraj);
  useEffect(() => {
    onKrajRef.current = onKraj;
  }, [onKraj]);
  useEffect(() => {
    if (!sesija || !sesija.gotovo || odziv !== null || javljenKraj.current) return;
    javljenKraj.current = true;
    // Prošlo je sve ako je tok stigao do kraja. Izlaz na „Dosta za sad" i
    // partija koja je pala na srcima ostaju iza toga, a partija bez ijednog pitanja
    // prolazi (0 >= 0) - prazna faza ne sme da drži katanac zatvorenim.
    onKrajRef.current(
      sesija.tacni,
      visina.current,
      sesija.indeks >= sesija.pitanja.length
    );
  }, [sesija, odziv]);

  if (!sesija) return <Cekanje />;

  if (sesija.pitanja.length === 0) {
    return (
      <Okvir naslov={NAZIVI[vrsta]} srca={srcaZaVrstu(vrsta, SRCA)} popunjeno={0}>
        <p className="p-6 text-center text-[17px] leading-relaxed" style={{ color: PRIGUSEN }}>
          {/* Rečenične igre se ne hrane rečima, pa bi im poruka o rečima bila
              netačna: dete bi tražilo grešku tamo gde je nema. */}
          {jeRecenicna(vrsta)
            ? "Za ovu igru u lekciji još nema rečenica. Probaj neku drugu."
            : "Za ovu igru u lekciji još nema dovoljno reči. Probaj neku drugu."}
        </p>
      </Okvir>
    );
  }

  // Gotova partija se drži na ekranu samo dok se čita poslednji odziv.
  if (sesija.gotovo && !zamrznuto) return <Cekanje />;

  // Dok odziv stoji, crta se zamrznuto pitanje, pa i posle poslednjeg odgovora
  // dete vidi tačan odgovor umesto praznog ekrana.
  const p = zamrznuto ?? sesija.pitanja[sesija.indeks];
  if (!p) return <Cekanje />;

  // Skakač NEMA traku napretka i to je namerno: partija traje dok ima srca, pa
  // traka ne bi imala prema čemu da raste. Napredak je sama visina koze.
  const popunjeno =
    vrsta === "skakac"
      ? null
      : p.igra === "parovi"
        ? Math.round((sesija.tacni.length / Math.max(1, p.parovi.length)) * 100)
        : Math.round((sesija.indeks / sesija.pitanja.length) * 100);

  // Dok se čita odziv, telo je zaključano, da drugi klik ne upadne u odgovor
  // koji je već poslat.
  const zakljucano = zamrznuto !== null;

  return (
    <Okvir naslov={NAZIVI[vrsta]} srca={srcaZaVrstu(vrsta, sesija.srca)} popunjeno={popunjeno}>
      <OdzivTraka odziv={odziv} />
      {p.igra === "parovi" ? (
        <Parovi
          // Stalan ključ, NIKAD `korak`. Parovi su jedno pitanje koje traje
          // celu igru, pa bi ih svaki istekli odziv iznova montirao: spojeni
          // parovi bi se odbojili, a pločice bi se ispremeštale detetu pod
          // prstom. Zarađeno bi preživelo, ali bi se isti par mogao rešavati
          // više puta.
          key="parovi"
          pitanje={p}
          naSpojen={naSpojen}
          naPromasaj={naPromasaj}
          naKraj={izadji}
        />
      ) : p.igra === "rod" ? (
        // Isto pitanje, dva tela. Skakač ima tačno tri platforme, pa mu tačan
        // odgovor mora biti jedan od tri člana; reč bez roda ovamo ionako ne
        // stiže, ali ako nekad stigne, dobija spisak umesto nemoguće partije.
        vrsta === "skakac" && jeClan(p.tacan) ? (
          <Skakac
            // Stalan ključ, NIKAD `korak`. Skakač je jedno penjanje koje traje
            // celu partiju: svaki tačan odgovor je sprat više i koza tu visinu
            // zadržava do kraja. Ključ po koraku bi ga montirao iznova posle
            // svakog pitanja, pa bi se visina svaki put vratila na tlo - a
            // zarađeno se u ovoj igri ne oduzima. Stanje jednog pitanja skakač
            // vraća sam, kad vidi da mu je stiglo novo.
            key="skakac"
            pitanje={p}
            tacan={p.tacan}
            zakljucano={zakljucano}
            naOdgovor={naOdgovor}
            naVisinu={naVisinu}
            rekord={rekord}
          />
        ) : (
          <IgraRod key={korak} pitanje={p} zakljucano={zakljucano} naOdgovor={naOdgovor} />
        )
      ) : p.igra === "diktat" ? (
        <IgraDiktat
          key={korak}
          pitanje={p}
          prihvatljivi={reci.filter((r) => r.sr === p.prevod).map((r) => r.de)}
          zakljucano={zakljucano}
          naOdgovor={naOdgovor}
        />
      ) : p.igra === "brzo-biranje" || p.igra === "mnozina" ? (
        <IgraBiranje key={korak} pitanje={p} zakljucano={zakljucano} naOdgovor={naOdgovor} />
      ) : p.igra === "slagalica" ? (
        <Slagalica
          key={korak}
          pitanje={p}
          // Isto pitanje, dva režima: učenje rečenica prvo pokaže rečenicu i
          // vodi kroz slaganje, vežba pusti dete da složi pa proveri.
          vodjeno={vrsta === "ucenje-recenica"}
          zakljucano={zakljucano}
          naOdgovor={naOdgovor}
          naVodjenoSlozena={(pit) => {
            // U vođenom režimu se javlja SAMO tačno, i to tek kad je rečenica
            // cela složena. Zato ovde srce ne može da padne (`odgovori` gubi
            // srce jedino na netačno) ni greška da se upiše (`posaljiGresku`
            // se zove samo na netačno), a reč rečenice se uredno zaradi. Tekst
            // tačnog odgovora ostaje prazan: on se ispisuje samo uz „Ups!".
            naOdgovor(true, "", pit);
          }}
        />
      ) : p.igra === "dopuna" ? (
        <Dopuna key={korak} pitanje={p} zakljucano={zakljucano} naOdgovor={naOdgovor} />
      ) : null}

      {/* Bez ovoga dete koje se zaglavi nema izlaz osim dugmeta „nazad" u
          pretraživaču, a tim putem se kraj partije nikad ne javi i ponovno
          slanje izostane. Parovi imaju svoje „Dosta za sad" unutar table, pa im
          ovo ne treba: dva ista dugmeta jedno ispod drugog detetu izgledaju kao
          izbor koji mora da razume, a nije. */}
      {p.igra !== "parovi" && (
        <button
          type="button"
          onClick={izadji}
          className={`${DUGME} font-heading mt-6 block min-h-[52px] w-full border-2 text-[17px] font-bold`}
          style={{ background: "transparent", borderColor: IVICA, color: PRIGUSEN }}
        >
          Dosta za sad
        </button>
      )}
    </Okvir>
  );
}

function Cekanje() {
  return (
    <p className="py-16 text-center text-[17px]" style={{ color: PRIGUSEN }}>
      Samo trenutak...
    </p>
  );
}

function Okvir({
  naslov,
  srca,
  popunjeno,
  children,
}: {
  naslov: string;
  /** `null` znači da se u ovoj igri srca ne troše, pa se i ne crtaju. */
  srca: number | null;
  /** `null` znači da partija nema unapred poznat kraj, pa se traka ne crta. */
  popunjeno: number | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: PODLOGA }}>
      <header className="flex items-center justify-between gap-3">
        <h1
          className="font-heading text-[19px] font-bold leading-tight tracking-tight"
          style={{ color: MASTILO }}
        >
          {naslov}
        </h1>
        {srca !== null && <Srca srca={srca} />}
      </header>

      {popunjeno !== null && (
        <p className="mt-3">
          <span className="sr-only">{`Napredak: ${popunjeno} odsto`}</span>
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
      )}

      <div className="mt-5">{children}</div>
    </div>
  );
}

/**
 * Odziv mora da stigne i do čitača ekrana, ne samo do oka. Traka stoji uvek, i
 * kad je prazna, da se ekran ne pomera kad se poruka pojavi - dete bi promašilo
 * dugme koje je skočilo.
 */
function OdzivTraka({ odziv }: { odziv: Odziv | null }) {
  return (
    <p
      aria-live="assertive"
      className="font-heading flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 text-center text-[19px] font-bold leading-snug"
      style={{
        background: odziv ? (odziv.tacno ? "#E4F0E9" : "#FBE7E5") : "transparent",
        color: odziv ? (odziv.tacno ? ZELENA : MASTILO) : "transparent",
      }}
    >
      {odziv ? odziv.tekst : ""}
    </p>
  );
}

/**
 * Reč o kojoj se pita. Isti okvir u sve četiri igre sa jednim odgovorom.
 * Množina jedina nosi žutu nalepnicu na nadnaslovu: žuta je u učioničkoj
 * konvenciji boja množine, pa dete i po boji zna šta se traži.
 */
function Zadatak({
  tekst,
  nemacki,
  nadnaslov,
  mnozina = false,
}: {
  tekst: string;
  nemacki: boolean;
  nadnaslov: string;
  mnozina?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border px-5 py-7 text-center"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <p className="font-heading text-[12px] font-bold uppercase tracking-[.18em]">
        <span
          className={mnozina ? "rounded-md px-2 py-1" : undefined}
          style={mnozina ? { background: BOJA_MNOZINA, color: MASTILO } : { color: PRIGUSEN }}
        >
          {nadnaslov}
        </span>
      </p>
      <p
        {...(nemacki ? { lang: "de" } : {})}
        className="font-heading mt-2 text-[30px] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]"
        style={{ color: MASTILO }}
      >
        {tekst}
      </p>
    </div>
  );
}

// ── Brzo biranje i Množina ──────────────────────────────────────────────────

type PitanjeBiranja = Extract<Pitanje, { igra: "brzo-biranje" } | { igra: "mnozina" }>;

/**
 * Broj ponuđenih odgovora NIJE uvek četiri. Na lekciji od tri reči ih je tri, a
 * ako dve reči dele prevod, i manje. Zato se crta preko `pitanje.opcije`.
 */
function IgraBiranje({
  pitanje,
  zakljucano,
  naOdgovor,
}: {
  pitanje: PitanjeBiranja;
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
}) {
  const [izabrano, setIzabrano] = useState<string | null>(null);
  const mnozina = pitanje.igra === "mnozina";

  return (
    <div>
      <Zadatak
        nadnaslov={mnozina ? "Kako glasi u množini" : "Šta ovo znači"}
        tekst={mnozina ? pitanje.jednina : pitanje.pitanje}
        nemacki
        mnozina={mnozina}
      />
      <ul className="mt-4 space-y-2.5">
        {pitanje.opcije.map((opcija) => {
          const jeTacna = opcija === pitanje.tacan;
          const jeIzabrana = opcija === izabrano;
          // Posle odgovora se tačan uvek oboji, i kad dete nije njega izabralo.
          // To je ono „odmah daje tačan odgovor" u praksi.
          const stil = !izabrano
            ? { background: PAPIR, borderColor: IVICA, color: MASTILO }
            : jeTacna
              ? { background: "#E4F0E9", borderColor: ZELENA, color: MASTILO }
              : jeIzabrana
                ? { background: "#FBE7E5", borderColor: CRVENA, color: MASTILO }
                : { background: PAPIR, borderColor: IVICA, color: PRIGUSEN };

          return (
            <li key={opcija}>
              <button
                type="button"
                disabled={zakljucano}
                onClick={() => {
                  setIzabrano(opcija);
                  naOdgovor(jeTacna, pitanje.tacan, pitanje);
                }}
                {...(mnozina ? { lang: "de" } : {})}
                className={`${DUGME} font-heading block min-h-[60px] w-full border-2 px-4 py-3.5 text-left text-[19px] font-bold leading-snug [overflow-wrap:anywhere] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                style={stil}
              >
                {opcija}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Der, die ili das ────────────────────────────────────────────────────────

function IgraRod({
  pitanje,
  zakljucano,
  naOdgovor,
}: {
  pitanje: Extract<Pitanje, { igra: "rod" }>;
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
}) {
  const [izabran, setIzabran] = useState<Rod | null>(null);
  const imenica = bezClana(pitanje.imenica);

  // `napraviPitanja` odbacuje reči bez roda, pa „nema" ovde ne može da stigne.
  // Ali tip to dozvoljava, a rešavati to sa `!` ili `as` znači nadati se. Ako
  // tačan odgovor ipak nije jedan od tri člana, dobija svoje dugme, pa igra
  // ostane rešiva umesto da tiho postane nemoguća.
  const opcije: Rod[] = jeClan(pitanje.tacan) ? [...CLANOVI] : [...CLANOVI, pitanje.tacan];

  return (
    <div>
      <Zadatak nadnaslov="Koji član ide uz ovu reč" tekst={imenica} nemacki />
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {opcije.map((rod) => {
          const jeTacan = rod === pitanje.tacan;
          const jeIzabran = rod === izabran;
          const boja = bojaZaRod(rod);
          // Dok se ne odgovori, dugme je u punoj boji roda. Posle odgovora se
          // pogrešno bira gasi, a tačno ostaje u boji i dobija okvir, da se
          // razlika ne oslanja samo na boju.
          const ugaseno = izabran !== null && !jeTacan;

          return (
            <li key={rod} className={opcije.length === 4 && rod === "nema" ? "col-span-3" : ""}>
              <button
                type="button"
                lang="de"
                disabled={zakljucano}
                onClick={() => {
                  setIzabran(rod);
                  naOdgovor(jeTacan, `${NATPIS_RODA[pitanje.tacan]} ${imenica}`, pitanje);
                }}
                className={`${DUGME} font-heading block min-h-[72px] w-full border-4 px-2 py-4 text-[21px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.97]`}
                style={{
                  background: ugaseno ? PAPIR : boja,
                  borderColor: jeTacan && izabran !== null ? MASTILO : boja,
                  color: ugaseno ? PRIGUSEN : slovaNaRodu(rod),
                  opacity: ugaseno && jeIzabran ? 1 : ugaseno ? 0.55 : 1,
                }}
              >
                {NATPIS_RODA[rod]}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Diktat ──────────────────────────────────────────────────────────────────

const ZNACI = ["ä", "ö", "ü", "ß"] as const;

/**
 * Blago poređenje: veličina slova i višak razmaka se zanemaruju, a član ispred
 * imenice sme i da se otkuca i da se izostavi. Umlauti se NE diraju: „Hause"
 * nije „Häuser" i nikad ne sme da prođe, jer je baš to ono što se uči.
 */
export function istoNapisano(a: string, b: string): boolean {
  const sredi = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^(der|die|das)\s+/i, "")
      .toLocaleLowerCase("de");
  return sredi(a) === sredi(b);
}

function IgraDiktat({
  pitanje,
  prihvatljivi,
  zakljucano,
  naOdgovor,
}: {
  pitanje: Extract<Pitanje, { igra: "diktat" }>;
  /**
   * Svi nemački oblici koji u ovoj lekciji znače isto što i traženi prevod.
   * Kad dve reči dele naš prevod („kuća" je i das Haus i das Gebäude), pitanje
   * „napiši kuća na nemačkom" ima dva poštena odgovora. Priznati samo jedan
   * znači kazniti dete za reč koju zna.
   */
  prihvatljivi: readonly string[];
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
}) {
  const [tekst, setTekst] = useState("");
  const poljeRef = useRef<HTMLInputElement | null>(null);
  const kursorRef = useRef<number | null>(null);

  // Kursor se vraća TEK pošto React upiše novu vrednost u polje. Postavljanje
  // `value` gura kursor na kraj, pa svako ranije nameštanje (i ono iz
  // requestAnimationFrame) bude pregaženo i dete koje ubaci „ä" usred reči
  // nastavlja da kuca na kraju.
  useEffect(() => {
    const polje = poljeRef.current;
    const mesto = kursorRef.current;
    if (!polje || mesto === null) return;
    kursorRef.current = null;
    polje.focus();
    polje.setSelectionRange(mesto, mesto);
  });

  /** Naša tastatura nema ä ö ü ß, pa se ubacuju na mesto kursora. */
  const ubaci = (znak: string) => {
    const polje = poljeRef.current;
    const od = polje?.selectionStart ?? tekst.length;
    const doo = polje?.selectionEnd ?? od;
    setTekst(tekst.slice(0, od) + znak + tekst.slice(doo));
    kursorRef.current = od + znak.length;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (zakljucano || tekst.trim() === "") return;
        const tacno = [pitanje.tacan, ...prihvatljivi].some((v) => istoNapisano(tekst, v));
        naOdgovor(tacno, pitanje.tacan, pitanje);
      }}
    >
      <Zadatak nadnaslov="Napiši na nemačkom" tekst={pitanje.prevod} nemacki={false} />

      <ul className="mt-4 flex gap-2">
        {ZNACI.map((znak) => (
          <li key={znak} className="flex-1">
            <button
              type="button"
              lang="de"
              disabled={zakljucano}
              onClick={() => ubaci(znak)}
              aria-label={`Ubaci slovo ${znak}`}
              className={`${DUGME} font-heading block min-h-[52px] w-full border-2 text-[21px] font-bold`}
              style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
            >
              {znak}
            </button>
          </li>
        ))}
      </ul>

      <label className="mt-2.5 block">
        <span className="sr-only">{`Napiši na nemačkom: ${pitanje.prevod}`}</span>
        <input
          ref={poljeRef}
          type="text"
          lang="de"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          disabled={zakljucano}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="font-heading block min-h-[60px] w-full rounded-2xl border-2 px-4 py-3 text-[22px] font-bold outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
          style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
        />
      </label>

      <button
        type="submit"
        disabled={zakljucano || tekst.trim() === ""}
        className={`${DUGME} font-heading mt-2.5 block min-h-[60px] w-full text-[19px] font-bold disabled:opacity-45 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
        style={{ background: MASTILO, color: "#FFFFFF" }}
      >
        Proveri
      </button>
    </form>
  );
}

// ── Parovi ──────────────────────────────────────────────────────────────────

/**
 * Parovi su JEDNO pitanje koje pokriva više reči. Zato se ovde NIKAD ne zove
 * `odgovori(s, false)` - to bi na prvoj grešci završilo celu igru i pojelo sve
 * što je dete do tada spojilo. Umesto toga: spojen par se odmah beleži kao
 * zarađen, promašaj samo uzima srce, a igra se završava kad nestane pločica ili
 * kad dete pritisne izlaz.
 *
 * Pogrešno spojene pločice se sklanjaju zajedno sa tačnim odgovorom umesto da
 * se vrate na sto. Da ostanu, dete bi ih rešilo metodom eliminacije i zaradilo
 * sličicu koju nije znalo, a i ostalo bi bez izlaza kad ostane jedna reč.
 */
type ResenPar = { levi: number; desni: number; tacno: boolean };

function Parovi({
  pitanje,
  naSpojen,
  naPromasaj,
  naKraj,
}: {
  pitanje: Extract<Pitanje, { igra: "parovi" }>;
  naSpojen: (recId: string) => void;
  naPromasaj: (tacanTekst: string, recId: string) => void;
  naKraj: () => void;
}) {
  const parovi = pitanje.parovi;

  // Dve kolone se mešaju odvojeno, inače par stoji jedan pored drugog i nema
  // se šta spajati. Mešanje ide kroz useMemo, a ne pri svakom renderu, da
  // pločice ne skaču detetu ispod prsta.
  const [levi, desni] = useMemo(() => {
    const indeksi = parovi.map((_, i) => i);
    return [promesaj(indeksi, Math.random), promesaj(indeksi, Math.random)];
  }, [parovi]);

  const [reseni, setReseni] = useState<ResenPar[]>([]);
  const [izabranLevi, setIzabranLevi] = useState<number | null>(null);

  const stanjeLevog = (i: number) => reseni.find((r) => r.levi === i);
  const stanjeDesnog = (j: number) => reseni.find((r) => r.desni === j);
  const preostalo = levi.length - reseni.length;

  // Igra se gasi tek pošto React iscrta poslednji spoj, da dete vidi „Zack!".
  useEffect(() => {
    if (preostalo > 0) return;
    const t = setTimeout(naKraj, ZADRZI_TACNO);
    return () => clearTimeout(t);
  }, [preostalo, naKraj]);

  const kliknuoDesni = (d: number) => {
    if (izabranLevi === null) return;
    const l = izabranLevi;
    setIzabranLevi(null);
    // Poredi se PREVOD, ne indeks. Kad dve reči dele isti naš prevod, obe
    // pločice sa tim prevodom su pošten odgovor i dete ne sme da bude kažnjeno
    // što je izabralo „pogrešnu" od dve iste.
    if (parovi[d].sr === parovi[l].sr) {
      naSpojen(parovi[l].recId);
      setReseni((x) => [...x, { levi: l, desni: d, tacno: true }]);
      return;
    }
    // Promašena reč se otkriva i sklanja zajedno sa svojim pravim prevodom.
    // Da ostane na stolu, dete bi je dobilo metodom eliminacije i zaradilo
    // sličicu koju nije znalo. Zarađuje se samo ono što je stvarno spojeno.
    naPromasaj(`${parovi[l].de} je ${parovi[l].sr}`, parovi[l].recId);
    setReseni((x) => [...x, { levi: l, desni: l, tacno: false }]);
  };

  const plocica = (
    kljuc: string,
    natpis: string,
    nemacki: boolean,
    resen: ResenPar | undefined,
    izabrana: boolean,
    onClick: () => void
  ) => (
    <li key={kljuc}>
      <button
        type="button"
        onClick={onClick}
        disabled={resen !== undefined}
        {...(nemacki ? { lang: "de" } : {})}
        {...(resen ? {} : { "aria-pressed": izabrana })}
        className={`${DUGME} font-heading flex min-h-[58px] w-full items-center justify-center border-2 px-2.5 py-3 text-center text-[17px] font-bold leading-tight [overflow-wrap:anywhere] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.97]`}
        style={
          resen
            ? resen.tacno
              ? { background: "#E4F0E9", borderColor: ZELENA, color: ZELENA }
              : { background: "transparent", borderColor: IVICA, color: PRIGUSEN }
            : izabrana
              ? { background: MASTILO, borderColor: MASTILO, color: "#FFFFFF" }
              : { background: PAPIR, borderColor: IVICA, color: MASTILO }
        }
      >
        {natpis}
      </button>
    </li>
  );

  return (
    <div>
      <p className="mb-3 text-center text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
        Dodirni nemačku reč, pa njen prevod.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <ul className="space-y-2.5">
          {levi.map((i) =>
            plocica(`l${i}`, parovi[i].de, true, stanjeLevog(i), izabranLevi === i, () =>
              setIzabranLevi(izabranLevi === i ? null : i)
            )
          )}
        </ul>
        <ul className="space-y-2.5">
          {desni.map((i) =>
            plocica(`d${i}`, parovi[i].sr, false, stanjeDesnog(i), false, () => kliknuoDesni(i))
          )}
        </ul>
      </div>

      {/* Bez ovog dugmeta dete koje se zaglavi ne može da izađe, a sve što je
          spojilo bi propalo. `odustani` čuva sve zabeleženo. */}
      <button
        type="button"
        onClick={naKraj}
        className={`${DUGME} font-heading mt-5 block min-h-[52px] w-full border-2 text-[17px] font-bold`}
        style={{ background: "transparent", borderColor: IVICA, color: PRIGUSEN }}
      >
        Dosta za sad
      </button>
    </div>
  );
}

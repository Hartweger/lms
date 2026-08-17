"use client";

// Ekran lekcije. Ovo je jedini ekran koji dete stvarno koristi svaki dan, pa se
// ovde spaja sve: podsetnik na pravilo, pet igara, kesica i album.
//
// VRHOVNO PRAVILO
// ---------------
// Detetu se NIKAD ne oduzima ono što je zaradilo. Iz toga slede tri stvari koje
// se ne smeju „pojednostaviti":
//
// 1. Napredak NE ide odavde. Posle svakog tačnog odgovora ga šalje sama
//    komponenta igre, red po red. Ovaj ekran samo otvara kesicu na kraju.
// 2. Lepljenje se vidi ODMAH, a poziv ide u pozadini i njegov pad se guta.
//    Sličica je već zarađena i isporučena u bazi, pa pad mreže ne može da je
//    odnese: najgore što se desi je da ostane „u ruci" do sledećeg otvaranja.
// 3. Sličice koje su ostale u ruci od prošlog puta se pri učitavanju vraćaju u
//    ruku. Bez toga bi dete koje je zatvorilo karticu pre lepljenja zateklo
//    prazna mesta koja nema čime da popuni.
//
// ŠTA ALBUM SME DA POKAŽE
// -----------------------
// Reč koja je „u ruci" se u albumu ispod crta kao PRAZNO mesto, dok je dete ne
// zalepi. Album je nagrada za zalepljeno, ne spisak onoga što stiže.
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Igra, { NAZIVI } from "@/components/zack/Igra";
import Slicica from "@/components/zack/Slicica";
import { brojac, type StavkaAlbuma } from "@/lib/zack/album";
import type { Igra as VrstaIgre } from "@/lib/zack/pitanja";
import type { Rec } from "@/lib/zack/rec";

type Lekcija = {
  id: string;
  broj: number;
  naziv: string;
  pravilo_naslov: string | null;
  pravilo_tekst: string | null;
  pravilo_primer: string | null;
};

/**
 * Redosled igara na ekranu. Diktat je ubedljivo najteži i namerno stoji
 * poslednji: dete koje prvo naleti na njega odustane pre nego što proba ostalo.
 * Parovi su najlakši ulaz, pa idu prvi.
 */
const IGRE: readonly VrstaIgre[] = ["parovi", "brzo-biranje", "rod", "mnozina", "diktat"];

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";
const ZUTA = "#FFC400";
const CRVENA = "#E5342A";

/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const FOKUS = "outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

// ── Brojevi u našem jeziku ──────────────────────────────────────────────────

/**
 * Broj menja oblik imenice iza sebe: 1 sličica, 2 sličice, 5 sličica. Brojevi
 * od 11 do 14 su izuzetak i idu kao 5, ma koja im bila poslednja cifra.
 */
type Oblik = "jedna" | "dve" | "pet";

function oblikBroja(n: number): Oblik {
  const ceo = Math.abs(Math.trunc(n));
  if (ceo % 100 >= 11 && ceo % 100 <= 14) return "pet";
  const poslednja = ceo % 10;
  if (poslednja === 1) return "jedna";
  if (poslednja >= 2 && poslednja <= 4) return "dve";
  return "pet";
}

const SLICICA: Record<Oblik, string> = { jedna: "sličica", dve: "sličice", pet: "sličica" };

function recSlicica(n: number): string {
  return SLICICA[oblikBroja(n)];
}

const CEKA: Record<Oblik, string> = {
  jedna: "nova sličica te čeka",
  dve: "nove sličice te čekaju",
  pet: "novih sličica te čeka",
};

const STIGLO: Record<Oblik, string> = {
  jedna: "Stigla je nova sličica",
  dve: "Stigle su nove sličice",
  pet: "Stiglo je novih sličica",
};

// ── Čitanje odgovora rute ───────────────────────────────────────────────────

/**
 * Odgovor rute se ne uzima na veru. Nije stvar nepoverenja u sopstvenu rutu,
 * nego u to da jedan pokvaren red ne sme da obori ceo ekran detetu koje je taman
 * nešto zaradilo.
 */
function jeRec(v: unknown): v is Rec {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.redni_broj === "number" &&
    typeof o.de === "string" &&
    typeof o.sr === "string" &&
    (o.rod === "der" || o.rod === "die" || o.rod === "das" || o.rod === "nema") &&
    (o.mnozina === null || typeof o.mnozina === "string") &&
    (o.vrsta === "imenica" || o.vrsta === "glagol" || o.vrsta === "pridev" || o.vrsta === "ostalo") &&
    typeof o.izuzetak === "boolean"
  );
}

function citajKesicu(telo: unknown): { kesica: Rec[]; ostalo: number } {
  if (typeof telo !== "object" || telo === null) return { kesica: [], ostalo: 0 };
  const o = telo as Record<string, unknown>;
  const sirovo: unknown[] = Array.isArray(o.kesica) ? o.kesica : [];
  const ostalo = typeof o.ostaloNeisporuceno === "number" ? o.ostaloNeisporuceno : 0;
  return { kesica: sirovo.filter(jeRec), ostalo: Math.max(0, ostalo) };
}

// ── Sitne sličice ───────────────────────────────────────────────────────────

function Zvezdica({ velika }: { velika?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={velika ? "h-6 w-6 flex-none" : "h-[18px] w-[18px] flex-none"}
      fill="currentColor"
    >
      <path d="M12 2.2l2.7 6.3 6.8.6-5.1 4.5 1.5 6.6L12 16.7 6.1 20.2l1.5-6.6L2.5 9.1l6.8-.6z" />
    </svg>
  );
}

function Strelica({ nazad }: { nazad?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={nazad ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Ekran ───────────────────────────────────────────────────────────────────

type Poruka = "prazna-kesica" | "greska-kesice" | null;

export default function LekcijaClient({
  childId,
  lekcija,
  reci,
  pocetnoStanje,
  neotvorenaKesica,
}: {
  childId: string;
  lekcija: Lekcija;
  reci: Rec[];
  pocetnoStanje: StavkaAlbuma[];
  neotvorenaKesica: number;
}) {
  const [stanje, setStanje] = useState<StavkaAlbuma[]>(pocetnoStanje);
  const [igra, setIgra] = useState<VrstaIgre | null>(null);

  // Sličice koje su ostale u ruci od prošlog puta moraju da se vrate u ruku,
  // inače dete nema čime da popuni mesta koja u albumu stoje prazna.
  const [uRuci, setURuci] = useState<Rec[]>(() =>
    pocetnoStanje.filter((s) => s.stanje === "u-ruci").map((s) => s.rec)
  );

  const [ceka, setCeka] = useState(neotvorenaKesica);
  const [otvaram, setOtvaram] = useState(false);
  const [poruka, setPoruka] = useState<Poruka>(null);
  // Zaseban tekst za čitač ekrana. Ono što se vidi kao sličica mora i da se čuje.
  const [najava, setNajava] = useState("");

  // Dva brza tapa na „Otvori kesicu" ne smeju da pošalju dva poziva. Stanje
  // `otvaram` stiže tek u sledećem renderu, pa se čuva i u referenci.
  const uToku = useRef(false);

  const otvoriKesicu = useCallback(async () => {
    if (uToku.current) return;
    uToku.current = true;
    setOtvaram(true);
    setPoruka(null);

    try {
      const odgovor = await fetch(`/api/zack/${childId}/kesica`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lekcijaId: lekcija.id }),
      });
      if (!odgovor.ok) throw new Error(`kesica ${odgovor.status}`);

      const { kesica, ostalo } = citajKesicu(await odgovor.json());
      setCeka(ostalo);

      if (kesica.length === 0) {
        // Prazna kesica nije greška i ne sme da ostavi prazan ekran. Dete je
        // sve reči iz ove igre već videlo, i to mu se kaže mirno.
        setPoruka("prazna-kesica");
        setNajava("U kesici nema novih sličica, sve iz ove igre već imaš.");
        return;
      }

      // Spajanje, ne zamena: u ruci može već da stoji nešto od ranije.
      const novi = new Set(kesica.map((r) => r.id));
      setURuci((r) => [...r.filter((x) => !novi.has(x.id)), ...kesica]);
      setStanje((s) =>
        s.map((x): StavkaAlbuma => (novi.has(x.rec.id) ? { ...x, stanje: "u-ruci" } : x))
      );
      setNajava(`${STIGLO[oblikBroja(kesica.length)]}: ${kesica.length}. Tapni sličicu da je zalepiš.`);
    } catch {
      // Ništa nije izgubljeno: sličice su već zarađene u bazi i čekaju.
      setPoruka("greska-kesice");
      setNajava("Kesica se nije otvorila. Ništa nije izgubljeno, probaj ponovo.");
    } finally {
      uToku.current = false;
      setOtvaram(false);
    }
  }, [childId, lekcija.id]);

  /**
   * Kraj igre. `tacniRecIdovi` se namerno NE prosleđuje ruti: ruta sama zna šta
   * je dete zaradilo a nije videlo, jer je to već upisano posle svakog tačnog
   * odgovora. Isto se zove i kad dete izađe iz igre pre kraja, da mu ono što je
   * do tada zaradilo ne ostane zaključano iza nedovršene partije.
   */
  const naKrajIgre = useCallback(() => {
    setIgra(null);
    void otvoriKesicu();
  }, [otvoriKesicu]);

  /** Poziv ide u pozadini. Ne čeka se, i njegov pad se namerno guta. */
  const posaljiLepljenje = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      void fetch(`/api/zack/${childId}/zalepi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recIdovi }),
        // Dete često zatvori karticu čim zalepi. Bez ovoga pretraživač prekine
        // poziv u letu i sličica ostane u ruci do sledećeg puta.
        keepalive: true,
      }).catch(() => {
        /* Sličica je već isporučena u bazi, pa se ništa ne gubi. */
      });
    },
    [childId]
  );

  const zalepi = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      const skup = new Set(recIdovi);
      // Prvo se vidi, pa se onda šalje. Dete ne sme da čeka mrežu.
      setURuci((r) => r.filter((x) => !skup.has(x.id)));
      setStanje((s) =>
        s.map((x): StavkaAlbuma => (skup.has(x.rec.id) ? { ...x, stanje: "zalepljena" } : x))
      );
      setPoruka(null);
      posaljiLepljenje(recIdovi);
    },
    [posaljiLepljenje]
  );

  const { zalepljene, ukupno } = brojac(stanje);

  // ── Igra zauzima ceo ekran ────────────────────────────────────────────────
  if (igra) {
    return (
      <div>
        <Igra childId={childId} reci={reci} vrsta={igra} onKraj={naKrajIgre} />
        {/* Bez ovoga dete koje se zaglavi u igri nema izlaz osim dugmeta „nazad"
            u pretraživaču. Izlaz radi isto što i kraj partije, pa se zarađeno
            odmah pretvori u kesicu umesto da ostane da čeka.
            Parovi imaju svoje „Dosta za sad", pa im ovo ne treba: dva ista
            dugmeta jedno ispod drugog detetu izgledaju kao izbor koji mora da
            razume, a nije. */}
        {igra !== "parovi" && (
          <button
            type="button"
            onClick={naKrajIgre}
            className={`${FOKUS} font-heading mt-6 block min-h-[52px] w-full rounded-2xl border-2 text-[17px] font-bold`}
            style={{ background: "transparent", borderColor: IVICA, color: PRIGUSEN }}
          >
            Dosta za sad
          </button>
        )}
      </div>
    );
  }

  const imaPravilo = Boolean(lekcija.pravilo_tekst ?? lekcija.pravilo_naslov);
  // Bedž sa neotvorenom kesicom ima svoje dugme, pa dok se ona otvara i sam
  // kaže da se otvara. Kad bedža nema, čekanje mora da dobije svoju karticu,
  // inače dete posle odigrane igre nakratko gleda ekran na kom se ništa ne
  // dešava i pomisli da mu je trud propao.
  const bedzKesice = ceka > 0 && uRuci.length === 0;

  return (
    <div>
      {/* Sve što se dešava sa kesicom i lepljenjem stiže i do čitača ekrana. */}
      <p aria-live="polite" className="sr-only">
        {najava}
      </p>

      <p className="mb-4">
        <Link
          href={`/zack/${childId}`}
          className={`${FOKUS} font-heading inline-flex items-center gap-1.5 rounded-lg py-1 text-[15px] font-bold`}
          style={{ color: PRIGUSEN }}
        >
          <Strelica nazad />
          Sve lekcije
        </Link>
      </p>

      {/* ── Kesica je PRVO što dete vidi ────────────────────────────────────
          Iznad naslova, iznad svega. To je jedini razlog zbog kog se dete vraća
          sutradan, pa ne sme da bude pri dnu ekrana. */}
      {bedzKesice && (
        <section
          className="mb-6 rounded-2xl border-[3px] p-4"
          style={{ background: PAPIR, borderColor: ZUTA }}
        >
          <h2
            className="font-heading flex items-center gap-2 text-[19px] font-bold leading-tight"
            style={{ color: MASTILO }}
          >
            <span style={{ color: ZUTA }}>
              <Zvezdica velika />
            </span>
            {`${ceka} ${CEKA[oblikBroja(ceka)]}`}
          </h2>
          <p className="mt-1.5 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
            {/* Bez glagola u prošlom vremenu: „zaradio" i „zaradila" nisu isto,
                a ovo čitaju i devojčice i dečaci. */}
            Otvori kesicu da vidiš šta je unutra.
          </p>
          <button
            type="button"
            onClick={() => void otvoriKesicu()}
            disabled={otvaram}
            className={`${FOKUS} font-heading mt-3.5 block min-h-[60px] w-full rounded-2xl text-[19px] font-bold disabled:opacity-60 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
            style={{ background: MASTILO, color: "#FFFFFF" }}
          >
            {otvaram ? "Otvaram..." : "Otvori kesicu"}
          </button>
        </section>
      )}

      {otvaram && !bedzKesice && (
        <p
          className="font-heading mb-6 rounded-2xl border-[3px] p-4 text-center text-[18px] font-bold"
          style={{ background: PAPIR, borderColor: ZUTA, color: MASTILO }}
        >
          Otvaram kesicu...
        </p>
      )}

      {/* ── Sličice u ruci ──────────────────────────────────────────────────
          Stoje tu dok ih dete ne zalepi. Lepljenje jednu po jednu je zabavno
          prve nedelje, ali „zalepi sve" mora da postoji, jer je u petoj nedelji
          tapkanje po dvadeset sličica teret. */}
      {uRuci.length > 0 && (
        <section
          className="mb-6 rounded-2xl border-[3px] p-4"
          style={{ background: PAPIR, borderColor: CRVENA }}
        >
          <h2
            className="font-heading text-[19px] font-bold leading-tight"
            style={{ color: MASTILO }}
          >
            {`${uRuci.length} ${recSlicica(uRuci.length)} u ruci`}
          </h2>
          <p className="mt-1.5 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
            Tapni sličicu da je zalepiš u album.
          </p>

          <ul className="mt-4 grid grid-cols-3 gap-3">
            {uRuci.map((rec) => (
              <li key={rec.id}>
                <Slicica rec={rec} stanje="u-ruci" onClick={() => zalepi([rec.id])} />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => zalepi(uRuci.map((r) => r.id))}
            className={`${FOKUS} font-heading mt-4 block min-h-[56px] w-full rounded-2xl border-2 text-[17px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
            style={{ background: "transparent", borderColor: MASTILO, color: MASTILO }}
          >
            Zalepi sve
          </button>

          {ceka > 0 && (
            <p className="mt-3 text-center text-[14px] leading-snug" style={{ color: PRIGUSEN }}>
              {`Još ${ceka} ${CEKA[oblikBroja(ceka)]} u sledećoj kesici.`}
            </p>
          )}
        </section>
      )}

      {/* Prazna kesica i pad mreže. Ni jedno ni drugo ne sme da ostavi prazan
          ekran posle odigrane igre. */}
      {poruka === "prazna-kesica" && (
        <p
          className="mb-6 rounded-2xl border p-4 text-[16px] leading-relaxed"
          style={{ background: PAPIR, borderColor: IVICA, color: PRIGUSEN }}
        >
          U ovoj kesici nema novih sličica, sve reči iz te igre već imaš u albumu. Probaj neku
          drugu igru, tamo te možda čeka nešto novo.
        </p>
      )}

      {poruka === "greska-kesice" && (
        <section
          className="mb-6 rounded-2xl border-2 p-4"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <p className="text-[16px] leading-relaxed" style={{ color: MASTILO }}>
            Kesica se sad nije otvorila. Ništa nije izgubljeno, sve tvoje sličice te i dalje čekaju.
          </p>
          {/* Kad bedž stoji iznad, on već nosi dugme koje radi isto. Drugo
              dugme odmah ispod prvog detetu izgleda kao izbor, a nije. */}
          {!bedzKesice && (
            <button
              type="button"
              onClick={() => void otvoriKesicu()}
              disabled={otvaram}
              className={`${FOKUS} font-heading mt-3 block min-h-[52px] w-full rounded-2xl border-2 text-[17px] font-bold disabled:opacity-60`}
              style={{ background: "transparent", borderColor: MASTILO, color: MASTILO }}
            >
              {otvaram ? "Otvaram..." : "Probaj ponovo"}
            </button>
          )}
        </section>
      )}

      {/* ── Naslov i brojač ─────────────────────────────────────────────── */}
      <header className="mb-6">
        <p
          className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          {`Lekcija ${lekcija.broj}`}
        </p>
        <h1
          className="font-heading mt-1 text-[28px] font-bold leading-tight tracking-tight"
          style={{ color: MASTILO }}
        >
          {lekcija.naziv}
        </h1>

        {/* Brojač je jedini broj na ekranu koji sme da bude ovako krupan, i
            jedini koji i dete i roditelj razumeju iz prve. Živ je, jer raste u
            trenutku lepljenja. */}
        <p className="mt-3" aria-live="polite">
          <span className="sr-only">{`U albumu: ${zalepljene} od ${ukupno} ${recSlicica(ukupno)}`}</span>
          <span
            aria-hidden="true"
            className="font-heading flex flex-wrap items-baseline gap-x-2 tabular-nums"
          >
            <span className="text-[34px] font-bold leading-none" style={{ color: MASTILO }}>
              {zalepljene}
            </span>
            <span className="text-[17px] font-bold" style={{ color: PRIGUSEN }}>
              od
            </span>
            <span className="text-[34px] font-bold leading-none" style={{ color: MASTILO }}>
              {ukupno}
            </span>
            <span className="text-[17px] font-bold" style={{ color: PRIGUSEN }}>
              {recSlicica(ukupno)}
            </span>
          </span>
        </p>
      </header>

      {/* ── Podsetnik na pravilo ────────────────────────────────────────────
          Mirna kartica sa plavom ivicom sa strane, nikad veliki blok. Dete je
          došlo da igra, ne da čita. */}
      {imaPravilo && (
        <section
          className="mb-6 rounded-xl border border-l-4 py-3.5 pl-4 pr-4"
          style={{ background: PAPIR, borderColor: IVICA, borderLeftColor: PLAVA }}
        >
          {lekcija.pravilo_naslov && (
            <h2 className="font-heading text-[16px] font-bold leading-snug" style={{ color: MASTILO }}>
              {lekcija.pravilo_naslov}
            </h2>
          )}
          {lekcija.pravilo_tekst && (
            <p className="mt-1 text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
              {lekcija.pravilo_tekst}
            </p>
          )}
          {lekcija.pravilo_primer && (
            <p
              lang="de"
              className="font-heading mt-2 text-[16px] font-bold leading-snug"
              style={{ color: PLAVA }}
            >
              {lekcija.pravilo_primer}
            </p>
          )}
        </section>
      )}

      {/* ── Igre ─────────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2
          className="font-heading mb-3 text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          Igre
        </h2>
        {reci.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed p-5 text-center text-[15px] leading-relaxed"
            style={{ borderColor: IVICA, background: PAPIR, color: PRIGUSEN }}
          >
            U ovoj lekciji još nema reči, pa nema ni šta da se igra. Vrati se malo kasnije.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {IGRE.map((vrsta) => (
              <li key={vrsta}>
                <button
                  type="button"
                  onClick={() => {
                    setPoruka(null);
                    setIgra(vrsta);
                  }}
                  className={`${FOKUS} font-heading flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[18px] font-bold shadow-[0_2px_0_0_#DED8C8] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                  style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
                >
                  {NAZIVI[vrsta]}
                  <span style={{ color: PRIGUSEN }}>
                    <Strelica />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Album ────────────────────────────────────────────────────────── */}
      <section>
        <h2
          className="font-heading mb-3 text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          Album
        </h2>
        {stanje.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed p-5 text-center text-[15px] leading-relaxed"
            style={{ borderColor: IVICA, background: PAPIR, color: PRIGUSEN }}
          >
            Ovde će stajati tvoje sličice, čim lekcija dobije prve reči.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {stanje.map((s) => (
              <li key={s.rec.id}>
                {/* Reč koja je „u ruci" se ovde crta kao PRAZNO mesto. Album
                    ne sme da oda reč koju dete još nije zalepilo. */}
                <Slicica rec={s.rec} stanje={s.stanje === "u-ruci" ? "prazno" : s.stanje} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

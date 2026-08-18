"use client";

// Staza lekcija - polica sa albumima. Svaka kartica je korica jednog albuma:
// broj lekcije je nalepnica u boji, naziv je naslov korice, a jedini broj
// koji i dete i roditelj razumeju iz prve - koliko je sličica skupljeno od
// koliko ih ima - ostaje najkrupniji tekst na kartici, krupniji i od naziva,
// i namerno stoji umesto procenta tačnosti.
//
// Boje na polici drže se podele iz proizvoda: crvena je zack (nalepnica sa
// brojem, kao i znak), žuta je nagrada koja čeka (kesica), plava je pun album.
import Link from "next/link";
import {
  CRVENA,
  DISPLAY,
  IVICA,
  MASTILO,
  PAPIR,
  PLAVA,
  PRIGUSEN,
  ZUTA,
  ZackZnak,
} from "../Ukras";

export type StavkaStaze = {
  broj: number;
  naziv: string;
  zalepljene: number;
  ukupno: number;
  neotvorenaKesica: number;
};

/**
 * Broj u našem jeziku menja oblik imenice iza sebe: 1 sličica, 2 sličice,
 * 5 sličica. Brojevi od 11 do 14 su izuzetak i idu kao 5, ma koja im bila
 * poslednja cifra, pa se gleda i poslednja dvocifra.
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

const SLICICA: Record<Oblik, string> = {
  jedna: "sličica",
  dve: "sličice",
  pet: "sličica",
};

/** Sama imenica, bez broja: „1 sličica", „24 sličice", „25 sličica". */
function recSlicica(n: number): string {
  return SLICICA[oblikBroja(n)];
}

const KESICA: Record<Oblik, string> = {
  jedna: "nova sličica te čeka",
  dve: "nove sličice te čekaju",
  pet: "novih sličica te čeka",
};

/** Cela poruka bedža, jer se uz imenicu menja i glagol. */
function porukaKesice(n: number): string {
  return `${n} ${KESICA[oblikBroja(n)]}`;
}

const DAN: Record<Oblik, string> = {
  jedna: "dan",
  dve: "dana",
  pet: "dana",
};

/** Sama imenica, bez broja: „1 dan", „2 dana", „11 dana", „21 dan". */
function recDan(n: number): string {
  return DAN[oblikBroja(n)];
}

/**
 * Niz se prikazuje tek od 2 dana naviše. „1 dan zaredom" nije dostignuće nego
 * šum, a niz od 0 je stanje koje dete uopšte ne treba da vidi.
 */
const NIZ_OD = 2;

function Zvezdica() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] flex-none" fill="currentColor">
      <path d="M12 2.2l2.7 6.3 6.8.6-5.1 4.5 1.5 6.6L12 16.7 6.1 20.2l1.5-6.6L2.5 9.1l6.8-.6z" />
    </svg>
  );
}

function Kvacica() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.8l5.2 5.2L20 6.5" />
    </svg>
  );
}

function Strelica() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Kartica({
  childId,
  lekcija,
  redni,
}: {
  childId: string;
  lekcija: StavkaStaze;
  redni: number;
}) {
  const { broj, naziv, zalepljene, ukupno, neotvorenaKesica } = lekcija;
  const puna = ukupno > 0 && zalepljene === ukupno;
  const cekaKesica = neotvorenaKesica > 0;
  const popunjeno = ukupno > 0 ? Math.round((zalepljene / ukupno) * 100) : 0;
  // Nagib nalepnice sa brojem: iz rednog broja, nikad iz slučajnog, da polica
  // ne poskakuje pri svakom osvežavanju. Pun album stoji pravo - sređen je.
  const ugao = puna ? 0 : broj % 2 === 0 ? 2 : -2;

  return (
    <Link
      href={`/zack/${childId}/lekcija/${broj}`}
      // Kesica podiže celu karticu, ne samo bedž, da se u dugačkom spisku vidi
      // odmah koja lekcija zove. Ivica je uz to i deblja, pa se razlika ne
      // oslanja samo na boju.
      className={`block rounded-2xl p-4 shadow-[0_3px_0_0_#DED8C8] outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985] ${
        cekaKesica ? "border-[3px] border-[#FFC400]" : "border border-[#DED8C8]"
      }`}
      style={{ background: PAPIR }}
    >
      <div className="flex items-center gap-3.5">
        {/* Broj lekcije kao nalepnica na korici: crvena kao znak, bela ivica,
            blag nagib. Pun album je zalepi u plavo i ispravi, a da razlika ne
            ostane samo u boji, ispod stoji i napisano da je album pun. */}
        <span
          aria-hidden="true"
          className="zack-zalepi flex h-14 w-14 flex-none items-center justify-center rounded-xl border-[3px] text-[24px] tabular-nums shadow-[0_2px_5px_rgba(22,22,26,0.2)]"
          style={{
            background: puna ? PLAVA : CRVENA,
            borderColor: "#FFFFFF",
            color: "#FFFFFF",
            fontFamily: DISPLAY,
            transform: `rotate(${ugao}deg)`,
            ["--zack-r" as string]: `${ugao}deg`,
            ["--zack-kasni" as string]: `${redni * 70}ms`,
          }}
        >
          {broj}
        </span>
        <span className="min-w-0 flex-1">
          <span className="sr-only">{`Lekcija ${broj}, `}</span>
          <span
            className="block text-[17px] leading-tight"
            style={{ color: MASTILO, fontFamily: DISPLAY }}
          >
            {naziv}
          </span>
        </span>
        <span style={{ color: PRIGUSEN }}>
          <Strelica />
        </span>
      </div>

      {/* Brojač. Jedini broj koji na ovom ekranu sme da bude ovako krupan. */}
      <p className="mt-3.5">
        <span className="sr-only">{`${zalepljene} od ${ukupno} ${recSlicica(ukupno)}`}</span>
        <span aria-hidden="true" className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="text-[32px] leading-none" style={{ color: MASTILO, fontFamily: DISPLAY }}>
            {zalepljene}
          </span>
          <span className="font-heading text-[17px] font-bold" style={{ color: PRIGUSEN }}>
            od
          </span>
          <span className="text-[32px] leading-none" style={{ color: MASTILO, fontFamily: DISPLAY }}>
            {ukupno}
          </span>
          <span className="font-heading text-[17px] font-bold" style={{ color: PRIGUSEN }}>
            {recSlicica(ukupno)}
          </span>
        </span>
      </p>

      <span
        aria-hidden="true"
        className="mt-2.5 block h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "#E7E1D1" }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${popunjeno}%`, background: puna ? PLAVA : MASTILO }}
        />
      </span>

      {puna && (
        <span
          className="font-heading mt-3 inline-flex items-center gap-1.5 text-[15px] font-bold"
          style={{ color: PLAVA }}
        >
          <Kvacica />
          Album je pun
        </span>
      )}

      {cekaKesica && (
        <span
          className="font-heading mt-3 inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-white px-3.5 py-2 text-[15px] font-bold shadow-[0_2px_5px_rgba(22,22,26,0.15)]"
          style={{ background: ZUTA, color: MASTILO }}
        >
          <Zvezdica />
          {porukaKesice(neotvorenaKesica)}
        </span>
      )}
    </Link>
  );
}

export default function StazaClient({
  childId,
  ime,
  niz,
  lekcije,
}: {
  childId: string;
  ime: string;
  niz: number;
  lekcije: StavkaStaze[];
}) {
  return (
    <div>
      <header className="mb-6">
        <p className="flex items-center gap-2.5">
          <ZackZnak velicina="sm" />
          <span
            className="text-[12px] uppercase tracking-[.18em]"
            style={{ color: PRIGUSEN, fontFamily: DISPLAY }}
          >
            Tvoji albumi
          </span>
        </p>
        {/* Ime na žutoj nalepnici: to je detetov album, pa mu ime stoji na
            korici police - kao kad se flomasterom potpišeš na svoje. */}
        <h1
          className="mt-3 text-[28px] leading-tight tracking-tight"
          style={{ color: MASTILO, fontFamily: DISPLAY }}
        >
          Zdravo,{" "}
          <span
            className="mt-1 inline-block -rotate-1 rounded-lg border-[3px] border-white px-2.5 py-0.5 shadow-[0_2px_6px_rgba(22,22,26,0.18)]"
            style={{ background: ZUTA, color: MASTILO }}
          >
            {ime}
          </span>
        </h1>
        {/* Niz stoji uz pozdrav, prigušeno, u istom redu misli kao i ime. To je
            konstatacija, ne trofej: bez plamena, bez crvene, bez uzvičnika.
            Kad se niz prekine, ovaj red prosto nestane i vrati se kad opet bude
            imao šta da kaže. Nigde nema traga da je nečega bilo pa nema, jer se
            niz kvari sam od sebe, bez ijedne detetove greške. */}
        {niz >= NIZ_OD && (
          <p className="mt-2 text-[15px]" style={{ color: PRIGUSEN }}>
            {`${niz} ${recDan(niz)} zaredom`}
          </p>
        )}
      </header>

      {lekcije.length === 0 ? (
        <p
          className="rounded-2xl border border-dashed p-6 text-center text-[16px] leading-relaxed"
          style={{ borderColor: IVICA, background: PAPIR, color: PRIGUSEN }}
        >
          Ovde još nema nijedne lekcije. Čim tvoj udžbenik dobije prvu, naći ćeš je baš na ovom
          mestu.
        </p>
      ) : (
        <ol className="space-y-3.5">
          {lekcije.map((lekcija, i) => (
            <li key={lekcija.broj}>
              <Kartica childId={childId} lekcija={lekcija} redni={i} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

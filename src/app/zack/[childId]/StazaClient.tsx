"use client";

// Staza lekcija. Na ovom ekranu postoji tačno jedan broj koji i dete i
// roditelj razumeju iz prve: koliko je sličica skupljeno od koliko ih ima.
// Zato je taj brojač najkrupniji tekst na kartici, krupniji i od naziva
// lekcije, i namerno stoji umesto procenta tačnosti.
import Link from "next/link";

export type StavkaStaze = {
  broj: number;
  naziv: string;
  zalepljene: number;
  ukupno: number;
  neotvorenaKesica: number;
};

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";
const ZUTA = "#FFC400";

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

function Kartica({ childId, lekcija }: { childId: string; lekcija: StavkaStaze }) {
  const { broj, naziv, zalepljene, ukupno, neotvorenaKesica } = lekcija;
  const puna = ukupno > 0 && zalepljene === ukupno;
  const cekaKesica = neotvorenaKesica > 0;
  const popunjeno = ukupno > 0 ? Math.round((zalepljene / ukupno) * 100) : 0;

  return (
    <Link
      href={`/zack/${childId}/lekcija/${broj}`}
      // Kesica podiže celu karticu, ne samo bedž, da se u dugačkom spisku vidi
      // odmah koja lekcija zove. Ivica je uz to i deblja, pa se razlika ne
      // oslanja samo na boju.
      className={`block rounded-2xl p-4 shadow-[0_2px_0_0_#DED8C8] outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985] ${
        cekaKesica ? "border-[3px] border-[#FFC400]" : "border border-[#DED8C8]"
      }`}
      style={{ background: PAPIR }}
    >
      <div className="flex items-center gap-3.5">
        {/* Broj lekcije je oznaka, ne junak ekrana. Dok album nije pun stoji
            tiho, u papiru, da ne bi otimao pogled brojaču ispod. Pun album ga
            oboji u plavo, a da razlika ne ostane samo u boji, ispod stoji i
            napisano da je album pun. */}
        <span
          aria-hidden="true"
          className="font-heading flex h-14 w-14 flex-none items-center justify-center rounded-xl border-2 text-[22px] font-bold tabular-nums"
          style={
            puna
              ? { background: PLAVA, borderColor: PLAVA, color: "#FFFFFF" }
              : { background: "#F4F1E9", borderColor: IVICA, color: MASTILO }
          }
        >
          {broj}
        </span>
        <span className="min-w-0 flex-1">
          <span className="sr-only">{`Lekcija ${broj}, `}</span>
          <span className="font-heading block text-[17px] font-bold leading-tight" style={{ color: MASTILO }}>
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
        <span aria-hidden="true" className="font-heading flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="text-[32px] font-bold leading-none" style={{ color: MASTILO }}>
            {zalepljene}
          </span>
          <span className="text-[17px] font-bold" style={{ color: PRIGUSEN }}>
            od
          </span>
          <span className="text-[32px] font-bold leading-none" style={{ color: MASTILO }}>
            {ukupno}
          </span>
          <span className="text-[17px] font-bold" style={{ color: PRIGUSEN }}>
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
          className="font-heading mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[15px] font-bold"
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
        <p
          className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          Tvoji albumi
        </p>
        <h1
          className="font-heading mt-1 text-[30px] font-bold leading-tight tracking-tight"
          style={{ color: MASTILO }}
        >
          Zdravo, {ime}
        </h1>
        {/* Niz stoji uz pozdrav, prigušeno, u istom redu misli kao i ime. To je
            konstatacija, ne trofej: bez plamena, bez crvene, bez uzvičnika.
            Kad se niz prekine, ovaj red prosto nestane i vrati se kad opet bude
            imao šta da kaže. Nigde nema traga da je nečega bilo pa nema, jer se
            niz kvari sam od sebe, bez ijedne detetove greške. */}
        {niz >= NIZ_OD && (
          <p className="mt-1.5 text-[15px]" style={{ color: PRIGUSEN }}>
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
          {lekcije.map((lekcija) => (
            <li key={lekcija.broj}>
              <Kartica childId={childId} lekcija={lekcija} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

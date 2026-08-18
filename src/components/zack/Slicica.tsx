"use client";

// Sličica je najvidljiviji element celog zack-a. Pojavljuje se u desetinama
// primeraka na svakom ekranu, pa je namerno bez ijednog stanja i bez ijednog
// efekta: sve što se vidi izvedeno je iz reči i iz stanja koje stigne odozgo.
import { bojaZaRod, type Rec } from "@/lib/zack/rec";
import type { Stanje } from "@/lib/zack/album";

const PAPIR = "#FCFBF7";
const IVICA_PAPIRA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";

// Slova prate širinu same sličice, ne širinu ekrana, jer se ista sličica
// pojavljuje i u gustoj mreži albuma i sama na sredini ekrana posle kesice.
// Donja granica je namerno visoka: reč je glavni tekst i mora da ostane krupna
// da bi bela slova na jakim bojama i dalje imala dovoljan kontrast.
const REC_FONT = "clamp(1.05rem, 13cqw, 1.75rem)";
const SITAN_FONT = "clamp(0.68rem, 7cqw, 0.95rem)";
const BROJ_FONT = "clamp(0.6rem, 6cqw, 0.85rem)";

/** Sjaj ide ISKLJUČIVO na izuzetke. Nikad ni na šta drugo. */
const SJAJ =
  "linear-gradient(118deg,#FF9ECF 0%,#B98CFF 22%,#7FE8E0 46%,#FFE08A 68%,#FF9ECF 100%)";

/**
 * Nagib se izvodi iz rednog broja, nikad iz slučajnog broja. Da je slučajan,
 * ista sličica bi poskakivala pri svakom osvežavanju stranice.
 */
export function ugaoZaBroj(redniBroj: number): number {
  const smer = redniBroj % 2 === 0 ? 1 : -1;
  const jacina = 1 + (Math.abs(redniBroj) % 3) * 0.5;
  return smer * jacina;
}

function dvocifren(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Član se prikazuje odvojeno od reči, pa se rod vidi i kad je sličica sjajna i
 * boja roda ustupi mesto prelivu. Ako je član već otkucan u nemačkom obliku,
 * ne ponavlja se.
 */
function podeliOblik(rec: Rec): { clan: string | null; oblik: string } {
  if (rec.rod === "nema") return { clan: null, oblik: rec.de };
  const pocetak = `${rec.rod} `;
  if (rec.de.toLowerCase().startsWith(pocetak)) {
    return { clan: rec.rod, oblik: rec.de.slice(pocetak.length) };
  }
  return { clan: rec.rod, oblik: rec.de };
}

function opisZaCitac(rec: Rec, stanje: Stanje): string {
  if (stanje === "prazno") return `Prazno mesto ${dvocifren(rec.redni_broj)}`;
  const { clan, oblik } = podeliOblik(rec);
  const pun = clan ? `${clan} ${oblik}` : oblik;
  if (stanje === "u-ruci") return `Zalepi sličicu ${pun}`;
  if (stanje === "izbledela") return `Izbledela sličica ${pun}`;
  return `Sličica ${pun}`;
}

function Zvezdica() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1em] w-[1em]" aria-hidden="true">
      <path
        d="M12 2.5l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.2 20.1l1.5-6.5-5-4.4 6.6-.6z"
        fill={MASTILO}
      />
    </svg>
  );
}

export default function Slicica({
  rec,
  stanje,
  onClick,
}: {
  rec: Rec;
  stanje: Stanje;
  onClick?: () => void;
}) {
  const broj = dvocifren(rec.redni_broj);
  const opis = opisZaCitac(rec, stanje);
  const interaktivna = typeof onClick === "function";

  // Prazno mesto stoji ravno na papiru, kao odštampan okvir. Nagiba se samo ono
  // što je zaista zalepljeno ili se drži u ruci.
  const ugao = stanje === "prazno" ? 0 : ugaoZaBroj(rec.redni_broj) * (stanje === "u-ruci" ? 2.4 : 1);

  const spoljni = [
    "block w-full aspect-[3/4] rounded-[14px] text-left",
    interaktivna
      ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161A]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sadrzaj =
    stanje === "prazno" ? (
      <PraznoMesto broj={broj} />
    ) : (
      <PunaSlicica rec={rec} stanje={stanje} broj={broj} interaktivna={interaktivna} />
    );

  const stil = { rotate: `${ugao}deg`, containerType: "inline-size" as const };

  if (interaktivna) {
    return (
      <button type="button" onClick={onClick} className={`group ${spoljni}`} style={stil}>
        <span className="sr-only">{opis}</span>
        {sadrzaj}
      </button>
    );
  }

  return (
    <div className={spoljni} style={stil}>
      <span className="sr-only">{opis}</span>
      {sadrzaj}
    </div>
  );
}

/**
 * Prazno mesto NE SME da otkrije ni nemačku reč ni prevod. To je reč koju dete
 * tek treba da zaradi, i ako se ispiše, ceo album gubi smisao.
 */
function PraznoMesto({ broj }: { broj: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full w-full items-center justify-center rounded-[14px] border-2 border-dashed"
      style={{ borderColor: IVICA_PAPIRA, background: PAPIR }}
    >
      <span
        className="absolute left-[6%] top-[4%] font-semibold tabular-nums"
        style={{ color: PRIGUSEN, fontSize: BROJ_FONT }}
      >
        {broj}
      </span>
      <span
        className="font-heading font-bold"
        style={{ color: "#C4BCA6", fontSize: "clamp(1.5rem, 26cqw, 4rem)" }}
      >
        ?
      </span>
    </div>
  );
}

function PunaSlicica({
  rec,
  stanje,
  broj,
  interaktivna,
}: {
  rec: Rec;
  stanje: Stanje;
  broj: string;
  interaktivna: boolean;
}) {
  const { clan, oblik } = podeliOblik(rec);

  // Na žutoj i na prelivu bela slova se ne vide, pa idu tamna.
  const tamnaSlova = rec.izuzetak || rec.rod === "das";
  const bojaSlova = tamnaSlova ? MASTILO : "#FFFFFF";
  const pozadina = rec.izuzetak ? SJAJ : bojaZaRod(rec.rod);

  const uRuci = stanje === "u-ruci";
  const izbledela = stanje === "izbledela";

  const senka = uRuci
    ? "0 14px 22px -8px rgba(22,22,26,0.45), 0 3px 6px rgba(22,22,26,0.18)"
    : "0 1px 2px rgba(22,22,26,0.16)";

  const pokret = interaktivna
    ? "transition-transform duration-150 group-hover:-translate-y-1 group-active:translate-y-0 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
    : "";

  return (
    <div
      aria-hidden="true"
      className={`h-full w-full rounded-[14px] p-[5px] ${uRuci ? "scale-[1.03]" : ""} ${pokret}`}
      style={{
        background: "#FFFFFF",
        boxShadow: senka,
        // Izbledela je samo izbledeo papir, ne greška i ne kazna: ista sličica,
        // slabije boje. Nema sivila do kraja, nema precrtavanja.
        opacity: izbledela ? 0.72 : 1,
        // Sepia i malo svetlosti guraju izbledelu ka požutelom papiru, umesto ka
        // sivom „isključeno“. Bez toga mastilo posivi i sličica liči na kaznu.
        filter: izbledela ? "saturate(0.5) sepia(0.14) brightness(1.06)" : undefined,
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[10px]">
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-[6%] py-[6%]"
          style={{ background: pozadina }}
        >
          <span
            className="absolute left-[5%] top-[4%] rounded-full px-1.5 py-px font-semibold tabular-nums"
            style={{ background: PAPIR, color: PRIGUSEN, fontSize: BROJ_FONT }}
          >
            {broj}
          </span>
          {rec.izuzetak && (
            <span
              className="absolute right-[5%] top-[4%] flex items-center justify-center rounded-full p-1"
              style={{ background: PAPIR, fontSize: BROJ_FONT }}
            >
              <Zvezdica />
            </span>
          )}
          <span className="flex w-full min-w-0 flex-col items-center justify-center gap-[5%]">
            {/* Slika stoji SAMO ovde, na sličici. Nikad u pitanju, jer bi dete
                onda pokazivalo na sliku umesto da prevodi.
                Papirni krug ispod nje je nužan: ikonice su šarene i na plavoj,
                crvenoj i žutoj se gube. Reč koja nema sliku nije nedovršena,
                nego prosto nema sliku - to je normalno stanje za glagole i
                apstraktne reči, pa se ništa ne rezerviše unapred.
                alt je prazan namerno: prevod već stoji ispod, pa bi čitač
                ekrana inače dvaput rekao istu stvar. */}
            {rec.ikonica && (
              <span
                className="flex items-center justify-center rounded-full"
                style={{ background: PAPIR, padding: "5%", width: "44%", aspectRatio: "1" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/zack/ikonice/${rec.ikonica}.svg`}
                  alt=""
                  className="h-full w-full"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            )}
            <span lang="de" className="flex w-full min-w-0 flex-col items-center">
              {/* Član stoji uz nemačku reč, ne uz prevod - „die Mama", nikad
                  „die mama". Zbog sjajnih sličica, gde preliv proguta boju
                  roda, član mora da bude ispisan, i zato živi baš ovde. */}
              {clan && (
                <span
                  className="font-bold leading-none"
                  style={{ color: bojaSlova, fontSize: SITAN_FONT, opacity: 0.85 }}
                >
                  {clan}
                </span>
              )}
              <span
                className="font-heading w-full min-w-0 text-center font-bold leading-tight hyphens-auto [overflow-wrap:anywhere]"
                style={{ color: bojaSlova, fontSize: REC_FONT }}
              >
                {oblik}
              </span>
            </span>
          </span>
        </div>
        {/* Prelama se po rečima, ne nasred reči, da se „nastavnica" ne pocepa
            na „nastavni" i „ca". */}
        <div
          className="flex shrink-0 flex-wrap items-baseline gap-x-1 px-[6%] py-[4%]"
          style={{ background: PAPIR, borderTop: `1px solid ${IVICA_PAPIRA}` }}
        >
          {/* Prevod se NE seče. On je jedino mesto gde piše šta reč znači, pa
              „nastavnica" odsečena u „nastav..." obesmišljava celu sličicu.
              Radije dva reda nego tri tačke. */}
          <span
            className="leading-tight break-words"
            style={{ color: PRIGUSEN, fontSize: SITAN_FONT }}
          >
            {rec.sr}
          </span>
        </div>
      </div>
    </div>
  );
}

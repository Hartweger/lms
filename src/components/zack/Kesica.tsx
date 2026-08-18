// Kesica sa sličicama kao lik sa tri stanja. Čista ilustracija, nacrtana u
// CSS-u i SVG-u bez ijedne slike sa strane: sve je aria-hidden, a značenje
// nose tekstovi koji stoje pored nje.
//
// - „zatvorena": pun crveni paketić sa debelom belom ivicom, zapečaćen mini
//   zack! nalepnicom, a iz vrha viri ćošak jedne sličice - da se vidi da
//   unutra nešto čeka. Blago se zanjiše na učitavanju i na prelaz mišem,
//   isključivo uz no-preference.
// - „otvara-se": pečat pukne i vrh se pocepa po nazubljenoj ivici. Cela
//   animacija stane u 600ms; uz reduced-motion stanje se samo promeni.
// - „prazna": otvoren, spljošten paketić - pocepan vrh, bez pečata, bez tuge.
//   Šta to znači detetu piše ekran lekcije, ne kesica sama.
//
// Ćošak sličice koji viri je poleđina (karton), ne reč: žuta ovde ne sme da
// slaže o rodu, jer nijedna reč na njoj ne piše - ista dozvola po kojoj i
// vinjete igara koriste jednu boju za prazan karton.

import { CRVENA_SENKA, CRVENA_ZNAK, DISPLAY, ZUTA } from "@/app/zack/Ukras";

export type StanjeKesice = "zatvorena" | "otvara-se" | "prazna";

/**
 * Nazubljena pocepana ivica kesice: trouglići celom širinom. Crta se jednom,
 * ovde, a u SVG-u se samo razvuče preko cele širine (viewBox "0 0 100 6",
 * preserveAspectRatio="none"). Istu putanju koristi i veliki panel kesice.
 */
export const CIK_CAK = (() => {
  let d = "M0 0H100V2";
  for (let x = 98; x >= 2; x -= 4) d += `L${x} 6L${x - 2} 2`;
  return `${d}Z`;
})();

// Sav pokret živi SAMO unutar no-preference. Van njega kesica mirno stoji u
// konačnoj pozi svakog stanja: pečat je van animacije sakriven osnovnim
// pravilom, pa „otvara-se" i bez pokreta izgleda kao pocepana kesica.
const STIL = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes zkes-njise {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  /* Iste vrednosti pod drugim imenom: završena ulazna animacija ne može
     ponovo da se pokrene istim imenom, pa prelaz mišem dobija svoje. */
  @keyframes zkes-njise-jos {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  .zkes-njise { animation: zkes-njise 1.5s ease-in-out 2; transform-origin: 50% 10%; }
  .zkes-lik:hover .zkes-njise { animation: zkes-njise-jos 1.5s ease-in-out infinite; }
  @keyframes zkes-pukne {
    0% { opacity: 1; transform: translateX(-50%) rotate(-7deg) scale(1); }
    55% { opacity: 1; transform: translate(-50%, -4px) rotate(4deg) scale(1.35); }
    100% { opacity: 0; transform: translate(-50%, -11px) rotate(12deg) scale(1.6); }
  }
  .zkes-pecat-puca { animation: zkes-pukne 0.28s ease-out both; }
  @keyframes zkes-cepa {
    0% { transform: rotate(0deg); }
    30% { transform: rotate(-2.4deg); }
    65% { transform: rotate(1.6deg); }
    100% { transform: rotate(0deg); }
  }
  .zkes-cepa { animation: zkes-cepa 0.3s ease-out 0.24s both; }
  @keyframes zkes-viri {
    0% { transform: rotate(-12deg) translateY(0); }
    100% { transform: rotate(-12deg) translateY(-5px); }
  }
  .zkes-viri-gore { animation: zkes-viri 0.3s ease-out 0.24s both; }
}
.zkes-pecat-puca { opacity: 0; }
`;

export default function Kesica({ stanje }: { stanje: StanjeKesice }) {
  const prazna = stanje === "prazna";
  const otvara = stanje === "otvara-se";
  const pocepana = prazna || otvara;

  return (
    <span
      aria-hidden="true"
      className="zkes-lik relative block flex-none"
      style={{ width: prazna ? 92 : 76, height: prazna ? 56 : 92 }}
    >
      <style>{STIL}</style>
      <span
        className={`relative block h-full w-full ${stanje === "zatvorena" ? "zkes-njise" : ""} ${prazna ? "-rotate-2" : ""}`}
      >
        {/* Ćošak sličice koji viri iz vrha. Donji deo mu pokrije telo, pa se
            vidi baš onoliko koliko treba da se zna da unutra nešto čeka. */}
        {!prazna && (
          <span
            className={`absolute left-[8px] top-0 block aspect-[3/4] w-[32px] rounded-[8px] border-[3px] shadow-[0_1px_3px_rgba(22,22,26,0.25)] ${otvara ? "zkes-viri-gore" : ""}`}
            style={{ background: ZUTA, borderColor: "#FFFFFF", transform: "rotate(-12deg)" }}
          />
        )}
        {/* Telo paketića: ista gramatika kao veliki panel - crvena površina,
            debela bela ivica, a kad je pocepan, nazubljena senka po vrhu. */}
        <span
          className={`absolute inset-x-0 bottom-0 block overflow-hidden rounded-xl border-[3px] shadow-[0_3px_8px_rgba(22,22,26,0.28)] ${otvara ? "zkes-cepa" : ""}`}
          style={{ top: prazna ? 0 : 17, background: CRVENA_ZNAK, borderColor: "#FFFFFF" }}
        >
          {pocepana && (
            <svg
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-0 h-2 w-full"
            >
              <path d={CIK_CAK} fill={CRVENA_SENKA} />
            </svg>
          )}
          {/* Nabor preko sredine: prazna kesica je spljoštena, ne samo kraća. */}
          {prazna && (
            <span
              className="absolute inset-x-2 top-1/2 block h-[3px] rounded-full"
              style={{ background: CRVENA_SENKA, opacity: 0.55 }}
            />
          )}
        </span>
        {/* Pečat: mini zack! nalepnica preko vrha. Kad kesica puca, pukne i
            on; van animacije ga krije osnovno pravilo u STIL-u. */}
        {!prazna && (
          <span
            className={`absolute left-1/2 top-[7px] block rounded-md border-2 px-1.5 py-0.5 shadow-[0_2px_5px_rgba(22,22,26,0.3)] ${otvara ? "zkes-pecat-puca" : ""}`}
            style={{
              background: CRVENA_ZNAK,
              borderColor: "#FFFFFF",
              transform: "translateX(-50%) rotate(-7deg)",
            }}
          >
            <span className="block text-[11px] leading-tight text-white" style={{ fontFamily: DISPLAY }}>
              zack!
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

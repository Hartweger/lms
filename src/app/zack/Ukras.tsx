// Ukrasni rečnik zack ulaznih ekrana: nalepnica-znak, mini-sličice i
// registarska tablica za kod. Čista prezentacija, bez ijednog stanja - zato
// sme da se uvozi i u serverske i u klijentske komponente.
//
// Boje ovde NOSE ZNAČENJE iz proizvoda: crvena je die, plava der, zelena das,
// a žuta množina - prava učionička konvencija iz nemačkih udžbenika. Kad se
// boje roda koriste kao ukras, koriste se sve tri zajedno (album u kom ima
// svakakvih reči), nikad jedna sama da ne bi lagala o rodu.

import { ROD_BOJA } from "@/lib/zack/rec";

export const PAPIR = "#FCFBF7";
export const PODLOGA = "#F4F1E9";
export const IVICA = "#DED8C8";
export const PRIGUSEN = "#6E6A5E";
export const MASTILO = "#16161A";
export const PLAVA = "#0B54C9";
// Žuta znači množinu, a kao nagrada (kesica, nalepnica sa imenom, promo
// nalepnice) sme svuda - ali NIKAD ne znači rod.
export const ZUTA = "#FFC400";
// Das zelena iz izvora istine, da se ukrasi nikad ne raziđu sa sličicama.
export const ZELENA_DAS = ROD_BOJA.das;
// Crvena znaka je brend (#E5342A), ali belom tekstu daje samo 4.3:1. Zato sve
// što nosi beli tekst (dugmad, nalepnice sa brojem) stoji na za nijansu
// tamnijoj crvenoj: #D6291F daje izmerenih 5.0:1 i oku je ista boja.
export const CRVENA_ZNAK = "#E5342A";
export const CRVENA = "#D6291F";
// Tamnija stopa ispod crvenog dugmeta, da dugme deluje kao debela nalepnica.
export const CRVENA_SENKA = "#8F1B14";
export const GRESKA = "#B3261E";
export const ZELENA = "#1B6E3C";

// Display slovo dolazi iz layout-a dečjeg dela (--font-zack, Archivo Black).
export const DISPLAY = "var(--font-zack), var(--font-heading), system-ui, sans-serif";

/** Sjajni preliv - REZERVISAN za izuzetke; ovde sme na tačno jednu mini-sličicu. */
export const SJAJ =
  "linear-gradient(118deg,#FF9ECF 0%,#B98CFF 22%,#7FE8E0 46%,#FFE08A 68%,#FF9ECF 100%)";

/**
 * Znak: reč zack! na crvenoj nalepnici sa debelom belom ivicom, blago
 * iskošena. Isti crtež kao ikonica.svg, samo u HTML-u da bi slovo bilo pravi
 * Archivo Black. Wordmark je logotip, pa sme da ostane na brend crvenoj.
 */
export function ZackZnak({ velicina = "md" }: { velicina?: "sm" | "md" | "lg" }) {
  const mere = {
    sm: { font: "text-[17px]", pad: "px-2.5 py-0.5", ivica: "border-[3px]", radius: "rounded-lg" },
    md: { font: "text-[26px]", pad: "px-3.5 py-1", ivica: "border-4", radius: "rounded-xl" },
    lg: { font: "text-[44px]", pad: "px-6 py-2", ivica: "border-[6px]", radius: "rounded-2xl" },
  }[velicina];
  return (
    <span
      className={`inline-block -rotate-2 ${mere.pad} ${mere.ivica} ${mere.radius} shadow-[0_3px_10px_rgba(22,22,26,0.25)]`}
      style={{ background: CRVENA_ZNAK, borderColor: "#FFFFFF" }}
    >
      <span
        className={`block ${mere.font} leading-tight tracking-tight text-white`}
        style={{ fontFamily: DISPLAY }}
      >
        zack!
      </span>
    </span>
  );
}

/**
 * Ukrasna mini-sličica: 3:4, bela ivica, nagib, senka - ista gramatika kao
 * prave sličice iz albuma, samo prazna i uvek aria-hidden preko roditelja.
 */
export function MiniSlicica({
  boja,
  ugao,
  sirina,
  kasni = 0,
  ikonica,
}: {
  boja: string;
  ugao: number;
  sirina: number;
  kasni?: number;
  ikonica?: string;
}) {
  return (
    <span
      className="zack-zalepi block aspect-[3/4] rounded-[10px] border-[3px] shadow-[0_2px_6px_rgba(22,22,26,0.22)]"
      style={{
        width: `${sirina}px`,
        background: boja,
        borderColor: "#FFFFFF",
        transform: `rotate(${ugao}deg)`,
        ["--zack-r" as string]: `${ugao}deg`,
        ["--zack-kasni" as string]: `${kasni}ms`,
      }}
    >
      {ikonica ? (
        /* eslint-disable-next-line @next/next/no-img-element -- sitan lokalni
           svg ukras; next/image bi mu samo dodao obradu koja ničemu ne služi */
        <img src={ikonica} alt="" className="h-full w-full p-1.5" />
      ) : null}
    </span>
  );
}

/**
 * Kod deteta kao registarska tablica: plava pločica sa z! napred, pa krupan
 * kod na belom. Ista slika i na roditeljskoj kartici i na dečjoj prijavi, da
 * dete prepozna „to je ono što mi je roditelj prepisao".
 */
export function TablicaOkvir({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex items-stretch overflow-hidden rounded-xl border-[3px] bg-white ${className}`}
      style={{ borderColor: MASTILO }}
    >
      <span
        aria-hidden="true"
        className="flex w-9 flex-none items-center justify-center"
        style={{ background: PLAVA }}
      >
        <span className="text-[15px] text-white" style={{ fontFamily: DISPLAY }}>
          z!
        </span>
      </span>
      {children}
    </span>
  );
}

/**
 * Uski stub aplikacije: kolona koju su ulazni ekrani, staza i lekcija nosili
 * kroz raspored dok landing nije stigao. Landing za roditelje traži sekcije
 * pune širine, pa raspored više ne sme da steže svu decu - svaka aplikaciona
 * stranica sad sama oblači ovaj stub, piksel za piksel isti kao pre.
 */
export function UskiStub({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>;
}

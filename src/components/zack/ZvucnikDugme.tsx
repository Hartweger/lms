"use client";

// Dugme „Čuj" - reč se izgovara glasom samog telefona.
//
// GDE SME DA STOJI: SAMO NA KARTICI ZA UČENJE
// -------------------------------------------
// Ovo dugme ne ide ni u jednu igru i ne ide na sličicu u albumu. Zvuk pored
// pitanja pretvara učenje čitanja u pogađanje po sluhu, a u Diktatu bi
// otvoreno izdiktirao tačan odgovor. Isto pravilo po kome slika stoji samo na
// sličici, nikad u pitanju. Na kartici pitanja nema: tu dete reč vidi prvi put,
// pa je izgovor deo onoga što uči.
//
// TIŠINA JE BOLJA OD POGREŠNOG IZGOVORA
// -------------------------------------
// Kad telefon nema nemački glas, dugmeta nema. Ne sivo dugme, ne poruka, ne
// čitanje engleskim glasom - ništa. Pogrešan izgovor bi se učio kao tačan, a
// dete koje dugme nikad nije ni videlo ništa ne gubi.

import { useEffect, useRef, useState } from "react";
import { useNemackiGlas } from "@/lib/zack/glas";

// Papir, ne gejmerski ekran. Iste vrednosti kao u `UcenjeReci.tsx` i `Igra.tsx`;
// tamo nisu izvezene, pa stoje i ovde, da sve izgleda kao ista sveska.
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";

/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const DUGME = "rounded-2xl outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

/** Dete uči, ne sluša podkast - malo sporije od običnog govora. */
const BRZINA = 0.9;

export default function ZvucnikDugme({ tekst }: { tekst: string }) {
  const izbor = useNemackiGlas();
  const [govori, setGovori] = useState(false);

  /**
   * Poslednji izgovor koji je ovo dugme pokrenulo. `cancel()` prekine prethodni,
   * a njegov `onend` stigne posle toga i ugasio bi oznaku novom izgovoru. Zato
   * stanje menja samo izgovor koji je i dalje tekući.
   */
  const tekuci = useRef<SpeechSynthesisUtterance | null>(null);

  // Dete često tapne pa odmah ode dalje. Govor koji nastavi preko sledećeg
  // ekrana zbunjuje, pa se pri sklanjanju kartice ućutkuje.
  useEffect(
    () => () => {
      tekuci.current = null;
      window.speechSynthesis?.cancel();
    },
    []
  );

  // Dok se ne zna ima li nemačkog glasa, ne crta se ništa: dugme koje bljesne pa
  // nestane detetu ispod prsta gore je od dugmeta koga nikad nije ni bilo.
  if (izbor.stanje !== "ima") return null;

  const glas = izbor.glas;

  const izgovori = () => {
    const sinteza = window.speechSynthesis;
    if (!sinteza) return;

    // Brzo uzastopno tapkanje inače naslaže red izgovora i dobije se hor.
    sinteza.cancel();

    const izgovor = new SpeechSynthesisUtterance(tekst);
    izgovor.lang = "de-DE";
    // Glas se dodeljuje izričito. Bez ovoga pretraživač uzima svoj
    // podrazumevani, pa nemačku reč čita engleskim ili našim glasovima.
    izgovor.voice = glas;
    izgovor.rate = BRZINA;
    izgovor.onstart = () => {
      if (tekuci.current === izgovor) setGovori(true);
    };
    izgovor.onend = () => {
      if (tekuci.current === izgovor) setGovori(false);
    };
    izgovor.onerror = () => {
      // Govor ume da otkaže bez razloga. To se detetu ne prijavljuje: ostane
      // kartica kakva jeste, a dete može da tapne ponovo.
      if (tekuci.current === izgovor) setGovori(false);
    };

    tekuci.current = izgovor;
    sinteza.speak(izgovor);
  };

  return (
    <button
      type="button"
      onClick={izgovori}
      // Ime govori šta dugme radi i sa kojom reči. Ikonica sama ne nosi značenje:
      // pored nje piše „Čuj", a čitač ekrana čuje celu rečenicu.
      aria-label={`Čuj kako se izgovara: ${tekst}`}
      className={`${DUGME} font-heading inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-1.5 border-2 px-3 text-[15px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.94]`}
      style={{
        // Dok govori, dugme se oboji - ali boja ovde ništa ne tvrdi sama:
        // jedini podatak je sam zvuk, a dugme radi isto i obojeno i neobojeno.
        background: govori ? "#E6EEFB" : PAPIR,
        borderColor: govori ? PLAVA : IVICA,
        color: govori ? PLAVA : MASTILO,
      }}
    >
      <Zvucnik svira={govori} />
      <span aria-hidden="true">Čuj</span>
    </button>
  );
}

function Zvucnik({ svira }: { svira: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" className={svira ? "motion-safe:animate-pulse" : ""} />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" className={svira ? "motion-safe:animate-pulse" : ""} />
    </svg>
  );
}

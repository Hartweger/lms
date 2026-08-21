"use client";

// Nemački glas telefona, jedno pravilo za ceo zack.
//
// ZAŠTO SE GLAS BIRA IZRIČITO
// ---------------------------
// Kad se `utterance.voice` ostavi prazno, pretraživač uzme svoj podrazumevani
// glas. Na jeftinijim Android telefonima to je engleski ili naš glas, pa se
// „Mädchen" pročita engleskim glasovima. Kurs nemačkog koji tako čita ne uči
// izgovor nego ga kvari. Zato: ili pravi nemački glas, ili ništa.
//
// ZAŠTO POSTOJI STANJE „NE ZNA SE"
// --------------------------------
// Chrome spisak glasova puni naknadno i prvi `getVoices()` vraća prazan niz.
// Prazan spisak zato NE znači „nema nemačkog", nego „još se ne zna". Razlika je
// vidljiva na ekranu: dok se ne zna, dugmeta nema, pa ne može da bljesne i onda
// nestane detetu ispod prsta. Ako se nikad i ne sazna, dugmeta nema - tiho
// izostajanje u korist deteta, bez poruke i bez sivog dugmeta koje ne radi.

import { useEffect, useState } from "react";

export type IzborGlasa<G = SpeechSynthesisVoice> =
  /** Spisak glasova još nije stigao. Ne crtati ništa. */
  | { stanje: "ne-zna-se" }
  /** Telefon ima nemački glas i to je taj. */
  | { stanje: "ima"; glas: G }
  /** Spisak je stigao i nemačkog glasa u njemu nema. Ne crtati ništa. */
  | { stanje: "nema" };

/**
 * Bira nemački glas iz spiska koji je dao `speechSynthesis.getVoices()`.
 *
 * Prvo tačan „de-DE", pa bilo koji „de-*" (de-AT, de-CH): austrijski i
 * švajcarski izgovor jesu drugačiji, ali su nemački - bolji su od engleskog
 * glasa koji čita nemački tekst.
 *
 * Gleda se cela oznaka jezika, a ne prvo dva slova teksta: „den" (jezik Slave)
 * počinje na „de" i nije nemački.
 *
 * Tip je namerno labav (`{ lang: string }`): tako se funkcija testira običnim
 * objektima, a u pretraživaču vraća baš onaj `SpeechSynthesisVoice` koji se
 * dodeljuje izgovoru.
 */
export function izaberiNemackiGlas<G extends { lang: string }>(
  glasovi: readonly G[] | null | undefined
): IzborGlasa<G> {
  if (!glasovi || glasovi.length === 0) return { stanje: "ne-zna-se" };

  // Android ume da prijavi „de_DE" umesto „de-DE"; to je isti glas.
  const oznaka = (g: G) => g.lang.toLowerCase().replace("_", "-");
  const glas =
    glasovi.find((g) => oznaka(g) === "de-de") ??
    glasovi.find((g) => oznaka(g) === "de" || oznaka(g).startsWith("de-"));

  return glas ? { stanje: "ima", glas } : { stanje: "nema" };
}

/**
 * Isto pravilo, ali kao stanje komponente: prati i događaj „voiceschanged",
 * jer se spisak u Chrome-u puni tek posle prvog čitanja.
 *
 * Bezbedno je i na serveru i tamo gde `speechSynthesis` uopšte ne postoji:
 * početno stanje je „ne zna se", efekat se na serveru ne izvršava, pa se prvi
 * render na serveru i u pretraživaču poklapaju i hidracija ne prijavljuje
 * neslaganje.
 */
export function useNemackiGlas(): IzborGlasa {
  const [izbor, setIzbor] = useState<IzborGlasa>({ stanje: "ne-zna-se" });

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const sinteza = window.speechSynthesis;
    const procitaj = () => setIzbor(izaberiNemackiGlas(sinteza.getVoices()));
    procitaj();
    sinteza.addEventListener("voiceschanged", procitaj);
    return () => sinteza.removeEventListener("voiceschanged", procitaj);
  }, []);

  return izbor;
}

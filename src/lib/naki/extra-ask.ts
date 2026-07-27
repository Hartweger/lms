// Jedan dodatni nalog po odgovoru.
//
// Kroz 26-27.07.2026 dodavali smo naloge jedan po jedan (pitaj za rod, pomeni
// kredencijal ispitivača, ponudi kurs, daj blog link) i svaki je pojedinačno radio.
// Zajedno su se ugušili: model po odgovoru odradi najviše jednu dodatnu stvar, pa je
// pobeđivao nasumičan. Zato se ovde bira TAČNO JEDAN, po prioritetu.
//
// Ostali dodaci (zapamćen nivo i ime, zabrana ponovnog pitanja, pravilo o kuponu)
// nisu nalozi nego ograničenja - oni idu uvek i ne troše ovaj slot.

export type ExtraAskName = "support" | "gender" | "examiner" | "upsell" | "blogLink";

export interface ExtraAskInput {
  support: string;
  gender: string;
  examiner: string;
  upsell: string;
  blogLink: string;
}

export interface ExtraAskResult {
  which: ExtraAskName | null;
  text: string;
  /** Dopisivanje ponude u kodu sme samo ako je ponuda i dobila slot. */
  upsellWon: boolean;
}

// Redosled je namerno ovakav:
// support  - korisnik je zaglavljen oko uplate ili pristupa, sve ostalo može da čeka
// gender   - od njega zavisi svaka sledeća rečenica u razgovoru
// examiner - ko sprema zvaničan ispit, njemu ovo najviše znači i retko se javlja
// upsell   - prodaja, ali tek pošto je čovek nešto dobio
// blogLink - najlepše kad se uklopi, ali najmanje vredi
const PRIORITET: ExtraAskName[] = ["support", "gender", "examiner", "upsell", "blogLink"];

export function pickExtraAsk(input: ExtraAskInput): ExtraAskResult {
  for (const name of PRIORITET) {
    const text = input[name];
    if (text) return { which: name, text, upsellWon: name === "upsell" };
  }
  return { which: null, text: "", upsellWon: false };
}

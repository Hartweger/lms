// Jedan izvor istine za javni domen sajta.
// Default je produkcioni domen www.hartweger.rs (flip sa kurs.hartweger.rs obavljen —
// stari domen sada 308-redirektuje na www). Env `NEXT_PUBLIC_SITE_URL` ga overriduje.
//
// NAPOMENA: koristimo eksplicitnu proveru praznog stringa, NE `?? fallback`.
// Na produkciji je env trenutno postavljen na "" (prazan string), a `??` hvata
// samo null/undefined — pa bi prazan string „procureo" i dao relativne URL-ove
// u mejlovima/sertifikatima. Zato fallback hvata i prazno/whitespace.
const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const SITE_URL = raw && raw.length > 0 ? raw.replace(/\/+$/, "") : "https://www.hartweger.rs";

// Domen bez protokola, za prikaz u tekstu (sertifikati, NaKI prompt...).
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

// Brojevi u vežbama: polaznik isti broj može da napiše/izgovori na više načina
// ("069 123 456", "069123456", "null sechs neun eins ..."), a prepoznavanje
// govora izgovorene brojeve UVEK vraća kao cifre ("null eins sieben sechs" ->
// "0176"). Ove funkcije svode sve oblike na zajednički, pa se porede.

const NUM_UNITS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
const NUM_TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const NUM_TENS = ["zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

// Podržava 0-9999 (dovoljno za A1-B2); veće ostavljamo kako jesu.
export function numberToGermanWords(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 9999) return String(n);
  if (n < 10) return NUM_UNITS[n];
  if (n < 20) return NUM_TEENS[n - 10];
  if (n < 100) {
    const u = n % 10, t = Math.floor(n / 10);
    if (u === 0) return NUM_TENS[t - 2];
    return (u === 1 ? "ein" : NUM_UNITS[u]) + "und" + NUM_TENS[t - 2];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100), rem = n % 100;
    const hw = (h === 1 ? "ein" : NUM_UNITS[h]) + "hundert";
    return rem === 0 ? hw : hw + numberToGermanWords(rem);
  }
  const th = Math.floor(n / 1000), rem = n % 1000;
  const tw = (th === 1 ? "ein" : NUM_UNITS[th]) + "tausend";
  return rem === 0 ? tw : tw + numberToGermanWords(rem);
}

// "32" -> "zweiunddreißig". Broj sa vodećom nulom ili duži od 4 cifre
// (telefon, poštanski broj...) se uvek čita cifru po cifru.
export function spellNumbers(s: string): string {
  return s.replace(/\d+/g, (m) =>
    m.length > 4 || (m.length > 1 && m.startsWith("0"))
      ? spellDigitWise(m)
      : numberToGermanWords(parseInt(m, 10)));
}

// "0176" -> "null eins sieben sechs"
export function spellDigitWise(s: string): string {
  return s.replace(/\d+/g, (m) => ` ${m.split("").map((d) => NUM_UNITS[+d]).join(" ")} `);
}

const DIGIT_WORD: Record<string, string> = {
  null: "0", eins: "1", zwei: "2", zwo: "2", drei: "3", vier: "4",
  "fünf": "5", fuenf: "5", sechs: "6", sieben: "7", acht: "8", neun: "9",
};

// Samostalne reči-cifre u cifre i spoj susedne cifre bez razmaka:
// "null sechs neun 123 456" i "069123456" -> "069123456". Očekuje mala slova.
export function collapseDigits(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => DIGIT_WORD[w] ?? w)
    .join(" ")
    .replace(/(\d)\s+(?=\d)/g, "$1")
    .trim();
}

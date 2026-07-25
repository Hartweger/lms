// Post-obrada NaKI odgovora: dva pravila koja prompt sam ne ume da izdrži.
//
// 1) Duga crtica - u analizi 05.06-25.07.2026 pojavila se u 13% odgovora (3.423 od 25.691),
//    iako je Natašino pravilo obična crtica. Prompt to ne rešava pouzdano, zamena rešava.
// 2) Ćirilica - 232 odgovora (0,9%) uprkos pravilu "UVEK piši LATINICOM".
//
// Nemački (umlauti, ß) i latinica ostaju netaknuti - mapiramo samo ćirilične kodne tačke.

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "đ", е: "e", ж: "ž", з: "z", и: "i",
  ј: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  ћ: "ć", у: "u", ф: "f", х: "h", ц: "c", ч: "č", ш: "š",
  // ruske/makedonske kodne tačke koje umeju da se provuku
  й: "j", щ: "šč", ъ: "", ы: "y", ь: "", э: "e", ю: "ju", я: "ja", ё: "e",
};

// Digrafi se rešavaju posebno zbog velikog slova (Njemačka naspram NJEMAČKA).
const CYR_DIGRAPH: Record<string, string> = { љ: "lj", њ: "nj", џ: "dž" };

function isUpperCyrillic(ch: string | undefined): boolean {
  return !!ch && /[Ѐ-џ]/.test(ch) && ch === ch.toUpperCase() && ch !== ch.toLowerCase();
}

/**
 * Čisti odgovor pre nego što ode korisniku i u bazu:
 * duge crtice u običnu, ćirilicu u latinicu.
 */
export function sanitizeReply(text: string): string {
  if (!text) return text;
  let out = text.replace(/[—–]/g, "-");
  if (!/[Ѐ-ӿ]/.test(out)) return out;

  const chars = [...out];
  const result: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const lower = ch.toLowerCase();

    const digraph = CYR_DIGRAPH[lower];
    if (digraph) {
      if (ch === lower) {
        result.push(digraph);
      } else {
        // Velika reč u celini (ЊЕМАЧКА) daje NJ; inače naslovni oblik Nj.
        result.push(isUpperCyrillic(chars[i + 1]) ? digraph.toUpperCase() : digraph[0].toUpperCase() + digraph.slice(1));
      }
      continue;
    }

    const mapped = CYR[lower];
    if (mapped === undefined) {
      result.push(ch);
      continue;
    }
    result.push(ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1));
  }
  out = result.join("");
  return out;
}

/**
 * Provera očiglednih grešaka u domenu mejla (npr. `gmai.com` umesto `gmail.com`).
 *
 * NE ispravlja tiho - samo predlaže ispravku, da se upozorenje vidi u admin
 * notifikaciji i u CRM zapisu. Povod: Smile lid od 07.08.2026 upisan je na
 * `gmai.com`, koji je registrovan typosquat domen - mejl ne bounce-uje nego
 * tiho odlazi trećem licu.
 */

/** Domeni koje NIKAD ne prijavljujemo kao grešku, ma koliko ličili na neki drugi. */
const KNOWN_GOOD = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.de",
  "outlook.com",
  "outlook.de",
  "live.com",
  "live.de",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "email.com",
  "proton.me",
  "protonmail.com",
  "gmx.de",
  "gmx.net",
  "gmx.at",
  "web.de",
  "t-online.de",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "mts.rs",
  "sbb.rs",
  "eunet.rs",
  "ptt.rs",
  "telekom.rs",
  "open.telekom.rs",
  "verat.net",
  "orion.rs",
  "hartweger.rs",
]);

/** Domeni prema kojima merimo blizinu (podskup KNOWN_GOOD - oni koje ljudi najčešće greše). */
const TARGETS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "gmx.de",
  "web.de",
  "t-online.de",
  "mail.ru",
  "mts.rs",
  "sbb.rs",
  "eunet.rs",
  "ptt.rs",
];

/** Greške koje su predaleko za „jedna izmena" (zamena dva slova, dupli propust i sl.). */
const KNOWN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmailc.om": "gmail.com",
  "hotamil.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yahoo.con": "yahoo.com",
  "yahho.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "iclound.com": "icloud.com",
  "iclod.com": "icloud.com",
};

export interface EmailTypoSuggestion {
  /** Mejl kako ga je posetilac ukucao. */
  original: string;
  /** Domen koji je prijavljen kao sumnjiv. */
  domain: string;
  /** Predlog ispravljenog mejla, ili null kad je domen sumnjiv ali ispravka nije očigledna. */
  suggestion: string | null;
  reason: "poznata-greska" | "blizak-domen" | "sadrzi-poznat-domen" | "punycode";
}

/**
 * Vraća upozorenje ako domen liči na grešku ili je sumnjiv, inače null.
 * Prazan/nevalidan mejl takođe daje null - validaciju formata radi normalizeEmail.
 */
export function suggestEmailFix(raw: string | null | undefined): EmailTypoSuggestion | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!domain.includes(".") || KNOWN_GOOD.has(domain)) return null;

  // Punycode (xn--) u mejlu privatnog lica je gotovo uvek homograf - domen koji
  // izgleda kao gmail.com a nije (npr. xn--gmal-nza.com = "gmaıl.com").
  if (domain.startsWith("xn--") || domain.includes(".xn--")) {
    return { original: email, domain, suggestion: null, reason: "punycode" };
  }

  const known = KNOWN_TYPOS[domain];
  if (known) {
    return { original: email, domain, suggestion: `${local}@${known}`, reason: "poznata-greska" };
  }

  const near = TARGETS.find((t) => withinOneEdit(domain, t));
  if (near) {
    return { original: email, domain, suggestion: `${local}@${near}`, reason: "blizak-domen" };
  }

  // Cifre iz lokalnog dela odlutale u domen (npr. `…@84gmil.com` umesto `…84@gmail.com`).
  const bezCifara = domain.replace(/^\d+/, "");
  if (bezCifara !== domain && bezCifara.includes(".")) {
    const nearTrimmed = TARGETS.find((t) => t === bezCifara || withinOneEdit(bezCifara, t));
    if (nearTrimmed) {
      return { original: email, domain, suggestion: `${local}@${nearTrimmed}`, reason: "blizak-domen" };
    }
  }

  // Poznat domen zalepljen uz višak teksta (npr. hotmail.commail.com).
  const glued = TARGETS.find((t) => domain.startsWith(t) || domain.endsWith(`.${t}`));
  if (glued) {
    return { original: email, domain, suggestion: `${local}@${glued}`, reason: "sadrzi-poznat-domen" };
  }

  return null;
}

/**
 * Tačno jedna izmena razlike: supstitucija, višak/manjak slova ili zamena mesta
 * dva susedna slova. Identični stringovi vraćaju false (nema šta da se ispravi).
 */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;

  if (a.length === b.length) {
    const diff: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        diff.push(i);
        if (diff.length > 2) return false;
      }
    }
    if (diff.length === 1) return true;
    const [i, j] = diff;
    return j === i + 1 && a[i] === b[j] && a[j] === b[i];
  }

  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i++;
      j++;
      continue;
    }
    if (skipped) return false;
    skipped = true;
    j++;
  }
  return true;
}

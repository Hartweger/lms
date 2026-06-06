// Čista logika mapiranja WooCommerce proizvoda → sadržajni slugovi na novom LMS-u.
// Bez IO. Testirano u ld-access-mapping.test.ts.

export const YEAR_MS = 365 * 86400000;

// LearnDash course id → novi slug
export const LD_TO_SLUG: Record<number, string> = {
  25340: "nemacki-a1-1", 28450: "nemacki-a1-2",
  30649: "nemacki-a2-1", 33399: "nemacki-a2-2",
  35855: "nemacki-b1-1", 37375: "nemacki-b1-2",
  45327: "nemacki-b2-1", 40821: "nemacki-b2-2",
  47215: "polozi-goethe-c1", 31516: "polozi-goethe-b1", 31515: "polozi-goethe-b2",
  45501: "polozi-fide", 40305: "fsp", 47790: "gramatika-a2-b1",
  50096: "kurs-za-mame-i-trudnice",
};

// Override po NAZIVU (radi i za legacy product_id=0). Ima prioritet nad svim ostalim.
export const NAME_MAP: Array<[RegExp, string[]]> = [
  [/INDIVIDUALNI KURS\s+nema.*A1\.1/i, ["nemacki-a1-1"]],
  [/INDIVIDUALNI KURS\s+nema.*A1\.2/i, ["nemacki-a1-2"]],
  [/INDIVIDUALNI KURS\s+nema.*A2\.1/i, ["nemacki-a2-1"]],
  [/INDIVIDUALNI KURS\s+nema.*A2\.2/i, ["nemacki-a2-2"]],
  [/INDIVIDUALNI KURS\s+nema.*B1\.1/i, ["nemacki-b1-1"]],
  [/INDIVIDUALNI KURS\s+nema.*B1\.2/i, ["nemacki-b1-2"]],
  [/Paket nivo A1.*INDIVIDUALNI/i, ["nemacki-a1-1", "nemacki-a1-2"]],
  [/mame i trudnice/i, ["kurs-za-mame-i-trudnice"]],
  [/konverzacije/i, ["kurs-konverzacije"]],
  [/GRUPNI KURS nema.*B1\.1\s*\+\s*B1\.2/i, ["nemacki-b1-1", "nemacki-b1-2"]],
  [/GRUPNI KURS nema.*B2\.1\s*\+\s*B2\.2/i, ["nemacki-b2-1", "nemacki-b2-2"]],
  [/KURS U PARU.*A1\.1/i, ["nemacki-a1-1"]],
  [/KURS U PARU.*B1\.2/i, ["nemacki-b1-2"]],
  [/Premium A2|Goethe A2 Priprema/i, ["nemacki-a2-1", "nemacki-a2-2"]],
  [/Masterclass.*SPRECHEN/i, ["polozi-goethe-b1"]],
];

// Eksplicitno isključeni (free + 1:1 usluge + obnavljanje + port-kasnije). → [] (poznato, ne pravi nalog).
export const EXCL: RegExp[] = [
  /Testiranje/i, /Zašto ti nema/i, /Kako da .*u.i. re.i/i,
  /mese.ni paketi/i, /Prevo.enje/i, /Izrada biografije/i, /NH Academy/i, /Kreiranje ponude/i,
  /obnavljanje/i, /Poslednji korak/i, /Kako ti želiš|KTŽ/i, /^INDIVIDUALNI KURS$/i, /KURS U PARU/i,
  /Deklinacija prideva/i, /Savladajte Osnove|Gramatika nema.kog jezika\s+A1/i,
];

export function normalizeEmail(raw: string): string | null {
  const e = (raw || "").toLowerCase().trim();
  if (!e.includes("@") || e.endsWith(".con")) return null;
  return e;
}

export function expiryFromPaid(paidMs: number): number {
  return paidMs + YEAR_MS;
}

export function mergeExpiry(existing: number | null, next: number): number {
  return existing != null && existing > next ? existing : next;
}

export function relatedIdsToSlugs(ids: number[]): string[] {
  return ids.map((id) => LD_TO_SLUG[id]).filter(Boolean);
}

// Vrati: string[] slugova (može prazan = poznato bez sadržaja) ili null (nepoznat proizvod).
// NAPOMENA: KURS U PARU je i u NAME_MAP i u EXCL — NAME_MAP se proverava PRVI, pa pobeđuje.
export function resolveSlugs(
  productId: number,
  name: string,
  relatedSlugMap: Record<number, string[]>,
): string[] | null {
  for (const [re, slugs] of NAME_MAP) if (re.test(name)) return slugs;
  for (const re of EXCL) if (re.test(name)) return [];
  if (relatedSlugMap[productId] !== undefined) return relatedSlugMap[productId];
  return null;
}

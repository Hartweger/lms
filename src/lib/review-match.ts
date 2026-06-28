// Spajanje "ko je popunio formu utisaka" po imenu (opcija B - forma ne hvata mejl).
// Normalizacija: bez kvačica, mala slova, redosled imena nebitan.

const COMBINING = /[̀-ͯ]/g;

export function normName(s: string | null | undefined): string {
  return (s || "")
    .normalize("NFD")
    .replace(COMBINING, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function nameKey(s: string | null | undefined): string {
  return normName(s).split(" ").filter(Boolean).sort().join(" ");
}

export function respondedRecently(fullName: string | null | undefined, keySet: Set<string>): boolean {
  const k = nameKey(fullName);
  if (!k) return false;
  return keySet.has(k);
}

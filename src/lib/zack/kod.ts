// Kod koji roditelj prepisuje detetu, pa ga dete kuca na svom telefonu.
// Zato azbuka NAMERNO ne sadrži znakove koji se mešaju pri prepisivanju:
// nula i veliko O, jedinica i veliko I i malo l. „Je li ovo nula ili O" je
// pitanje koje ne želimo da stiže u podršku.

const AZBUKA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PREFIKS = "ZK-";
const DUZINA = 4;

export { AZBUKA, PREFIKS, DUZINA };

/** Kod oblika „ZK-4F7Q". Slučajnost ulazi kroz rng, da bi se moglo testirati. */
export function napraviKod(rng: () => number): string {
  let znaci = "";
  for (let i = 0; i < DUZINA; i++) {
    const j = Math.min(AZBUKA.length - 1, Math.floor(rng() * AZBUKA.length));
    znaci += AZBUKA[j];
  }
  return PREFIKS + znaci;
}

/**
 * Prepoznaje kod kako god bio otkucan: „zk4f7q", „ZK 4F7Q", „zk-4f7q".
 * Dete neće paziti na crticu, razmake ni velika slova.
 */
export function normalizujKod(unos: string): string {
  const samoZnaci = (unos ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/^ZK/, "");
  return PREFIKS + samoZnaci;
}

export function kodJeIspravan(unos: string): boolean {
  const k = normalizujKod(unos);
  const znaci = k.slice(PREFIKS.length);
  if (znaci.length !== DUZINA) return false;
  return [...znaci].every((z) => AZBUKA.includes(z));
}

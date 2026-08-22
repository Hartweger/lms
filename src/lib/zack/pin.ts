// PIN deteta. NIKAD se ne čuva kao broj, samo kao nepovratan otisak.
// Četiri cifre je deset hiljada kombinacija, što je ništa bez ograničenja
// pokušaja, pa uz ovo obavezno ide i `zakljucavanje.ts`.
import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

// Parametri se upisuju u sam otisak, pa se kasnije mogu pojačati bez
// obaranja postojećih PIN-ova. N je namerno visok jer se PIN proverava
// retko (prijava deteta), a prostor od 10.000 kombinacija je mali.
const N = 16384;
const R = 8;
const P = 1;
const DUZINA_KLJUCA = 32;

export function pinJeIspravan(pin: string): boolean {
  return /^\d{4}$/.test(pin ?? "");
}

/** Odbija očigledne PIN-ove: sve iste cifre, uzlazni i silazni niz. */
export function slabPin(pin: string): boolean {
  if (!pinJeIspravan(pin)) return false;
  if (/^(\d)\1{3}$/.test(pin)) return true;
  const c = [...pin].map(Number);
  const uzlazni = c.every((x, i) => i === 0 || x === c[i - 1] + 1);
  const silazni = c.every((x, i) => i === 0 || x === c[i - 1] - 1);
  return uzlazni || silazni;
}

/**
 * Nasumičan PIN koji dete dobija odmah, bez ijednog roditeljevog koraka.
 *
 * Zašto uopšte postoji: mereno prve večeri akcije (22.08.2026), trećina
 * roditelja je zatvorila hvala-stranu pre nego što je postavila PIN - a bez
 * PIN-a dete FIZIČKI ne može da uđe. Korak koji se preskače najbolje se rešava
 * tako što ga nema.
 *
 * randomInt, ne Math.random: ovo je šifra, ma koliko niski bili ulozi.
 * Očigledni PIN-ovi (1111, 1234, 4321) se odbacuju istim pravilom koje važi i
 * kad ga roditelj kuca sam - inače bi nasumičnost povremeno dala baš njih.
 */
export function napraviNasumicniPin(): string {
  for (;;) {
    const pin = String(randomInt(0, 10000)).padStart(4, "0");
    if (!slabPin(pin)) return pin;
  }
}

function izvedi(pin: string, so: Buffer): Promise<Buffer> {
  return new Promise((uspeh, greska) => {
    scrypt(pin, so, DUZINA_KLJUCA, { N, r: R, p: P }, (e, kljuc) =>
      e ? greska(e) : uspeh(kljuc)
    );
  });
}

export async function napraviPinOtisak(pin: string): Promise<string> {
  if (!pinJeIspravan(pin)) throw new Error("PIN mora imati tačno četiri cifre");
  const so = randomBytes(16);
  const kljuc = await izvedi(pin, so);
  return `scrypt$${N}$${R}$${P}$${so.toString("base64")}$${kljuc.toString("base64")}`;
}

/** Poređenje je otporno na merenje vremena. Pokvaren otisak vraća false, ne baca. */
export async function pinSePoklapa(pin: string, otisak: string): Promise<boolean> {
  if (!pinJeIspravan(pin)) return false;
  const d = (otisak ?? "").split("$");
  if (d.length !== 6 || d[0] !== "scrypt") return false;
  const [n, r, p] = [Number(d[1]), Number(d[2]), Number(d[3])];
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0)) return false;
  try {
    const so = Buffer.from(d[4], "base64");
    const ocekivano = Buffer.from(d[5], "base64");
    if (so.length === 0 || ocekivano.length === 0) return false;
    const kljuc = await new Promise<Buffer>((uspeh, greska) =>
      scrypt(pin, so, ocekivano.length, { N: n, r, p }, (e, k) => (e ? greska(e) : uspeh(k)))
    );
    return kljuc.length === ocekivano.length && timingSafeEqual(kljuc, ocekivano);
  } catch {
    return false;
  }
}

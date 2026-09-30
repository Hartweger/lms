export type AccessState = "none" | "active" | "expiring" | "expired";
export interface AccessStatus {
  state: AccessState;
  daysLeft: number | null;
}

const DAY = 86_400_000;
const EXPIRING_THRESHOLD_DAYS = 7;

export function accessStatus(expiresAt: string | null, now: Date = new Date()): AccessStatus {
  if (!expiresAt) return { state: "none", daysLeft: null };
  const daysLeft = Math.round((new Date(expiresAt).getTime() - now.getTime()) / DAY);
  if (daysLeft < 0) return { state: "expired", daysLeft };
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return { state: "expiring", daysLeft };
  return { state: "active", daysLeft };
}

/** „za 1 dan", ali „za 2/5/30 dana" - odbrojavanje ide najviše do 30. */
function danaReč(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? "dan" : "dana";
}

export interface AccessNote {
  text: string;
  /** "alarm" = koralno, polaznik treba nešto da uradi; "muted" = sivo, samo obaveštenje. */
  tone: "muted" | "alarm";
}

/**
 * Šta piše o roku na kartici kursa u „Moj nalog".
 *
 * Kod AKTIVNE pretplate rok nije istek nego „plaćeno do": svaka naplata ga pomera
 * mesec dana unapred (rok = naplata + mesec + 7 dana zaliha, `subscription-plans.ts`).
 * Odbrojavanje zato svakog meseca padne na 7 dana i najavi gubitak kursa koji se sam
 * produžava - polaznica sa paketa A1+A2+B1 je 30.09.2026. pisala da misli da joj se
 * A1.1 gasi. Zato pretplata dobija datum sledeće naplate umesto odbrojavanja.
 *
 * Istek se i tada prikazuje: ako je rok prošao, naplata je pala i pristup stvarno ne radi.
 */
export function accessNote(
  status: AccessStatus,
  nextChargeAt: string | null,
  now: Date = new Date(),
): AccessNote | null {
  if (status.state === "expired") return { text: "Pristup je istekao", tone: "alarm" };

  if (nextChargeAt) {
    const naplata = new Date(nextChargeAt);
    // Naplata koja tek treba da se obradi (cron ide jednom dnevno): ne obećavamo prošli
    // datum, ali ni ne plašimo odbrojavanjem - pristup ima još 7 dana zaliha i važi.
    if (naplata.getTime() <= now.getTime()) return null;
    return { text: `Produžava se automatski ${naplata.toLocaleDateString("sr-RS")}`, tone: "muted" };
  }

  if (status.daysLeft === null) return null;
  if (status.state === "expiring")
    return { text: `Pristup ističe za ${status.daysLeft} ${danaReč(status.daysLeft)}`, tone: "alarm" };
  if (status.state === "active" && status.daysLeft <= 30)
    return { text: `Pristup ističe za ${status.daysLeft} ${danaReč(status.daysLeft)}`, tone: "muted" };
  return null;
}

export function remainingSessions(packageLessons: number, lessonsUsed: number): number {
  return Math.max(0, packageLessons - lessonsUsed);
}

export function shouldShowRenew(s: AccessStatus): boolean {
  return s.state === "expiring" || s.state === "expired";
}

// Kursevi koji NEMAJU platformsku obnovu kuponom OBNOVI50 (mora se poklapati sa
// src/app/api/cron/expiry-reminder/route.ts). "mesecni" = ind paketi 4/8/12;
// konverzacijski = živi grupni, obnova = upis u novi termin, ne "obnovi 50%".
const NON_RENEWABLE_SLUGS = new Set(["kurs-konverzacije", "konverzacijski-b1-sadrzaj"]);

export function isRenewable(category: string | null, slug: string): boolean {
  if (category === "mesecni") return false;
  if (NON_RENEWABLE_SLUGS.has(slug)) return false;
  return true;
}

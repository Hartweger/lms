// src/lib/payment-confirmation.ts — Potvrda o plaćanju karticom, po Uputstvu za rad EPM
// (Banca Intesa) v3.5, tačka 2.7: obavezni elementi na web formi I u mejlu kupcu, za
// uspešno I neuspešno plaćanje. Deli se između hvala stranice i email.ts.

/** Podaci o Trgovcu (EPM 2.7 tačka 4) - isti kao odeljak 5 na /uslovi. */
export const MERCHANT = {
  naziv:
    "NATAŠA HARTWEGER PR STUDIO ZA UČENJE NEMAČKOG JEZIKA I PREVOĐENJE HARTWEGER BEOGRAD (NOVI BEOGRAD)",
  pib: "108712117",
  adresa: "Jurija Gagarina 20, Beograd (Novi Beograd)",
};

/** Propisana formulacija ishoda (EPM 2.7 tačka 1) - ne menjati bez provere sa bankom. */
export const CARD_OUTCOME = {
  success: "Plaćanje je uspešno - račun platne kartice je zadužen.",
  fail: "Plaćanje nije uspešno - račun platne kartice nije zadužen.",
  // Bankin predloženi tekst za neuspeh; eksplicitni razlozi odbijanja se NE smeju prikazivati.
  failHint:
    "Najčešći uzrok je pogrešno unet broj kartice, datum isteka ili sigurnosni kod. " +
    "Pokušajte ponovo, a u slučaju uzastopnih grešaka pozovite vašu banku.",
};

/** Podaci o transakciji (EPM 2.7 tačka 5), izvučeni iz sačuvanog NestPay callback-a. */
export interface NestpayTx {
  /** Datum i vreme transakcije, formatirano za prikaz (Europe/Belgrade). */
  dateTime: string;
  authCode: string;
  response: string;
  procReturnCode: string;
  mdStatus: string;
}

function formatBelgrade(d: Date): string {
  const p = new Intl.DateTimeFormat("sr-RS", {
    timeZone: "Europe/Belgrade",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}.${g("month")}.${g("year")}. u ${g("hour")}:${g("minute")}`;
}

/**
 * Iz sačuvanog `orders.nestpay_response` (raw callback parametri + naš `_receivedAt`)
 * pravi podatke o transakciji za potvrdu. `fallbackIso` (npr. created_at) se koristi
 * ako u response-u nema nijednog vremena.
 */
export function nestpayTxData(
  response: Record<string, unknown> | null | undefined,
  fallbackIso?: string,
): NestpayTx {
  const r = response ?? {};
  const s = (k: string) => {
    const v = r[k];
    return typeof v === "string" && v.trim() !== "" ? v : "-";
  };

  // EXTRA.TRXDATE stiže kao "yyyyMMdd HH:mm:ss" i VEĆ JE u bankinom (beogradskom) vremenu -
  // formatira se direktno, bez tz konverzije (server je na UTC). Ako ga nema, koristimo
  // trenutak prijema callback-a koji sami upisujemo (_receivedAt, ISO/UTC → Beograd).
  let dateTime: string | null = null;
  const trx = r["EXTRA.TRXDATE"];
  if (typeof trx === "string") {
    const m = trx.match(/^(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2})/);
    if (m) dateTime = `${m[3]}.${m[2]}.${m[1]}. u ${m[4]}:${m[5]}`;
  }
  if (!dateTime) {
    const iso = typeof r["_receivedAt"] === "string" ? (r["_receivedAt"] as string) : fallbackIso;
    const when = iso ? new Date(iso) : null;
    if (when && !isNaN(when.getTime())) dateTime = formatBelgrade(when);
  }

  return {
    dateTime: dateTime ?? "-",
    authCode: s("AuthCode"),
    response: s("Response"),
    procReturnCode: s("ProcReturnCode"),
    mdStatus: s("mdStatus"),
  };
}

/**
 * PDV prikaz za podatke o narudžbini (EPM 2.7 tačka 3). Cene su sa uračunatim PDV-om
 * (/uslovi odeljak 12); stopa prati fiskalizaciju: domaći kupci 20%, inostranstvo 0%.
 */
export function pdvBreakdown(total: number, country: string): { label: string; amountRsd: number } {
  if (country !== "RS") return { label: "PDV (0%, oslobođeno)", amountRsd: 0 };
  return { label: "PDV (20%, uračunat u cenu)", amountRsd: Math.round(total - total / 1.2) };
}

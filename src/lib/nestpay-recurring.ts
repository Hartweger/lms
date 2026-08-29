// src/lib/nestpay-recurring.ts
// CC5 upiti nad recurring serijom. Banka šalje callback SAMO za inicijalnu naplatu
// (potvrđeno testom i mejlom banke 21.07.2026), pa naplate 2..N saznajemo upitom.
// Odgovor nosi po naplati sufiksirana polja: ORD_ID_n, TRANS_STAT_n, CAPTURE_AMT_n,
// PLANNED_START_DTTM_n.
import { NESTPAY, minorUnitsToRsd } from "@/lib/nestpay";

/**
 * Okruženje banke. `test` postoji da bismo dohvatanje rata i otkazivanje uvežbali nad
 * test serijom PRE puštanja uživo - produkcioni podaci se pri tome ne diraju.
 */
export type NestpayEnv = "prod" | "test";

export function envConfig(env: NestpayEnv) {
  return env === "test"
    ? {
        user: process.env.NESTPAY_TEST_API_USER ?? "",
        password: process.env.NESTPAY_TEST_API_PASSWORD ?? "",
        merchantId: process.env.NESTPAY_TEST_MERCHANT_ID ?? "",
        apiUrl: process.env.NESTPAY_TEST_API_URL ?? "https://testsecurepay.eway2pay.com/fim/api",
      }
    : {
        user: NESTPAY.apiUser,
        password: NESTPAY.apiPassword,
        merchantId: NESTPAY.merchantId,
        apiUrl: NESTPAY.apiUrl,
      };
}

function credentials(env: NestpayEnv): string {
  const c = envConfig(env);
  return `<Name>${c.user}</Name><Password>${c.password}</Password><ClientId>${c.merchantId}</ClientId>`;
}

export function buildRecurringStatusXml(recurringId: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGID>${recurringId}</RECURRINGID><ORDERSTATUS>QUERY</ORDERSTATUS></Extra></CC5Request>`;
}

export function buildRecurringCancelXml(recurringId: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGOPERATION>Cancel</RECURRINGOPERATION><RECORDTYPE>Recurring</RECORDTYPE><RECORDID>${recurringId}</RECORDID></Extra></CC5Request>`;
}

/**
 * Ponovno iniciranje JEDNE pale naplate pomeranjem njenog planiranog datuma
 * (priručnik, pogl. 7 „Modification of Order Planned Start Date"). Banka je
 * 22.07.2026 potvrdila da se pala naplata ovim ponovo pokreće - najviše jednom
 * dnevno, ukupno do 30 puta - a serija posle nastavlja po svom rasporedu.
 * `chargeOid` je ORD_ID_n te naplate (`<base_oid>-N`), `startDate` je YYYY-MM-DD.
 */
export function buildChargeRetryXml(chargeOid: string, startDate: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGOPERATION>Update</RECURRINGOPERATION><RECORDTYPE>Order</RECORDTYPE><RECORDID>${chargeOid}</RECORDID><STARTDATE>${startDate}</STARTDATE></Extra></CC5Request>`;
}

export interface RecurringCharge {
  installmentNo: number;
  oid: string;
  transStat: string;
  /** null dok naplata nije realizovana */
  amountRsd: number | null;
  plannedAt: string;
  /** novac je stvarno naplaćen - tek ovo sme da produži pristup i da se fiskalizuje */
  succeeded: boolean;
  /** naplata je propala i neće se sama popraviti (odbijena, greška, otkazana) */
  failed: boolean;
  /** pala naplata koja sme ponovo da se inicira (D/ERR; otkazanu i poništenu ne diramo) */
  retryable: boolean;
  /** zapis je povraćaj novca, ne naplata */
  refund: boolean;
  /** Podaci o transakciji za mejl kupcu (EPM 2.7, zahtev banke 24.07.2026) -
      naplate na čekanju ih još nemaju, zato null. */
  authCode: string | null;
  transId: string | null;
  /** "YYYY-MM-DD HH:mm:ss.S", bankino (beogradsko) vreme. */
  authDttm: string | null;
}

/** Uspešno naplaćeno (priručnik, tabela statusa): C = odobreno, S = prosleđeno na obračun. */
const USPELI_STATUSI = new Set(["C", "S"]);
/** Konačno propalo: D = odbijeno, ERR = greška u seriji, CNCL = otkazano, V = poništeno. */
const PALI_STATUSI = new Set(["D", "ERR", "CNCL", "V"]);
/**
 * Od palih se ponovo iniciraju samo odbijena (D) i greška (ERR) - potvrda banke
 * 22.07.2026. CNCL/V su namerno prekinute (otkazivanje, void) i ne diraju se.
 */
const PONOVLJIVI_STATUSI = new Set(["D", "ERR"]);

/**
 * TRANS_STAT po priručniku (Merchant Integration API Manual, tabela statusa):
 * `C` odobreno, `S` obračunato, `A` samo rezervisano, `PN` na čekanju, `NW` još se
 * obrađuje, `D` odbijeno, `ERR`/`CNCL` greška ili otkazana serija, `V` poništeno,
 * `R` traži storniranje. Uspela naplata U SERIJI stiže kao `C` (provereno na test
 * seriji 21.07.2026), a ne `S` kao jednokratna prodaja.
 *
 * Zamka: `CHARGE_TYPE_CD` = `C` znači POVRAĆAJ, i tada isti status `C`/`S` označava
 * vraćen novac. Zato tip transakcije mora da se proveri - inače bi povraćaj produžio
 * pristup polaznici koja je novac dobila nazad.
 */
export function parseRecurringStatus(text: string): { count: number; charges: RecurringCharge[] } {
  const tag = (name: string) =>
    text.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i"))?.[1]?.trim() ?? "";

  const count = Number(tag("RECURRINGCOUNT")) || 0;
  const charges: RecurringCharge[] = [];

  for (let n = 1; n <= Math.max(count, 0); n++) {
    const oid = tag(`ORD_ID_${n}`);
    if (!oid) continue;
    const transStat = tag(`TRANS_STAT_${n}`).toUpperCase();
    const amountRsd = minorUnitsToRsd(tag(`CAPTURE_AMT_${n}`));
    // Isti podatak stiže i kao zasebna oznaka i unutar zbirnog ORDERSTATUS_n niza.
    const chargeType = (
      tag(`CHARGE_TYPE_CD_${n}`) ||
      tag(`ORDERSTATUS_${n}`).match(/CHARGE_TYPE_CD:(\w+)/i)?.[1] ||
      ""
    ).toUpperCase();
    const refund = chargeType === "C";
    // I ovi podaci stižu i kao zasebne oznake i unutar zbirnog ORDERSTATUS_n niza.
    const zbirno = tag(`ORDERSTATUS_${n}`);
    const izZbirnog = (key: string, pattern = "\\S+") =>
      zbirno.match(new RegExp(`${key}:(${pattern})`, "i"))?.[1] ?? null;
    const authCode = tag(`AUTH_CODE_${n}`) || izZbirnog("AUTH_CODE");
    const transId = tag(`TRANS_ID_${n}`) || izZbirnog("TRANS_ID");
    const authDttm = tag(`AUTH_DTTM_${n}`) || izZbirnog("AUTH_DTTM", "[\\d-]+ [\\d:.]+");

    charges.push({
      installmentNo: n,
      oid,
      transStat,
      amountRsd,
      plannedAt: tag(`PLANNED_START_DTTM_${n}`),
      succeeded: !refund && USPELI_STATUSI.has(transStat) && amountRsd !== null && amountRsd > 0,
      failed: PALI_STATUSI.has(transStat),
      retryable: PONOVLJIVI_STATUSI.has(transStat),
      refund,
      authCode: authCode || null,
      transId: transId || null,
      authDttm: authDttm || null,
    });
  }
  return { count, charges };
}

/**
 * Da li je serija stvarno zaustavljena kod banke - provera po naplatama, ne po
 * odgovoru na Cancel.
 *
 * Postoji zato što je 13.08.2026 banka seriju `26206OfSB24222` otkazala (sve rate
 * 2-12 u Merchant Centru su CNCL), a njen odgovor na Cancel nismo prepoznali kao
 * odobren: kupac je dobio poruku da otkazivanje ne prolazi, a pretplata je u bazi
 * ostala „active". Zato posle neprepoznatog odgovora pitamo status serije.
 *
 * Traži se izričit dokaz - CNCL na svakoj nenaplaćenoj rati. Prazan odgovor ili
 * pala rata (D, koju ponovni pokušaj još može da oživi) NISU potvrda otkazivanja.
 */
export function isSeriesCancelled(charges: RecurringCharge[]): boolean {
  const nenaplacene = charges.filter((c) => !c.succeeded);
  return nenaplacene.length > 0 && nenaplacene.every((c) => c.transStat === "CNCL");
}

/**
 * Da li je banka prihvatila RECURRINGOPERATION zahtev (Cancel ili Update).
 *
 * Na izmenu serije banka odgovara tagom `<RESULT>` (`Approved`/`Failed`), a NE
 * `<Response>`/`<ProcReturnCode>` kao na običnu transakciju - potvrđeno na
 * produkciji 25.08.2026, serija `26205TpyJ29844`:
 * `<CC5Response>…<RESULT>Failed</RESULT><Extra></Extra></CC5Response>`.
 * Dok se taj tag nije čitao, nijedna izmena serije nije mogla da bude prepoznata
 * kao uspešna - odatle Milenin slučaj 13.08.2026 (otkazivanje prošlo kod banke,
 * kupcu javljeno da nije).
 *
 * Kad `<RESULT>` postoji, on je merodavan: izričito „Failed" ne sme da nadjača
 * generički `ProcReturnCode 00` iz istog odgovora.
 */
export function isRecurringOpApproved(text: string): boolean {
  const result = text.match(/<RESULT>([^<]*)<\/RESULT>/i)?.[1]?.trim() ?? "";
  if (result) return result.toLowerCase() === "approved";
  const response = text.match(/<Response>([^<]*)<\/Response>/i)?.[1]?.trim() ?? "";
  const proc = text.match(/<ProcReturnCode>([^<]*)<\/ProcReturnCode>/i)?.[1]?.trim() ?? "";
  return response.toLowerCase() === "approved" || proc === "00";
}

/** Šalje CC5 zahtev i vraća sirov odgovor (null na mrežnu grešku). */
export async function postCc5(xml: string, env: NestpayEnv = "prod"): Promise<string | null> {
  const c = envConfig(env);
  if (!c.user || !c.password) {
    console.error(`[nestpay-recurring] API kredencijali za okruženje ${env} nisu podešeni`);
    return null;
  }
  const res = await fetch(c.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ DATA: xml }).toString(),
  });
  if (!res.ok) return null;
  return res.text();
}

/**
 * Kod greške u NAŠEM zahtevu banka vraća `<ERRORCODE>` (npr. `CORE-1032 Invalid
 * format for order start date.`, produkcija 27-28.08.2026). Takvo odbijanje se
 * dešava na proveri zahteva - kartica se ne dodiruje - pa NE sme da troši kvotu
 * od 30 ponovnih iniciranja koju banka daje po naplati.
 */
export function recurringOpErrorCode(text: string): string | null {
  return text.match(/<ERRORCODE>([^<]*)<\/ERRORCODE>/i)?.[1]?.trim() || null;
}

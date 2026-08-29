// src/app/api/admin/nestpay-recurring-retry/route.ts
// Ručno ponovno iniciranje jedne recurring naplate (RECURRINGOPERATION=Update +
// STARTDATE, priručnik pogl. 7). Služi za uvežbavanje nad TEST serijom pre
// puštanja uživo, za ručnu intervenciju na produkciji i za probu formata datuma.
// POST (menja stanje kod banke!): { "oid": "<base_oid>-N", "env": "test"|"prod", "startDate"?: string }.
// GET (ništa ne menja): proba zapisa datuma nad NEPOSTOJEĆIM zapisom - otvara se u
// pregledaču ulogovan kao admin, kao i /api/admin/nestpay-status.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  buildChargeRetryXml,
  isRecurringOpApproved,
  recurringOpErrorCode,
  postCc5,
  envConfig,
  type NestpayEnv,
} from "@/lib/nestpay-recurring";
import { retryStartDate } from "@/lib/subscription-charges";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    oid?: string;
    env?: string;
    startDate?: string;
  };
  const oid = body.oid?.trim();
  const env: NestpayEnv = body.env === "test" ? "test" : "prod";
  if (!oid) {
    return NextResponse.json({ error: 'Nedostaje "oid" (ORD_ID naplate, npr. RECTEST-...-2).' }, { status: 400 });
  }
  // Format datuma se NE proverava strogo: banka je 27-28.08.2026 odbijala
  // dokumentovani `YYYY-MM-DD` sa `CORE-1032 Invalid format for order start date.`,
  // pa ova ruta mora da ume da isproba i druge zapise. Proba se radi sa NEPOSTOJEĆIM
  // `oid` - ako odgovor prestane da bude CORE-1032, format je pogođen, a nijedna
  // prava naplata nije pomerena.
  const startDate = body.startDate?.trim() || retryStartDate(new Date());
  if (startDate.length > 40 || /[<>&]/.test(startDate)) {
    return NextResponse.json({ error: '"startDate" je predugačak ili sadrži XML znake.' }, { status: 400 });
  }

  const c = envConfig(env);
  if (!c.user || !c.password) {
    return NextResponse.json(
      {
        error:
          env === "test"
            ? "NESTPAY_TEST_API_USER / NESTPAY_TEST_API_PASSWORD nisu podešeni u env-u."
            : "NESTPAY_API_USER / NESTPAY_API_PASSWORD nisu podešeni u env-u.",
      },
      { status: 500 },
    );
  }

  const xml = await postCc5(buildChargeRetryXml(oid, startDate, env), env);
  if (!xml) return NextResponse.json({ error: "Banka nije odgovorila." }, { status: 502 });

  return NextResponse.json({ env, oid, startDate, approved: isRecurringOpApproved(xml), sirovo: xml.slice(0, 2000) });
}

/**
 * Koje zapise datuma banka uopšte prima. Priručnik (pogl. 7) daje primer
 * `2013-10-04`, ali je produkcija 27-28.08.2026. baš taj zapis odbijala sa
 * `CORE-1032 Invalid format for order start date.` i time zaustavljala svaki
 * ponovni pokušaj naplate za serije 2026-228 i 2026-233.
 */
const PROBNI_FORMATI = (d: string): string[] => [
  d,
  d.split("-").reverse().join("/"),
  d.split("-").reverse().join("."),
  `${d} 00:00:00.0`,
  `${d} 00:00:00`,
  d.replaceAll("-", ""),
];

/**
 * `RECORDID` koji kod banke NE postoji. Zahvaljujući njemu proba ne može da pomeri
 * nijednu pravu naplatu: ako zapis datuma prođe proveru, banka se buni na zapis,
 * a ne na datum - i tu razliku tražimo.
 */
const NEPOSTOJECI_OID = "PROBA-FORMAT-NE-POSTOJI-1";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const env: NestpayEnv = params.get("env") === "test" ? "test" : "prod";
  const datum = params.get("datum")?.trim() || retryStartDate(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    return NextResponse.json({ error: '"datum" mora biti YYYY-MM-DD (osnova za sve zapise).' }, { status: 400 });
  }

  const rezultati = [];
  for (const startDate of PROBNI_FORMATI(datum)) {
    const xml = await postCc5(buildChargeRetryXml(NEPOSTOJECI_OID, startDate, env), env);
    rezultati.push({
      startDate,
      odgovorio: !!xml,
      prihvaceno: !!xml && isRecurringOpApproved(xml),
      sifra: xml ? recurringOpErrorCode(xml) : null,
      poruka: xml?.match(/<ERRORMESSAGE>([^<]*)<\/ERRORMESSAGE>/i)?.[1]?.trim() ?? null,
      sirovo: xml?.replace(/\s+/g, " ").trim().slice(0, 300) ?? null,
    });
  }

  return NextResponse.json({
    napomena: `Proba nad nepostojećim zapisom ${NEPOSTOJECI_OID} - nijedna prava naplata nije dodirnuta. Traži se zapis kod kog šifra PRESTANE da bude CORE-1032.`,
    env,
    datum,
    rezultati,
  });
}

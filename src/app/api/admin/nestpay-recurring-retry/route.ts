// src/app/api/admin/nestpay-recurring-retry/route.ts
// Ručno ponovno iniciranje jedne recurring naplate (RECURRINGOPERATION=Update +
// STARTDATE, priručnik pogl. 7). Služi za uvežbavanje nad TEST serijom pre
// puštanja uživo, za ručnu intervenciju na produkciji i za probu formata datuma.
// POST (menja stanje kod banke!): { "oid": "<base_oid>-N", "env": "test"|"prod", "startDate"?: string }.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  buildChargeRetryXml,
  isRecurringOpApproved,
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

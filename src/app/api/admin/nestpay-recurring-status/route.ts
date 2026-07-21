// src/app/api/admin/nestpay-recurring-status/route.ts
// Prikazuje sve naplate jedne recurring serije (CC5 ORDERSTATUS=QUERY + RECURRINGID).
// Služi za uvežbavanje nad TEST serijom pre puštanja uživo i za podršku na produkciji.
// Banka NE šalje callback za naplate 2..N, pa je ovaj upit jedini način da ih vidimo.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  buildRecurringStatusXml,
  parseRecurringStatus,
  postCc5,
  envConfig,
  type NestpayEnv,
} from "@/lib/nestpay-recurring";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const recurringId = url.searchParams.get("recurringId")?.trim();
  const env: NestpayEnv = url.searchParams.get("env") === "test" ? "test" : "prod";
  if (!recurringId) {
    return NextResponse.json({ error: "Nedostaje ?recurringId=" }, { status: 400 });
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

  const xml = await postCc5(buildRecurringStatusXml(recurringId, env), env);
  if (!xml) return NextResponse.json({ error: "Banka nije odgovorila." }, { status: 502 });

  const parsed = parseRecurringStatus(xml);
  return NextResponse.json({ env, recurringId, ...parsed, sirovo: xml.slice(0, 2000) });
}

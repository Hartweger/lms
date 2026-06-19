import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rankNakiTopics, pickExamples } from "@/lib/naki/topics";
import { sendNakiContentEmail } from "@/lib/email";

// Nedeljni cron (ponedeljak 06:00 UTC = 08:00 Beograd): "NaKI pitanje nedelje".
// Izvuče top temu iz NaKI razgovora poslednjih 7 dana i pošalje content podsetnik
// Nataši (info@). Zaštita: Bearer CRON_SECRET. Vidi scripts/naki-topics.mjs za ad-hoc.
const DAYS = 7;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - DAYS * 86400e3).toISOString();

  // Učitaj sve korisničke poruke iz prozora (paginirano - može biti >1000).
  const userMsgs: { session_id: string; message: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("naki_messages")
      .select("session_id, message")
      .eq("role", "user")
      .gte("created_at", since)
      .range(from, from + 999);
    if (error) {
      console.error("[cron/naki-content-weekly] supabase greška", error);
      return NextResponse.json({ error: "db" }, { status: 500 });
    }
    userMsgs.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  if (userMsgs.length === 0) {
    console.log("[cron/naki-content-weekly] nema poruka u prozoru, preskačem");
    return NextResponse.json({ ok: true, skipped: "no_messages" });
  }

  const ranked = rankNakiTopics(userMsgs);
  const top = ranked[0];
  if (!top || top.sessions === 0) {
    console.log("[cron/naki-content-weekly] nijedna tema nije pogođena, preskačem");
    return NextResponse.json({ ok: true, skipped: "no_topic" });
  }

  const primeri = pickExamples(userMsgs, top.topic, 3);
  await sendNakiContentEmail({
    tema: top.topic.name,
    sesija: top.sessions,
    primeri,
    yt: top.topic.yt,
    ig: top.topic.ig,
    dani: DAYS,
  });

  return NextResponse.json({
    ok: true,
    tema: top.topic.name,
    sesija: top.sessions,
    primeri: primeri.length,
  });
}

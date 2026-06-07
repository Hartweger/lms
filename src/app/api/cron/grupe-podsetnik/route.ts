import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextNivoFor, grupniSlugForNivo } from "@/lib/course-nivo";
import { sendNatasaNextTermReminder, sendNextLevelOffer } from "@/lib/email";

// Dnevni cron: podsetnik adminu 14 dana pre kraja + ponuda polaznicima 7 dana pre kraja.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const plus = (d: number) => { const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
  const now = new Date().toISOString();
  const in14 = plus(14);
  const in7 = plus(7);

  const { data: groups } = await admin
    .from("groups")
    .select("id, level, end_date, term_opened_at, reminder_sent_at, offer_sent_at, professor:professor_id(full_name)")
    .in("status", ["otvoren", "u_toku"])
    .not("end_date", "is", null);

  let reminders = 0;
  let offers = 0;

  for (const g of groups ?? []) {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    const profIme: string = prof?.full_name || "";
    const nextNivo = nextNivoFor(g.level);

    // 1) Podsetnik adminu — 14 dana pre kraja.
    if (!g.reminder_sent_at && g.end_date <= in14) {
      await sendNatasaNextTermReminder({ nivo: g.level, nextNivo, endDate: g.end_date, profIme });
      await admin.from("groups").update({ reminder_sent_at: now }).eq("id", g.id);
      reminders++;
    }

    // 2) Ponuda polaznicima — 7 dana pre kraja.
    if (!g.offer_sent_at && g.end_date <= in7) {
      if (nextNivo) {
        const slug = grupniSlugForNivo(nextNivo);
        const courseUrl = slug ? `https://kurs.hartweger.rs/kursevi/${slug}` : "https://kurs.hartweger.rs/kursevi";
        let q = admin
          .from("group_enrollments")
          .select("enrolled_at, user:user_id(email, full_name)")
          .eq("group_id", g.id).eq("status", "active");
        if (g.term_opened_at) q = q.gte("enrolled_at", g.term_opened_at);
        const { data: enrs } = await q;
        for (const e of enrs ?? []) {
          const u = Array.isArray(e.user) ? e.user[0] : e.user;
          if (u?.email) {
            await sendNextLevelOffer(u.email, u.full_name || "", { currentNivo: g.level, nextNivo, courseUrl });
            offers++;
          }
        }
      }
      // Označi kao poslato (i kad nema sledećeg nivoa) da se ne proverava svaki dan.
      await admin.from("groups").update({ offer_sent_at: now }).eq("id", g.id);
    }
  }

  return NextResponse.json({ reminders, offers });
}

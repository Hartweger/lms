import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextNivoFor, grupniSlugForNivo } from "@/lib/course-nivo";
import { sendNatasaNextTermReminder, sendNextLevelOffer, sendProfNextGroupReminder } from "@/lib/email";
import { formatDaysFull } from "@/lib/groups";
import { SITE_URL } from "@/lib/site-url";

// Dnevni cron: podsetnik adminu 14 dana pre kraja + ponuda polaznicima 7 dana pre kraja.
async function cronHandler(request: NextRequest) {
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

  const groups = must(
    await admin
      .from("groups")
      .select("id, level, end_date, term_opened_at, reminder_sent_at, offer_sent_at, prof_reminder_sent_at, professor:professor_id(full_name, email)")
      .in("status", ["otvoren", "u_toku"])
      .not("end_date", "is", null),
    "groups"
  );

  /** Aktivni polaznici grupe (posle poslednjeg otvaranja termina, ako ga ima). */
  async function polazniciZa(g: { id: string; term_opened_at: string | null }) {
    let q = admin
      .from("group_enrollments")
      .select("enrolled_at, user:user_id(email, full_name)")
      .eq("group_id", g.id).eq("status", "active");
    if (g.term_opened_at) q = q.gte("enrolled_at", g.term_opened_at);
    const rows = must(await q, "group_enrollments");
    return (rows ?? []).map((e) => {
      const u = Array.isArray(e.user) ? e.user[0] : e.user;
      return { email: u?.email ?? "", ime: u?.full_name ?? "" };
    }).filter((p) => p.email);
  }

  /**
   * Najbliža otvorena grupa datog nivoa koja kreće posle `afterDate`.
   * Koriste je i ponuda polaznicima i podsetnik profesorki - konkretan datum,
   * termin i broj slobodnih mesta ubedljivije prodaju od gole prodajne strane.
   */
  async function sledecaGrupa(nivo: string | null, afterDate: string) {
    if (!nivo) return null;
    const kandidati = must(
      await admin
        .from("groups")
        .select("id, level, start_date, days, session_time, max_seats, professor:professor_id(full_name)")
        .eq("level", nivo).eq("status", "otvoren").gte("start_date", afterDate)
        .order("start_date", { ascending: true }).limit(1),
      "next-level group"
    );
    const n = (kandidati ?? [])[0];
    if (!n) return null;
    const upisani = must(
      await admin.from("group_enrollments").select("id").eq("group_id", n.id).eq("status", "active"),
      "next-level enrollments"
    );
    const nProf = Array.isArray(n.professor) ? n.professor[0] : n.professor;
    return {
      nivo: n.level,
      startDate: n.start_date as string,
      dani: formatDaysFull(n.days),
      vreme: (n.session_time ?? "") as string,
      profIme: nProf?.full_name || "",
      slobodno: Math.max(0, (n.max_seats ?? 6) - (upisani ?? []).length),
    };
  }

  let reminders = 0;
  let offers = 0;
  let profReminders = 0;

  for (const g of groups ?? []) {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    const profIme: string = prof?.full_name || "";
    const nextNivo = nextNivoFor(g.level);

    // 1) Podsetnik adminu - 14 dana pre kraja.
    if (!g.reminder_sent_at && g.end_date <= in14) {
      await sendNatasaNextTermReminder({ nivo: g.level, nextNivo, endDate: g.end_date, profIme });
      // Pad upisa mora da obori cron: bez reminder_sent_at bi admin sutra dobio dupli podsetnik.
      must(await admin.from("groups").update({ reminder_sent_at: now }).eq("id", g.id), "groups reminder_sent_at update");
      reminders++;
    }

    // 2) Ponuda polaznicima - 7 dana pre kraja.
    if (!g.offer_sent_at && g.end_date <= in7) {
      if (nextNivo) {
        const slug = grupniSlugForNivo(nextNivo);
        const courseUrl = slug ? `${SITE_URL}/kursevi/${slug}` : `${SITE_URL}/kursevi`;
        const sledeca = await sledecaGrupa(nextNivo, g.end_date);
        for (const p of await polazniciZa(g)) {
          await sendNextLevelOffer(p.email, p.ime, { currentNivo: g.level, nextNivo, courseUrl, sledeca });
          offers++;
        }
      }
      // Označi kao poslato (i kad nema sledećeg nivoa) da se ne proverava svaki dan.
      // Pad upisa mora da obori cron: bez offer_sent_at bi polaznici sutra dobili duplu ponudu.
      must(await admin.from("groups").update({ offer_sent_at: now }).eq("id", g.id), "groups offer_sent_at update");
    }

    // 3) Podsetnik profesorki - 14 dana pre kraja, da lično pozove svoju grupu u sledeći nivo.
    // Odluka 21.07.2026: lični poziv od profesorke, jer masovna slanja konvertuju 0.
    if (!g.prof_reminder_sent_at && g.end_date <= in14) {
      if (prof?.email) {
        await sendProfNextGroupReminder(prof.email, {
          profIme, nivo: g.level, endDate: g.end_date, nextNivo,
          polaznici: await polazniciZa(g),
          sledeca: await sledecaGrupa(nextNivo, g.end_date),
          rasporedUrl: `${SITE_URL}/raspored`,
        });
        profReminders++;
      }
      // Flag i kad profesorka nije dodeljena, da se grupa ne proverava svaki dan.
      // Pad upisa mora da obori cron: bez flaga bi profesorka sutra dobila dupli podsetnik.
      must(await admin.from("groups").update({ prof_reminder_sent_at: now }).eq("id", g.id), "groups prof_reminder_sent_at update");
    }
  }

  return NextResponse.json({ reminders, offers, profReminders });
}

export const GET = withCronLog("grupe-podsetnik", cronHandler);

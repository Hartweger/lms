import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { callGas } from "@/lib/gas";
import { computeEndDate } from "@/lib/groups";
import { syncGroupSessions } from "@/lib/group-sessions";

// POST: napravi termin (ako ga nema) ILI pomeri postojeći na nove datume - ISTI Meet, BEZ reseta prijava.
// Izuzetak: promenjena profesorka - Google serija živi u KALENDARU profesorke (GAS piše po prof.email),
// pa se stari termin gasi i otvara nov kod nove; tada se Meet link nužno menja.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { id } = await params;

  const { data: g } = await admin
    .from("groups")
    .select("id, level, days, session_time, duration_weeks, sessions_count, start_date, gcal_event_id, calendar_id, notes_doc_id, professor_id, professor:professor_id(full_name, email)")
    .eq("id", id)
    .single();
  if (!g) return NextResponse.json({ error: "Grupa ne postoji" }, { status: 404 });

  const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
  const profIme = prof?.full_name || "";
  const profMejl = (prof?.email || "").toLowerCase();
  if (!profIme) return NextResponse.json({ error: "Grupa nema profesorku" }, { status: 400 });
  if (!g.days?.length || !g.session_time || !g.duration_weeks || !g.start_date) {
    return NextResponse.json({ error: "Grupi fale dani/sat/trajanje/datum početka" }, { status: 400 });
  }

  // Lista polaznika (aktivni upisi) → u beleške grupe (ime + mejl).
  let polaznici: { ime: string; mejl: string }[] = [];
  const { data: enr } = await admin.from("group_enrollments").select("user_id").eq("group_id", id).eq("status", "active");
  const uids = (enr ?? []).map((e) => e.user_id);
  if (uids.length) {
    const { data: profs } = await admin.from("user_profiles").select("full_name, email").in("id", uids);
    polaznici = (profs ?? []).map((pf) => ({ ime: pf.full_name || "", mejl: pf.email || "" }));
  }

  // `calendar_id` pamti U ČIJEM je kalendaru serija napravljena. Kad se ne poklapa sa
  // trenutnom profesorkom, `moveTerm` bi gađao pogrešan kalendar i vratio "Not Found"
  // (B1.1, 29.08.2026: event ostao kod Suzane, grupa prešla Mariji).
  const stariKalendar = (g.calendar_id || "").toLowerCase();
  const seliSe = !!g.gcal_event_id && !!stariKalendar && !!profMejl && stariKalendar !== profMejl;

  if (seliSe) {
    // Ime stare profesorke - GAS traži profil po imenu, ne po mejlu. Fallback na lokalni deo
    // mejla (marija@hartweger.rs → "marija"), jer GAS ionako poredi samo prvo ime.
    const { data: staraProf } = await admin.from("user_profiles").select("full_name").eq("email", stariKalendar).maybeSingle();
    const staroIme = staraProf?.full_name || stariKalendar.split("@")[0];
    try {
      await callGas("deleteTerm", { prof: staroIme, eventId: g.gcal_event_id, notesDocId: g.notes_doc_id });
    } catch (e) {
      // Ne prekidaj: nov termin je važniji od počišćenog starog. Ostatak se vidi u kalendaru.
      console.error(`[osvezi-termin] gašenje starog termina palo (grupa ${id}, kalendar ${stariKalendar}):`, e);
    }
  }

  const payload = { nivo: g.level, prof: profIme, days: g.days, time: g.session_time, weeks: g.duration_weeks, sessions: g.sessions_count ?? null, startDate: g.start_date, polaznici };
  let gas;
  try {
    gas = g.gcal_event_id && !seliSe
      ? await callGas("moveTerm", { ...payload, eventId: g.gcal_event_id })
      : await callGas("openTerm", payload);
  } catch (e) {
    return NextResponse.json({ error: "Google greška: " + (e instanceof Error ? e.message : String(e)) }, { status: 502 });
  }

  const update: Record<string, unknown> = {
    gcal_event_id: gas.eventId ?? g.gcal_event_id ?? null,
    meet_link: gas.meetLink ?? null,
    calendar_id: profMejl || null,
    end_date: computeEndDate(g.start_date, g.days, g.duration_weeks, g.sessions_count),
    status: "otvoren",
    updated_at: new Date().toISOString(),
  };
  // Beleške postoje samo kad je openTerm napravio nov dokument; kod moveTerm zadržavamo stari.
  if (gas.notesUrl) { update.notes_url = gas.notesUrl; update.notes_doc_id = gas.notesDocId ?? null; }

  const { error } = await admin.from("groups").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Nov event = prazna lista gostiju. Vrati aktivne polaznike na termin, podeli im beleške i
  // upiši ih u tabelu (nove) profesorke. `enroll` je idempotentan (gost i red u tabeli se ne dupliraju),
  // pa isto zatvara i staru rupu: termin napravljen POSLE kupovine ostajao je bez gostiju.
  const novEvent = !g.gcal_event_id || seliSe;
  const noviEventId = (gas.eventId as string | undefined) ?? null;
  let vraceno = 0;
  if (novEvent && noviEventId && polaznici.length) {
    for (const p of polaznici) {
      if (!p.mejl) continue;
      try {
        await callGas("enroll", {
          nivo: g.level, prof: profIme, eventId: noviEventId,
          notesDocId: (gas.notesDocId as string | undefined) ?? null,
          studentEmail: p.mejl, studentName: p.ime,
        });
        vraceno++;
      } catch (e) {
        console.error(`[osvezi-termin] vraćanje polaznika ${p.mejl} na termin palo (grupa ${id}):`, e);
      }
    }
  }

  // Auto-izvedi grupne sesije iz rasporeda (za honorar). Best-effort.
  await syncGroupSessions(admin, { id: g.id, professor_id: g.professor_id, start_date: g.start_date, days: g.days, duration_weeks: g.duration_weeks, sessions_count: g.sessions_count });

  return NextResponse.json({
    ok: true,
    meetLink: gas.meetLink ?? null,
    notesUrl: gas.notesUrl ?? null,
    preseljeno: seliSe,
    polaznikaVraceno: vraceno,
    polaznikaUkupno: polaznici.length,
  });
}

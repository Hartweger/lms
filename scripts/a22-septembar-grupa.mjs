// Nova A2.2 grupa (nastavak tekuće A2.1 koja završava 21.09.2026).
// Pon+sre 18-19, Milica Vučić, start 28.09.2026, 14 časova.
// Radi isto što i admin: insert -> GAS openTerm -> end_date/meet/beleške -> sesije -> status otvoren.
// Pokretanje: node scripts/a22-septembar-grupa.mjs           (suvo, samo ispis)
//             node scripts/a22-septembar-grupa.mjs --apply   (stvarno)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const MILICA = "7e65e4f7-7f77-4a05-8e66-c5d1cce3d12e";
const A22_CONTENT = "0b4a095e-2841-4fe8-b6b0-ed0973a30e31";
const NOVA = {
  content_course_id: A22_CONTENT,
  purchasable_course_id: null,
  level: "A2.2",
  type: "grupni",
  professor_id: MILICA,
  status: "planiran",
  start_date: "2026-09-28",
  duration_weeks: 7,
  days: [1, 3],
  session_time: "18:00-19:00",
  min_seats: 3,
  max_seats: 6,
  source: "rucni-unos-2026-06",
};

function sessionDates(startDate, days, weeks, sessionsCount) {
  const total = sessionsCount && sessionsCount > 0 ? sessionsCount : weeks * days.length;
  const jsDays = new Set(days.map((d) => (d === 7 ? 0 : d)));
  const d = new Date(startDate + "T00:00:00Z");
  const out = [];
  let guard = 0;
  while (out.length < total && guard < 1000) {
    if (jsDays.has(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
    guard++;
  }
  return out;
}

async function callGas(action, payload) {
  const res = await fetch(env.GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, secret: env.GAS_SECRET, ...payload }),
    redirect: "follow",
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`GAS nevažeći odgovor (${res.status}): ${text.slice(0, 200)}`); }
  if (!json.ok) throw new Error(json.error || "GAS greška");
  return json;
}

const dates = sessionDates(NOVA.start_date, NOVA.days, NOVA.duration_weeks, null);
console.log(`A2.2 · pon+sre ${NOVA.session_time} · Milica · ${dates.length} časova`);
console.log(`prvi ${dates[0]} · poslednji ${dates[dates.length - 1]}`);
console.log(dates.join(", "));

// Zaštita od duplikata (isto što radi admin ruta).
const { data: dup } = await sb.from("groups").select("id, status")
  .eq("level", NOVA.level).eq("professor_id", MILICA).eq("start_date", NOVA.start_date)
  .in("status", ["planiran", "uskoro", "otvoren", "u_toku"]).limit(1).maybeSingle();
if (dup) { console.log("STOP: već postoji takva grupa", dup); process.exit(1); }

if (!APPLY) { console.log("\n(suvo — dodaj --apply)"); process.exit(0); }

const { data: g, error } = await sb.from("groups").insert(NOVA).select("id").single();
if (error) throw error;
console.log("upisana grupa", g.id);

const gas = await callGas("openTerm", {
  nivo: NOVA.level, prof: "Milica Vučić", days: NOVA.days, time: NOVA.session_time,
  weeks: NOVA.duration_weeks, sessions: null, startDate: NOVA.start_date, polaznici: [],
});
console.log("GAS:", { eventId: gas.eventId, meetLink: gas.meetLink, notesUrl: gas.notesUrl });

const update = {
  gcal_event_id: gas.eventId ?? null,
  meet_link: gas.meetLink ?? null,
  end_date: dates[dates.length - 1],
  status: "otvoren",
  updated_at: new Date().toISOString(),
};
if (gas.notesUrl) { update.notes_url = gas.notesUrl; update.notes_doc_id = gas.notesDocId ?? null; }
const { error: e2 } = await sb.from("groups").update(update).eq("id", g.id);
if (e2) throw e2;

const { error: e3 } = await sb.from("group_sessions")
  .upsert(dates.map((session_date) => ({ group_id: g.id, professor_id: MILICA, session_date, source: "auto" })),
    { onConflict: "group_id,session_date", ignoreDuplicates: true });
if (e3) throw e3;

console.log("GOTOVO. Grupa otvorena, end_date", update.end_date, "· sesija:", dates.length);

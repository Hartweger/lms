// Nova B1.1 grupa - nastavak A2.2 (Milica, pon+sre 18-19) koja završava 11.11.2026.
// Pon+sre 18-19, Milica Vučić, start pon 16.11.2026, 14 časova, PRAZNIČNA PAUZA 23.12-09.01.
//
// ZAŠTO sessions_count = 19 a časova je 14:
//   Google serija (RRULE COUNT) ne zna za pauzu. Pravimo COUNT=19 (16.11 -> 18.01.2027) pa se
//   5 instanci u pauzi (23.12, 28.12, 30.12, 04.01, 06.01) OTKAZUJE u kalendaru.
//   Ostaje tačno 14 časova, isti Meet link, jedna serija. `computeEndDate` sa 19 daje 18.01.2027,
//   što je i stvarni poslednji čas - pa se end_date poklapa.
//   U `group_sessions` idu SAMO 14 stvarnih datuma (honorar i /raspored čitaju njih).
//
// Pokretanje: node scripts/b11-novembar-grupa.mjs           (suvo, samo ispis)
//             node scripts/b11-novembar-grupa.mjs --apply   (stvarno)
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
const MILICA_MEJL = "milica@hartweger.rs";
const B11_CONTENT = "b8c765b7-c377-4941-a1f9-ebe39372fe4a"; // „Nemački B1.1", kao B1.1 od 19.09

const PAUZA_OD = "2026-12-23"; // 22.12 se RADI (odluka Nataše 30.09)
const PAUZA_DO = "2027-01-09";
const GCAL_COUNT = 19; // 14 časova + 5 instanci u pauzi koje se otkazuju

const NOVA = {
  content_course_id: B11_CONTENT,
  purchasable_course_id: null,
  level: "B1.1",
  type: "grupni",
  professor_id: MILICA,
  status: "planiran",
  start_date: "2026-11-16",
  duration_weeks: 7,
  sessions_count: GCAL_COUNT,
  days: [1, 3],
  session_time: "18:00-19:00",
  min_seats: 3,
  max_seats: 6,
  notes:
    "PRAZNIČNA PAUZA 23.12.2026-09.01.2027 (22.12 se RADI). Nastava: 16.11-21.12 (11 časova), pa 11.01-18.01.2027 (3 časa) = 14. " +
    "sessions_count=19 je namerno - toliko instanci ima Google serija; 5 instanci u pauzi je OTKAZANO u kalendaru. " +
    "PAZI: klik na „Osveži termin\" prepisuje sesije po formuli i VRAĆA 5 časova u pauzu - posle klika ih ponovo otkazati " +
    "(u kalendaru i u group_sessions).",
  source: "rucni-unos-2026-06",
};

function serija(startDate, days, count) {
  const jsDays = new Set(days.map((d) => (d === 7 ? 0 : d)));
  const d = new Date(startDate + "T00:00:00Z");
  const out = [];
  let guard = 0;
  while (out.length < count && guard < 1000) {
    if (jsDays.has(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
    guard++;
  }
  return out;
}

const uPauzi = (s) => s >= PAUZA_OD && s <= PAUZA_DO;

// GAS /exec vraća 302, a Node fetch sa redirect:"follow" pretvori POST u GET i stigne doGet
// health JSON bez eventId/meetLink (zamka 09.09.2026). Zato redirect pratimo ručno.
async function callGas(action, payload) {
  const body = JSON.stringify({ action, secret: env.GAS_SECRET, ...payload });
  const res = await fetch(env.GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(120000),
  });
  let text;
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (!loc) throw new Error(`GAS ${res.status} bez Location`);
    const res2 = await fetch(loc, { method: "GET", signal: AbortSignal.timeout(120000) });
    text = await res2.text();
  } else {
    text = await res.text();
  }
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`GAS nevažeći odgovor (${res.status}): ${text.slice(0, 300)}`); }
  if (!json.ok) throw new Error(json.error || "GAS greška");
  if (!json.eventId) throw new Error(`GAS odgovor bez eventId: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

const sve = serija(NOVA.start_date, NOVA.days, GCAL_COUNT);
const nastava = sve.filter((d) => !uPauzi(d));
const otkazati = sve.filter(uPauzi);
const END = sve[sve.length - 1];

console.log(`B1.1 · pon+sre ${NOVA.session_time} · Milica Vučić · ${nastava.length} časova`);
console.log(`prvi ${nastava[0]} · poslednji ${nastava[nastava.length - 1]} (= end_date ${END})`);
console.log(`nastava: ${nastava.join(", ")}`);
console.log(`OTKAZATI u kalendaru (${otkazati.length}): ${otkazati.join(", ")}`);
if (nastava.length !== 14) { console.log("STOP: nije 14 časova"); process.exit(1); }

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
  weeks: NOVA.duration_weeks, sessions: GCAL_COUNT, startDate: NOVA.start_date, polaznici: [],
});
console.log("GAS:", { eventId: gas.eventId, meetLink: gas.meetLink, notesUrl: gas.notesUrl, reused: gas.reused ?? false });

const update = {
  gcal_event_id: gas.eventId ?? null,
  meet_link: gas.meetLink ?? null,
  calendar_id: MILICA_MEJL, // bez ovoga moveTerm gađa pogrešan kalendar (zamka B1.1, 29.08.2026)
  end_date: END,
  status: "otvoren",
  updated_at: new Date().toISOString(),
};
if (gas.notesUrl) { update.notes_url = gas.notesUrl; update.notes_doc_id = gas.notesDocId ?? null; }
const { error: e2 } = await sb.from("groups").update(update).eq("id", g.id);
if (e2) throw e2;

const { error: e3 } = await sb.from("group_sessions")
  .upsert(nastava.map((session_date) => ({ group_id: g.id, professor_id: MILICA, session_date, source: "auto" })),
    { onConflict: "group_id,session_date", ignoreDuplicates: true });
if (e3) throw e3;

console.log("GOTOVO. Grupa otvorena, end_date", END, "· sesija u bazi:", nastava.length);
console.log(`SLEDEĆE RUČNO: otkazati ${otkazati.length} instanci u Miličinom kalendaru:`, otkazati.join(", "));

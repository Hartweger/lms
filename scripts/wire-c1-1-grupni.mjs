// C1.1 sadržaj postaje prateći materijal grupnog kursa C1.1 (odluka 25.07.2026).
// 1) course_unlocks: grupni-kurs-c1-1 -> nemacki-c1-1
// 2) nemacki-c1-1 is_published = true (lekcije i dalje traže course_access)
// 3) groups.content_course_id = nemacki-c1-1 za aktivne C1.1 grupe (professor_students veza)
// 4) backfill course_access za već upisane polaznike aktivnih C1.1 grupa
// Idempotentno. Bez --apply je dry-run.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const log = (s) => console.log(s);

const { data: courses, error: cErr } = await sb
  .from("courses").select("id,slug,is_published").in("slug", ["grupni-kurs-c1-1", "nemacki-c1-1"]);
if (cErr) throw cErr;
const prod = courses.find((c) => c.slug === "grupni-kurs-c1-1");
const content = courses.find((c) => c.slug === "nemacki-c1-1");
if (!prod || !content) throw new Error("Nedostaje grupni-kurs-c1-1 ili nemacki-c1-1");

// --- 1) unlock mapa
const { data: unlock } = await sb.from("course_unlocks").select("id")
  .eq("purchasable_course_id", prod.id).eq("content_course_id", content.id).maybeSingle();
if (unlock) log("= course_unlocks veza već postoji");
else {
  log("+ course_unlocks: grupni-kurs-c1-1 -> nemacki-c1-1");
  if (APPLY) {
    const { error } = await sb.from("course_unlocks")
      .insert({ purchasable_course_id: prod.id, content_course_id: content.id });
    if (error) throw error;
  }
}

// --- 2) objavi sadržajni kurs
if (content.is_published) log("= nemacki-c1-1 je već is_published");
else {
  log("~ nemacki-c1-1: is_published false -> true");
  if (APPLY) {
    const { error } = await sb.from("courses").update({ is_published: true }).eq("id", content.id);
    if (error) throw error;
  }
}

// --- 3) veza grupa -> sadržaj (za professor_students)
const AKTIVNI = ["otvoren", "u_toku", "planirana", "najava"];
const { data: groups, error: gErr } = await sb
  .from("groups").select("id,level,status,start_date,content_course_id,professor_id")
  .eq("level", "C1.1").eq("type", "grupni");
if (gErr) throw gErr;
const aktivne = (groups ?? []).filter((g) => AKTIVNI.includes(g.status));
log(`Grupe C1.1: ${groups.length} ukupno, ${aktivne.length} aktivnih (${AKTIVNI.join("/")})`);
for (const g of aktivne) {
  if (g.content_course_id === content.id) { log(`= grupa ${g.id} (${g.start_date}) već vezana`); continue; }
  log(`~ grupa ${g.id} (${g.start_date}): content_course_id ${g.content_course_id ?? "NULL"} -> nemacki-c1-1`);
  if (APPLY) {
    const { error } = await sb.from("groups").update({ content_course_id: content.id }).eq("id", g.id);
    if (error) throw error;
  }
}

// --- 4) backfill pristupa za već upisane
const grupaIds = aktivne.map((g) => g.id);
let enrollments = [];
if (grupaIds.length) {
  const { data, error } = await sb.from("group_enrollments").select("user_id,group_id,status").in("group_id", grupaIds);
  if (error) throw error;
  enrollments = (data ?? []).filter((e) => e.status === "active");
}
log(`Aktivnih upisa u te grupe: ${enrollments.length}`);
for (const e of enrollments) {
  const { data: acc } = await sb.from("course_access").select("id,expires_at")
    .eq("user_id", e.user_id).eq("course_id", content.id).maybeSingle();
  if (acc && (!acc.expires_at || new Date(acc.expires_at) > new Date())) {
    log(`= pristup već aktivan: user ${e.user_id}`);
    continue;
  }
  const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
  log(`+ course_access: user ${e.user_id} -> nemacki-c1-1 (do ${expires.toISOString().slice(0, 10)})`);
  if (APPLY) {
    const { error } = await sb.from("course_access").upsert(
      { user_id: e.user_id, course_id: content.id, expires_at: expires.toISOString(), source: "group:c1-1-backfill" },
      { onConflict: "user_id,course_id" },
    );
    if (error) throw error;
  }
}

log(APPLY ? "GOTOVO (apply)." : "GOTOVO (dry-run). Pokreni sa --apply.");

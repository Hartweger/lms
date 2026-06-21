// Provera kompletnog setupa konverzacijskog kursa.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ok = (b) => (b ? "✅" : "❌");
const warn = "⚠️ ";
let fails = 0; const F = (b) => { if (!b) fails++; return ok(b); };

const PSLUG = "grupni-konverzacijski-kurs-nemackog-b1";
const CSLUG = "konverzacijski-b1-sadrzaj";

const { data: p } = await sb.from("courses").select("*").eq("slug", PSLUG).maybeSingle();
const { data: c } = await sb.from("courses").select("*").eq("slug", CSLUG).maybeSingle();

console.log("=== KUPOVNI KURS ===");
console.log(F(!!p), "postoji:", PSLUG);
if (p) {
  console.log(F(p.is_purchasable), "is_purchasable =", p.is_purchasable);
  console.log(F(p.is_published), "is_published =", p.is_published);
  console.log(F(Number(p.price) === 17550), "price =", p.price);
  console.log(F(p.paypal_price_eur === 150), "paypal_price_eur =", p.paypal_price_eur);
  console.log(F(p.category === "grupni"), "category =", p.category);
  console.log(F(p.course_type === "group"), "course_type =", p.course_type);
  console.log(F(!!p.marketing_description), "marketing_description postoji");
  console.log(F(Array.isArray(p.features) && p.features.length >= 3), "features =", p.features?.length);
}

console.log("\n=== SADRŽAJNI KURS ===");
console.log(F(!!c), "postoji:", CSLUG);
if (c) {
  console.log(F(c.is_published), "is_published =", c.is_published);
  console.log(F(!c.is_purchasable), "NIJE purchasable =", !c.is_purchasable);
}

let lessons = [];
if (c) {
  const { data } = await sb.from("lessons").select("order_index,title,sections").eq("course_id", c.id).order("order_index");
  lessons = data || [];
}
console.log("\n=== LEKCIJE SADRŽAJNOG KURSA ===");
console.log(F(lessons.length === 8), "broj lekcija =", lessons.length, "(očekivano 8)");
const willk = lessons.find((l) => l.order_index === 0);
console.log(F(willk && (willk.sections || []).some((s) => s.type === "text")), "Willkommen (#0, text) =", willk?.title);
let totalWords = 0; let wsCount = 0;
for (const l of lessons.filter((x) => x.order_index > 0)) {
  const w = (l.sections || []).find((s) => s.type === "wordset");
  if (w) { wsCount++; totalWords += w.items.length; }
}
console.log(F(wsCount === 7), "wordset lekcija =", wsCount, "(očekivano 7)");
console.log(F(totalWords === 243), "ukupno reči =", totalWords, "(očekivano 243)");
// provera da front ima član+množinu na uzorku
const sample = (lessons.find((l) => (l.sections || []).some((s) => s.type === "wordset"))?.sections || []).find((s) => s.type === "wordset")?.items?.[0];
console.log(F(sample && /^(der|die|das)\s/.test(sample.front)), "front ima član:", JSON.stringify(sample));

console.log("\n=== POVEZIVANJE (course_unlocks) ===");
let u = [];
if (p && c) { const { data } = await sb.from("course_unlocks").select("*").eq("purchasable_course_id", p.id).eq("content_course_id", c.id); u = data || []; }
console.log(F(u.length === 1), "course_unlocks grupni→sadržajni =", u.length === 1 ? "vezano" : "NEMA");

console.log("\n=== GRUPA ===");
const { data: g } = await sb.from("groups").select("*, professor:professor_id(full_name)").eq("level", "Konverzacija B1+").eq("start_date", "2026-07-03").maybeSingle();
console.log(F(!!g), "grupa postoji (Konverzacija B1+, 2026-07-03)");
if (g) {
  console.log(F(g.status === "otvoren"), "status =", g.status);
  console.log(F(g.content_course_id === c?.id), "content_course_id → sadržajni =", g.content_course_id === c?.id);
  console.log(F(JSON.stringify(g.days) === "[5]"), "days =", JSON.stringify(g.days), "(petak)");
  console.log(F(g.session_time === "13:00-14:00"), "session_time =", g.session_time);
  console.log(F(g.duration_weeks === 9), "duration_weeks =", g.duration_weeks);
  console.log(F(g.min_seats === 3 && g.max_seats === 6), "mesta min/max =", g.min_seats + "/" + g.max_seats);
  console.log(F(!!g.professor?.full_name), "profesor =", g.professor?.full_name);
  const { count } = await sb.from("group_enrollments").select("*", { count: "exact", head: true }).eq("group_id", g.id).eq("status", "active");
  const enrolled = (g.manual_enrolled ?? 0) + (count ?? 0);
  console.log("ℹ️ ", "upisano =", enrolled, "/ slobodno =", g.max_seats - enrolled);
  console.log((g.meet_link || g.gcal_event_id) ? "✅ Meet/termin generisan" : warn + "Meet link JOŠ NIJE generisan → /admin/grupe „Napravi/osveži termin\"");
}

console.log("\n=== REZULTAT ===");
console.log(fails === 0 ? "✅ SVE PROŠLO" : "❌ " + fails + " problema");

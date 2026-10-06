// B1.1 od 16.11.2026 (Milica) - beleške na platformi umesto Google Doc-a.
// Pokretanje: node scripts/b11-novembar-beleske-platforma.mjs [--apply]
// --apply TEK POSLE DEPLOYA (pre toga produkcioni kod ne zna za prekidač).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const GROUP_ID = "894f5bde-c677-4d0b-a459-39780b739b3f";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: g, error } = await sb.from("groups")
  .select("id, level, start_date, notes_on_platform, notes_url, notes_doc_id").eq("id", GROUP_ID).single();
if (error) throw error;
console.log("pre:", g);
if (g.level !== "B1.1" || g.start_date !== "2026-11-16") { console.log("STOP: nije očekivana grupa"); process.exit(1); }
const { count } = await sb.from("group_enrollments").select("*", { count: "exact", head: true }).eq("group_id", GROUP_ID).eq("status", "active");
console.log("aktivnih upisa:", count, count ? "(PAZI: oni su već dobili mejl sa Google Doc linkom)" : "");
if (!APPLY) { console.log("(suvo - dodaj --apply)"); process.exit(0); }

const { error: e2 } = await sb.from("groups")
  .update({ notes_on_platform: true, notes_url: null, notes_doc_id: null, updated_at: new Date().toISOString() })
  .eq("id", GROUP_ID);
if (e2) throw e2;
console.log("GOTOVO. Google Doc ostaje na Drive-u (nije obrisan):", g.notes_url);

// Read-only verifikator auto-linkinga za blok A.
// Upotreba:  npx tsx scripts/check-auth-linking.mjs <email>
// Proverava za dati email: koliko naloga postoji (mora 1), koji su identiteti
// (provider), i koliko course_access redova ima taj nalog (mora ostati netaknuto).

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "").toLowerCase().trim();
if (!email) { console.error("Daj email: npx tsx scripts/check-auth-linking.mjs ana@example.com"); process.exit(1); }

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const line = raw.replace(/\r$/, "");
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// nadji sve naloge sa tim emailom (case-insensitive) — listanje pa filter
const matches = [];
let page = 1;
while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error("listUsers:", error.message); process.exit(1); }
  for (const u of data.users) if ((u.email || "").toLowerCase().trim() === email) matches.push(u);
  if (data.users.length < 1000) break;
  page++;
}

console.log(`\n=== Naloga sa emailom ${email}: ${matches.length} ===`);
if (matches.length === 0) { console.log("Nema naloga sa tim emailom."); process.exit(0); }
if (matches.length > 1) console.log("⚠️  VISE OD JEDNOG NALOGA = DUPLIKAT! Auto-linking je pao -> treba merge/SQL fix.");

for (const u of matches) {
  const { data: byId } = await supabase.auth.admin.getUserById(u.id);
  const provs = (byId?.user?.identities || []).map(i => i.provider);
  const { count } = await supabase.from("course_access").select("*", { count: "exact", head: true }).eq("user_id", u.id);
  console.log(`\n  nalog ${u.id}`);
  console.log(`    email_confirmed_at: ${u.email_confirmed_at || "(nije)"}`);
  console.log(`    identiteti (provideri): ${provs.length ? provs.join(", ") : "(nijedan)"}`);
  console.log(`    course_access redova: ${count}`);
  console.log(`    poslednja prijava: ${u.last_sign_in_at || "(nikad)"}`);
}
console.log(`\nOK kriterijum: tacno 1 nalog, sadrzi 'google' medju identitetima, course_access > 0.`);

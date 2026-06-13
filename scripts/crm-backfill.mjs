// Jednokratni uvoz postojećih lidova u crm_contacts.
// Pokretanje: node scripts/crm-backfill.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Fali SUPABASE env."); process.exit(1); }
const db = createClient(url, key);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (e) => (typeof e === "string" && EMAIL_RE.test(e.trim().toLowerCase()) ? e.trim().toLowerCase() : null);

async function exists(email) {
  const { data } = await db.from("crm_contacts").select("id").ilike("email", email).limit(1);
  return data?.[0]?.id ?? null;
}

let created = 0, skipped = 0;

// naki_profiles
const { data: naki } = await db.from("naki_profiles").select("email,name,level").limit(10000);
for (const p of naki ?? []) {
  const email = norm(p.email);
  if (!email) { skipped++; continue; }
  if (await exists(email)) { skipped++; continue; }
  await db.from("crm_contacts").insert({ email, name: p.name || null, level: p.level || null, source: "naki", stage: "nov" });
  created++;
}

// masterclass_signups
const { data: mc } = await db.from("masterclass_signups").select("email").limit(10000);
for (const m of mc ?? []) {
  const email = norm(m.email);
  if (!email) { skipped++; continue; }
  if (await exists(email)) { skipped++; continue; }
  await db.from("crm_contacts").insert({ email, source: "masterclass", stage: "nov" });
  created++;
}

console.log(`Backfill gotov: kreirano ${created}, preskočeno ${skipped}.`);

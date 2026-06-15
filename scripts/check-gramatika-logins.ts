/**
 * Provera: koliko Gramatika kupaca (kojima je danas poslat mejl) se ulogovalo na www.hartweger.rs.
 *   npx tsx scripts/check-gramatika-logins.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Datum slanja mejla: gramatika-kupci.csv je sačuvan 2026-06-02 ~15:00. Uzimamo ceo 2. jun.
const SEND_DAY = "2026-06-02";

function csvEmails(): { email: string; name: string }[] {
  const csv = fs.readFileSync(path.resolve(__dirname, "../gramatika-kupci.csv"), "utf-8").trim().split("\n").slice(1);
  return csv.map((l) => {
    // ime može biti u navodnicima sa zarezom unutra
    const m = l.match(/^("([^"]*)"|[^,]*),([^,]+),/);
    const name = m ? (m[2] ?? m[1]) : "";
    const email = m ? m[3].trim().toLowerCase() : "";
    return { email, name };
  }).filter((r) => r.email);
}

async function authMap(): Promise<Map<string, { last: string | null; created: string }>> {
  const map = new Map<string, { last: string | null; created: string }>();
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email) map.set(u.email.toLowerCase(), { last: u.last_sign_in_at ?? null, created: u.created_at });
    }
    if (data.users.length < 1000) break;
    page++;
  }
  return map;
}

async function run() {
  const list = csvEmails();
  const auth = await authMap();

  let nalog = 0, ikadLog = 0, danasLog = 0, nemaNalog = 0, nikadLog = 0;
  const danas: string[] = [];
  const nikad: string[] = [];
  const bezNaloga: string[] = [];

  for (const r of list) {
    const a = auth.get(r.email);
    if (!a) { nemaNalog++; bezNaloga.push(r.email); continue; }
    nalog++;
    if (!a.last) { nikadLog++; nikad.push(r.email); continue; }
    ikadLog++;
    if (a.last.slice(0, 10) >= SEND_DAY) { danasLog++; danas.push(`${r.email}  (${a.last.slice(0, 16).replace("T", " ")})`); }
  }

  console.log(`\n=== GRAMATIKA migracija — login provera (${list.length} kupaca u CSV) ===\n`);
  console.log(`Imaju nalog na LMS-u:     ${nalog}/${list.length}`);
  console.log(`  ↳ ulogovali se IKAD:    ${ikadLog}`);
  console.log(`  ↳ ulogovali se OD MEJLA (>=${SEND_DAY}): ${danasLog}`);
  console.log(`  ↳ nikad se nisu logovali: ${nikadLog}`);
  console.log(`NEMAJU nalog (greška/promašen mejl): ${nemaNalog}\n`);

  if (danas.length) { console.log(`--- Ulogovali se od mejla (${danas.length}) ---`); danas.forEach((e) => console.log("  " + e)); }
  if (bezNaloga.length) { console.log(`\n--- NEMAJU nalog (${bezNaloga.length}) ---`); bezNaloga.forEach((e) => console.log("  " + e)); }
  console.log(`\n(nikad logovani: ${nikadLog} — imaju nalog ali još nisu ušli)`);
}
run().catch((e) => { console.error(e); process.exit(1); });

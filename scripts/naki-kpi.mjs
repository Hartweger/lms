// NaKI KPI izveštaj — sve brojke za nedeljni pregled jednom komandom.
// Pokretanje:  node scripts/naki-kpi.mjs            (poslednjih 7 dana)
//              node scripts/naki-kpi.mjs 14         (poslednjih N dana)
// Plan i ciljevi: sajt/docs/naki/2026-06-12-naki-kpi-plan-v2.md
import { config } from "dotenv";
config({ path: new URL("../.env.local", import.meta.url).pathname });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const days = Math.max(1, parseInt(process.argv[2] ?? "7", 10) || 7);
const since = new Date(Date.now() - days * 86400e3).toISOString();
const sinceDay = since.slice(0, 10);

async function rest(path) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${path}${path.includes("?") ? "&" : "?"}offset=${from}&limit=1000`, { headers: H });
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
    all.push(...rows);
    if (rows.length < 1000) return all;
  }
}

const msgs = await rest(`naki_messages?select=session_id,role,message,level,user_id,created_at&created_at=gte.${since}&order=created_at.asc`);
const usage = await rest(`naki_daily_usage?select=day,count&day=gte.${sinceDay}&order=day.asc`);
const nakiOrders = await rest(`orders?select=order_number,email,total,payment_status,coupon_code,utm_source,created_at&or=(coupon_code.eq.NAKI10,utm_source.eq.naki)&created_at=gte.${since}`);

// ── Sesije ──
const sessions = new Map();
for (const m of msgs) {
  if (!sessions.has(m.session_id)) sessions.set(m.session_id, { user: 0, uid: null, capture: false });
  const s = sessions.get(m.session_id);
  if (m.role === "user") s.user++;
  if (m.user_id) s.uid = m.user_id;
  if (m.message.startsWith("[email_capture]")) s.capture = true;
}
const sess = [...sessions.values()].filter((s) => s.user > 0);
const captures = msgs.filter((m) => m.message.startsWith("[email_capture]")).length;
const gateEligible = sess.filter((s) => s.user >= 6).length;
const stoppedAtGate = sess.filter((s) => s.user === 6 && !s.capture).length; // stali tačno na gate-u bez mejla
const loggedIn = sess.filter((s) => s.uid).length;

// ── Zahtevi/dan vs limit ──
const reqTotal = usage.reduce((a, u) => a + u.count, 0);
const reqMax = usage.length ? Math.max(...usage.map((u) => u.count)) : 0;
const over1500 = usage.filter((u) => u.count > 1500).length;

// ── Porudžbine ──
const paidStatuses = new Set(["paid", "completed"]);
const naki10 = nakiOrders.filter((o) => o.coupon_code === "NAKI10");
const naki10Paid = naki10.filter((o) => paidStatuses.has(o.payment_status));
const utmNaki = nakiOrders.filter((o) => o.utm_source === "naki" && o.coupon_code !== "NAKI10");

const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + "%" : "—");
const f = (s, v) => console.log(s.padEnd(46, " ") + v);

console.log(`\n═══ NaKI KPI — poslednjih ${days} dana (od ${sinceDay}) ═══\n`);
f("Poruka ukupno:", msgs.length);
f("Sesija (sa bar 1 user porukom):", sess.length);
f("  od toga ulogovani:", `${loggedIn} (${pct(loggedIn, sess.length)})`);
f("Sesija stiglo do gate-a (≥6 poruka):", `${gateEligible} (${pct(gateEligible, sess.length)})`);
f("  stalo tačno na 6. poruci bez mejla:", `${stoppedAtGate} (${pct(stoppedAtGate, gateEligible)}) ← drop-off alarm ako raste`);
f("Email captures:", captures);
f("  capture rate (od svih sesija):", pct(captures, sess.length));
f("  capture rate (od onih koji su videli gate):", pct(captures, gateEligible));
f("Zahteva ukupno / pik dan / dana >1500:", `${reqTotal} / ${reqMax} / ${over1500} (limit 2000)`);
f("NAKI10 porudžbine (sve / plaćene):", `${naki10.length} / ${naki10Paid.length}`);
f("  prihod (plaćene):", naki10Paid.reduce((a, o) => a + (o.total ?? 0), 0) + " RSD");
f("Ostale porudžbine sa utm_source=naki:", utmNaki.length);

const lv = {};
for (const m of msgs) if (m.level && m.role === "user") lv[m.level] = (lv[m.level] || 0) + 1;
f("Nivoi (user poruke):", Object.entries(lv).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  ") || "—");

console.log(`\nRed za tracker tabelu:\n| ${sinceDay} → danas | ${sess.length} | ${gateEligible} | ${captures} | ${pct(captures, gateEligible)} | ${naki10Paid.length} | ${naki10Paid.reduce((a, o) => a + (o.total ?? 0), 0)} RSD |\n`);
console.log("Trošak: proveri Anthropic konzolu (console.anthropic.com → Billing) — cilj ≤$3/dan.\n");

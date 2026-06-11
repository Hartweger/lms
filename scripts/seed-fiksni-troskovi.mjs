// scripts/seed-fiksni-troskovi.mjs — unos fiksnih mesečnih troškova od juna 2026.
// Idempotentno: ako red sa istim `name` već postoji → preskočiti.
// Pokretanje: node scripts/seed-fiksni-troskovi.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) { console.error("Nema NEXT_PUBLIC_SUPABASE_URL u .env.local"); process.exit(1); }
if (!serviceRoleKey) { console.error("Nema SUPABASE_SERVICE_ROLE_KEY u .env.local"); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceRoleKey);

const STAVKE = [
  { name: "Knjigovođa",                    category: "usluge",            amount: 31152 },
  { name: "Održavanje sajta",              category: "usluge",            amount: 5000  },
  { name: "Fiskom licenca",               category: "alati-hosting",     amount: 1199  },
  { name: "Hostinger",                     category: "alati-hosting",     amount: 1458  },
  { name: "LearnDash",                     category: "alati-hosting",     amount: 2000  },
  { name: "MailerLite",                    category: "alati-hosting",     amount: 6688  },
  { name: "Google Workspace",              category: "alati-hosting",     amount: 14784 },
  { name: "Canva",                         category: "alati-hosting",     amount: 1764  },
  { name: "Veed",                          category: "alati-hosting",     amount: 2160  },
  { name: "CapCut",                        category: "alati-hosting",     amount: 600   },
  { name: "Vimeo",                         category: "alati-hosting",     amount: 1053  },
  { name: "Gamma",                         category: "alati-hosting",     amount: 2340  },
  { name: "PWA",                           category: "alati-hosting",     amount: 1160  },
  { name: "Eko taksa",                     category: "porezi-doprinosi",  amount: 420   },
  { name: "Porez na prostor",              category: "porezi-doprinosi",  amount: 2118  },
  { name: "Održavanje računa",             category: "provizije",         amount: 2000  },
  { name: "Meta tim — vođenje kampanja",   category: "oglasi",            amount: 35000 },
];

// Dohvati postojeće nazive
const { data: existing, error: fetchErr } = await supabase
  .from("expenses")
  .select("name");

if (fetchErr) { console.error("Greška pri čitanju expenses:", fetchErr.message); process.exit(1); }

const postojecaImena = new Set((existing ?? []).map((r) => r.name));

const uneseno = [];
const preskoceno = [];

for (const s of STAVKE) {
  if (postojecaImena.has(s.name)) {
    console.log(`  preskočeno: ${s.name}`);
    preskoceno.push(s);
    continue;
  }
  const { error } = await supabase.from("expenses").insert({
    name: s.name,
    category: s.category,
    amount: s.amount,
    recurring: true,
    expense_date: "2026-06-01",
    ended_at: null,
    course_id: null,
  });
  if (error) {
    console.error(`  GREŠKA pri unosu "${s.name}":`, error.message);
    process.exit(1);
  }
  console.log(`  uneseno:    ${s.name} (${s.category}, ${s.amount.toLocaleString("sr-RS")} RSD)`);
  uneseno.push(s);
}

console.log("");
console.log("=== Rezultat ===");
console.log(`Uneseno:    ${uneseno.length} stavki`);
console.log(`Preskočeno: ${preskoceno.length} stavki (već postoje)`);
console.log("");

if (uneseno.length > 0) {
  console.log("Unesene stavke:");
  console.log(
    ["Naziv", "Kategorija", "Iznos (RSD)"].join(" | ").padEnd(60) + ""
  );
  console.log("-".repeat(60));
  for (const s of uneseno) {
    const naziv = s.name.padEnd(35);
    const kat = s.category.padEnd(18);
    const iznos = s.amount.toLocaleString("sr-RS").padStart(8);
    console.log(`${naziv} ${kat} ${iznos}`);
  }
  const zbir = uneseno.reduce((s, x) => s + x.amount, 0);
  console.log("-".repeat(60));
  console.log(`${"ZBIR UNESENOG".padEnd(55)} ${zbir.toLocaleString("sr-RS").padStart(8)} RSD`);
}

const zbiraUkupno = STAVKE.reduce((s, x) => s + x.amount, 0);
console.log("");
console.log(`Mesečni zbir svih 17 stavki: ${zbiraUkupno.toLocaleString("sr-RS")} RSD`);

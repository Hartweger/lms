// Postavlja privremenu lozinku polazniku (rezerva kad magic link zakaže).
// Upotreba (iz LMS/lms):  node scripts/set-lozinka.mjs <email> [lozinka]
// Podrazumevana lozinka: Nemacki2026. Posle toga polaznik na /prijava kuca email + lozinku,
// a menja je na /profil (sekcija „Lozinka"). Vidi memory: reference_login_podrska_lozinka.
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const [email, lozinka = "Nemacki2026"] = process.argv.slice(2);
if (!email) {
  console.error("Upotreba: node scripts/set-lozinka.mjs <email> [lozinka]");
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: lista, error: e1 } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (e1) throw e1;
const user = lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`Nema naloga sa mejlom ${email}`);
  process.exit(1);
}

const { error: e2 } = await admin.auth.admin.updateUserById(user.id, { password: lozinka });
if (e2) throw e2;
console.log(`OK: lozinka postavljena za ${user.email} (${user.id})`);

// Napomena: prijava lozinkom iz skripte NE MOŽE da se proveri - Supabase Auth traži
// Turnstile captcha token (forma /prijava ga šalje, skripta nema odakle). Ako je
// updateUserById prošao bez greške, lozinka važi.
console.log(`Polazniku: www.hartweger.rs/prijava → email + lozinka „${lozinka}" → „Prijavi se".`);

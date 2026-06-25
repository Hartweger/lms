// Dodaje završnu poruku na kraj poslednje FSP lekcije ("Predstavljanje pacijenta").
// Ispravka (Milica, jun 2026): "kada se sve zavrsi ... da stoji ovo svakako kao poruka".
// Poruka: čestitka + ohrabrenje da je polaznik spreman za pravi Fachsprachprüfung.
// Dugme "Završi kurs / dalje" platforme već postoji u navigaciji lekcije.
// Idempotentno: prepoznaje raniju završnu poruku po markeru i zameni je.
// Dry-run default; --apply da primeniš.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const MARKER = "Srećno na ispitu";
const CLOSING = { type: "text", style: "info", content:
`## 🎉 Čestitamo, prešao/la si ceo FSP pripremni kurs!

Iza tebe su svi delovi: osnovne informacije o ispitu, gramatika, rečnik i delovi ispita - anamneza, dokumentacija, objašnjavanje i predstavljanje pacijenta.

Sada imaš sve što ti treba da samouvereno izađeš na **Fachsprachprüfung**. Veruj u svoje znanje, ostani smiren/na i govori prirodno sa pacijentom, baš kao što si vežbao/la.

**Srećno na ispitu! 💙**

*Tvoj Hartweger tim*` };

async function main() {
  const { data: rows, error: le } = await sb.from("lessons")
    .select("id,title,sections,order_index").ilike("title", "Predstavljanje pacijenta");
  if (le) throw new Error(le.message);
  if (!rows?.length) throw new Error("Lekcija 'Predstavljanje pacijenta' nije nađena.");
  const lesson = rows.sort((a, b) => b.order_index - a.order_index)[0];

  const base = (lesson.sections || []).filter(
    (s) => !(s.type === "text" && typeof s.content === "string" && s.content.includes(MARKER)));
  const had = base.length !== (lesson.sections || []).length;
  const sections = [...base, CLOSING];

  console.log(`\nLekcija: ${lesson.title} (#${lesson.order_index}, ${lesson.id})`);
  console.log(`Sekcija: ${(lesson.sections || []).length} → ${sections.length} ${had ? "(zamena postojeće poruke)" : "(dodajem novu poruku)"}`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Pokreni sa --apply da primeniš.\n");
    console.log(CLOSING.content);
    return;
  }
  const { error: ue } = await sb.from("lessons").update({ sections }).eq("id", lesson.id);
  if (ue) throw new Error("Update: " + ue.message);
  console.log("✓ Završna poruka postavljena.\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });

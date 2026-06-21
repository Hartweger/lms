// Sređuje naslove u Modulu 1 FSP (uvodne lekcije): migrirani tekst koristi ### (h3)
// + podebljane "pseudo-naslove" (**X**) koji se renderuju u veličini tela.
// Promoviše ### / #### -> ## (h2, 1.6rem) i samostalne **X** linije -> ## X.
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSONS = [
  ["Kako izgleda ispit?", "c2ac1b90-6101-4742-b71d-186ddc6035f4"],
  ["Kako i odakle da učim?", "d40bddcb-a386-460e-a269-33795e97d34e"],
  ["Koje kriterijume treba da ispunim na ispitu?", "92a1db61-f9da-464e-b800-c7e21448af96"],
  ["Korisni linkovi", "22df86a5-6899-4906-9882-227a791d3d07"],
];

function fixContent(content) {
  const out = [];
  let changed = 0;
  for (const line of content.split("\n")) {
    // 1) naslovi ###/####/##### -> ##, skini ** unutar naslova
    const h = line.match(/^\s*#{2,6}\s+(.*)$/);
    if (h) {
      const inner = h[1].replace(/\*\*/g, "").trim();
      out.push("## " + inner);
      changed++;
      continue;
    }
    // 2) samostalna podebljana linija "**Naslov**" (opc. emoji/space na kraju) -> ## Naslov
    const b = line.match(/^\s*\*\*(.+?)\*\*\s*([^A-Za-zČĆŽŠĐčćžšđ0-9]*)$/);
    if (b && line.trim().startsWith("**")) {
      out.push("## " + b[1].trim() + (b[2].trim() ? " " + b[2].trim() : ""));
      changed++;
      continue;
    }
    out.push(line);
  }
  return { content: out.join("\n"), changed };
}

async function main() {
  for (const [name, id] of LESSONS) {
    const { data: l } = await sb.from("lessons").select("sections").eq("id", id).single();
    let total = 0;
    const sections = (l.sections || []).map((s) => {
      if (s.type !== "text" || typeof s.content !== "string") return s;
      const { content, changed } = fixContent(s.content);
      total += changed;
      return { ...s, content };
    });
    console.log(`${name.padEnd(46)} naslova sređeno: ${total}`);
    if (APPLY && total > 0) {
      const { error } = await sb.from("lessons").update({ sections }).eq("id", id);
      if (error) console.log("  ✗ " + error.message);
    }
  }
  console.log(APPLY ? "\n✓ Primenjeno." : "\n[DRY-RUN] --apply za primenu.");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });

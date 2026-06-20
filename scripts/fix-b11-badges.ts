/**
 * Usklađuje badge module oznake za 3 B1.1 lekcije sa njihovim stvarnim modulom.
 * Run: npx tsx scripts/fix-b11-badges.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const B11 = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";

// match po delu naslova (ilike) → ciljani modul
const FIXES: { match: string; module: string }[] = [
  { match: "%E-Mail an einen Freund%", module: "Modul 3" },
  { match: "%Erfolg und Lebensziele%", module: "Modul 1" },
  { match: "%Lese und Hörverstehen%", module: "Modul 4" },
];

async function main() {
  for (const fix of FIXES) {
    const { data: lessons } = await supabase
      .from("lessons").select("id, title, sections").eq("course_id", B11).ilike("title", fix.match);
    if (!lessons || lessons.length === 0) { console.log(`⚠️  nema: ${fix.match}`); continue; }
    for (const lesson of lessons) {
      const sections = (lesson.sections as { type: string; module?: string }[]) ?? [];
      const badge = sections.find((s) => s.type === "badge");
      if (badge) {
        badge.module = fix.module;
      } else {
        sections.unshift({ type: "badge", module: fix.module });
      }
      const { error } = await supabase.from("lessons").update({ sections }).eq("id", lesson.id);
      console.log(error ? `✗ ${lesson.title}: ${error.message}` : `✓ ${lesson.title} → ${fix.module}`);
    }
  }
}
main();

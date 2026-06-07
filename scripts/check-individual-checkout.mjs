// scripts/check-individual-checkout.mjs — read-only smoke: replicira page.tsx upit varijacija.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

for (const slug of ["individualni-kurs-nemackog-jezika-a11", "individualni-mesecni-paketi", "individualni-polozi-fide"]) {
  const { data: course } = await supa.from("courses").select("id, course_type, category, included_lessons").eq("slug", slug).single();
  const { data, error } = await supa
    .from("product_variants")
    .select("id, professor_id, package_type, price, professor:professor_id(id, full_name)")
    .eq("course_id", course.id).eq("is_active", true);
  if (error) { console.error(`✗ ${slug}: embed greška:`, error.message); process.exit(1); }
  const profs = [...new Set((data ?? []).map((v) => v.professor?.full_name))];
  console.log(`✓ ${slug}: ${data.length} var | profesorke: ${profs.join(", ")} | paketi: ${[...new Set(data.map(v=>v.package_type).filter(Boolean))].join("/") || "—"}`);
}

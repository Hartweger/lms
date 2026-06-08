import { createClient } from "@/lib/supabase/server";

// Pun sadržaj za AI asistente (ChatGPT, Claude, Perplexity, Gemini...) — dublje od llms.txt.
// Generiše se iz baze pa je uvek svež. Lagani keš da ne gađa bazu na svaki crawl.
export const revalidate = 3600;

const BASE = "https://www.hartweger.rs";

function clean(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const supabase = await createClient();

  const [{ data: courses }, { data: posts }] = await Promise.all([
    supabase
      .from("courses")
      .select("slug, title, description, marketing_description, price, paypal_price_eur, category")
      .eq("is_published", true)
      .eq("is_purchasable", true)
      .order("price", { ascending: true }),
    supabase
      .from("blog_posts")
      .select("slug, title, excerpt, meta_description, category, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
  ]);

  const lines: string[] = [];

  lines.push("# Hartweger — Centar za nemački jezik (pun sadržaj za AI)");
  lines.push("");
  lines.push(
    "> Online škola nemačkog jezika koju vodi Nataša Hartweger. Sertifikovani profesori, " +
      "VoKuM metoda (Vokabular, Komunikacija, Motivacija). Video kursevi, grupna i individualna " +
      "nastava od A1 do C1. Sve cene su u dinarima (RSD), za inostranstvo i u evrima (EUR)."
  );
  lines.push("");
  lines.push("- Web: " + BASE);
  lines.push("- Email: info@hartweger.rs");
  lines.push("- Besplatno testiranje nivoa: " + BASE + "/besplatno-testiranje");
  lines.push("- NaKI — AI asistent za nemački: " + BASE + "/naki");
  lines.push("");

  lines.push("## Kursevi");
  lines.push("");
  for (const c of courses ?? []) {
    const desc = clean(c.marketing_description || c.description);
    const price =
      c.price != null
        ? `${Number(c.price).toLocaleString("de-DE")} RSD` +
          (c.paypal_price_eur ? ` (~${c.paypal_price_eur} EUR)` : "")
        : "—";
    lines.push(`### ${c.title}`);
    lines.push(`- URL: ${BASE}/kursevi/${c.slug}`);
    lines.push(`- Tip: ${c.category ?? "video"}`);
    lines.push(`- Cena: ${price}`);
    if (desc) lines.push(`- Opis: ${desc.slice(0, 600)}`);
    lines.push("");
  }

  lines.push("## Magazin (blog) — članci o nemačkom jeziku");
  lines.push("");
  for (const p of posts ?? []) {
    const summary = clean(p.meta_description || p.excerpt);
    lines.push(`- [${p.title}](${BASE}/magazin/${p.slug})${summary ? " — " + summary.slice(0, 300) : ""}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

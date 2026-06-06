/**
 * Re-fetch truncated posts from WP, clean with cheerio, then AI reformat.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const WP_API = "https://hartweger.rs/wp-json/wp/v2";

const TRUNCATED_SLUGS = [
  "gde-poloziti-fsp-pokrajine-2026",
  "kalkulator-nemackog-a1-b1",
  "kako-se-spremati-za-ispit-b2-deo-schreiben",
];

function cleanElementor(raw: string): string {
  const $ = cheerio.load(raw, { decodeEntities: false });

  // Remove theme widgets
  $('[data-widget_type="theme-post-title.default"]').remove();
  $('[data-widget_type="theme-post-featured-image.default"]').remove();
  $('[data-widget_type="share-buttons.default"]').remove();
  $('[data-widget_type="author-box.default"]').remove();

  // Unwrap Elementor containers
  const wrappers = [
    ".elementor", ".elementor-section", ".elementor-container",
    ".elementor-column", ".elementor-widget-wrap", ".elementor-element",
    ".elementor-widget-container", ".e-con", ".e-con-inner",
  ];
  for (let i = 0; i < 8; i++) {
    for (const sel of wrappers) {
      $(sel).each((_, el) => {
        $(el).replaceWith($(el).html() || "");
      });
    }
  }

  // Remove data attributes
  $("*").each((_, el) => {
    const attrs = (el as any).attribs || {};
    for (const attr of Object.keys(attrs)) {
      if (attr.startsWith("data-") || attr === "id") {
        $(el).removeAttr(attr);
      }
    }
  });

  // Clean classes
  $("*").each((_, el) => {
    const cls = $(el).attr("class");
    if (!cls) return;
    const cleaned = cls.split(/\s+/).filter((c) =>
      !c.startsWith("elementor") && c !== "elementor" && !c.startsWith("e-")
    ).join(" ").trim();
    if (cleaned) $(el).attr("class", cleaned);
    else $(el).removeAttr("class");
  });

  // Remove empty divs
  for (let i = 0; i < 5; i++) {
    $("div").each((_, el) => {
      const html = $(el).html()?.trim();
      if (!html) $(el).remove();
    });
  }

  let html = $("body").html() || "";
  html = html.replace(/\n{3,}/g, "\n\n").trim();
  return html;
}

const SYSTEM_PROMPT = `Ti si stručnjak za formatiranje blog sadržaja za školu nemačkog jezika Hartweger.

Dobićeš HTML sadržaj blog posta. Tvoj zadatak je da ga preformatiraš koristeći sledeće CSS klase, ALI da zadržiš ISTI tekst i sadržaj. Ne menjaj reči, ne dodaj novi tekst, ne brisi tekst. Samo preformatiraj HTML strukturu.

## Dostupne komponente:

### Gramatičko pravilo (plavi boks)
\`<div class="blog-rule"><p><strong>pravilo</strong></p></div>\`

### Primeri rečenica (sivi boks)
\`<div class="blog-example"><p>nemački tekst</p><p class="translation">prevod</p></div>\`

### Ključni pojmovi (pill oznake)
\`<div class="blog-terms"><span>Termin1</span><span>Termin2</span></div>\`

### Napomena (žuti boks)
\`<div class="blog-note"><p><strong>💡 Napomena:</strong> tekst</p></div>\`

### CTA blok
\`<div class="blog-cta"><p>tekst</p><a href="/kursevi/slug">Dugme →</a></div>\`

## PRAVILA:
1. ZADRŽI ISTI TEKST — ne menjaj, ne dodaj, ne briši
2. Zadrži SVE slike sa originalnim URL-ovima
3. Zadrži inline stilove za boje
4. Koristi komponente gde ima smisla
5. Linkovi ka hartweger.rs/proizvod/ zameni sa /kursevi/
6. Vrati SAMO HTML, bez \`\`\`html wrapper-a
7. NE koristi h1
8. ZADRŽI SVE tabele, liste, i kompleksne elemente — NE ih briši
9. Ako sadržaj ima embedded HTML (npr. iframe, custom HTML widget), ZADRŽI ga`;

async function reformatPost(content: string, title: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Preformatiraj blog post "${title}":\n\n${content}` }],
  });
  const text = response.content[0];
  if (text.type !== "text") throw new Error("Unexpected response");
  return text.text.trim();
}

async function main() {
  console.log("=== Fix Truncated Posts ===\n");

  for (const slug of TRUNCATED_SLUGS) {
    console.log(`Processing: ${slug}`);

    // 1. Fetch fresh from WP
    const res = await fetch(`${WP_API}/posts?slug=${slug}&_fields=content,title`);
    const [wpPost] = await res.json();
    if (!wpPost) { console.log("  NOT FOUND on WP"); continue; }

    const rawHtml = wpPost.content.rendered;
    console.log(`  WP original: ${rawHtml.length} chars`);

    // 2. Clean Elementor
    const cleaned = cleanElementor(rawHtml);
    console.log(`  After clean: ${cleaned.length} chars`);

    // 3. AI reformat
    const reformatted = await reformatPost(cleaned, wpPost.title.rendered);
    console.log(`  After AI: ${reformatted.length} chars`);

    // 4. Update DB
    const { error } = await supabase
      .from("blog_posts")
      .update({ content: reformatted })
      .eq("slug", slug);

    if (error) console.log(`  DB ERROR: ${error.message}`);
    else console.log(`  OK ✓`);

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nDone!");
}

main().catch(console.error);

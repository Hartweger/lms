/**
 * AI-powered blog post reformatting.
 * Takes each post's content and reformats it using blog design system components.
 *
 * Usage: npx tsx scripts/reformat-blog-posts.ts
 * Requires: ANTHROPIC_API_KEY env var
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Ti si stručnjak za formatiranje blog sadržaja za školu nemačkog jezika Hartweger.

Dobićeš HTML sadržaj blog posta. Tvoj zadatak je da ga preformatiraš koristeći sledeće CSS klase, ALI da zadržiš ISTI tekst i sadržaj. Ne menjaj reči, ne dodaj novi tekst, ne brisi tekst. Samo preformatira HTML strukturu.

## Dostupne komponente:

### 1. Običan paragraf
\`<p>Tekst...</p>\`

### 2. Gramatičko pravilo / formula (plavi boks sa leve strane)
\`<div class="blog-rule"><p><strong>weil = zato što</strong></p><p>Glagol ide na kraj rečenice.</p></div>\`
Koristi za: gramatička pravila, formule, ključne definicije.

### 3. Primeri rečenica (sivi boks)
\`<div class="blog-example"><p>–<strong>Wieso</strong> isst du kein Fleisch?</p><p>–Ich esse kein Fleisch, <strong>weil</strong> ich Vegetarier <strong>bin</strong>.</p><p class="translation">Zašto ne jedeš meso? — Ne jedem jer sam vegetarijanac.</p></div>\`
Koristi za: primere rečenica na nemačkom, posebno kad imaju prevod.

### 4. Ključni pojmovi / upitne reči (pill oznake)
\`<div class="blog-terms"><span>Warum?</span><span>Wieso?</span><span>Weswegen?</span></div>\`
Koristi za: liste ključnih reči, upitnih reči, kratkih pojmova.

### 5. Napomena / Savet (žuti boks)
\`<div class="blog-note"><p><strong>💡 Napomena:</strong> Tekst saveta...</p></div>\`
Koristi za: savete, napomene, upozorenja, fun facts.

### 6. Naslovi sekcija
\`<h3>Naslov sekcije</h3>\` — za glavne sekcije
\`<h4>Podnaslov</h4>\` — za podsekcije

### 7. CTA blok (link ka kursu)
\`<div class="blog-cta"><p>Hoćeš da naučiš ovo temeljno?</p><a href="/kursevi/paket-a1-a2-b1">Pogledaj paket A1-B1 →</a></div>\`
Koristi SAMO ako originalni tekst ima CTA/link ka kursu. NE DODAJ ako ga nema.

### 8. Slike
\`<p><img src="URL" alt="opis" /></p>\`
Zadrži SVE originalne slike sa istim src URL-ovima. NE menjaj URL-ove slika.

## PRAVILA:
1. ZADRŽI ISTI TEKST — ne menjaj reči, ne dodaj, ne brisi
2. Zadrži SVE slike sa originalnim URL-ovima
3. Zadrži inline stilove za boje (color: #ff0000 itd.) — ovo su bitna isticanja
4. Koristi komponente SAMO gde ima smisla — ne forsiraj boks za svaki paragraf
5. Ako tekst nema gramatička pravila, ne koristi blog-rule
6. Ako tekst nema primere rečenica, ne koristi blog-example
7. Linkovi ka hartweger.rs/proizvod/ zameni sa /kursevi/ (interni linkovi)
8. Ako post ima samo obične paragrafe i slike, to je OK — ne forsiraj komponente
9. Vrati SAMO HTML sadržaj, bez \`\`\`html wrapper-a, bez objašnjenja
10. Ukloni potpuno prazne paragrafe (<p>&nbsp;</p> ili <p> </p>)
11. NE koristi h1 — h1 je već u layout-u iznad sadržaja`;

async function reformatPost(content: string, title: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Preformatira ovaj blog post "${title}":\n\n${content}`,
      },
    ],
  });

  const text = response.content[0];
  if (text.type !== "text") throw new Error("Unexpected response type");
  return text.text.trim();
}

async function main() {
  console.log("=== AI Blog Post Reformatting ===\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set in .env.local");
    return;
  }

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, content")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.error("Failed to fetch posts:", error);
    return;
  }

  console.log(`Processing ${posts.length} posts...\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] ${post.slug}...`);

    try {
      const reformatted = await reformatPost(post.content, post.title);

      if (!reformatted || reformatted.length < 50) {
        console.log(`  SKIP: response too short (${reformatted.length} chars)`);
        errors++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ content: reformatted })
        .eq("id", post.id);

      if (updateError) {
        console.log(`  DB ERROR: ${updateError.message}`);
        errors++;
      } else {
        console.log(`  OK (${post.content.length} → ${reformatted.length} chars)`);
        success++;
      }
    } catch (err: any) {
      console.log(`  API ERROR: ${err.message?.substring(0, 100)}`);
      errors++;

      // Rate limit — wait and retry
      if (err.status === 429) {
        console.log("  Waiting 60s for rate limit...");
        await new Promise((r) => setTimeout(r, 60000));
        i--; // retry this post
      }
    }

    // Small delay between API calls
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}`);
  console.log(`Errors:  ${errors}`);
  console.log(`Total:   ${posts.length}`);
}

main().catch(console.error);

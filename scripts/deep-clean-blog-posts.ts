/**
 * Deep clean blog posts: strip ALL wrapper markup, keep only content elements.
 * Convert Vi→ti form. Remove duplicate featured images.
 *
 * Usage: npx tsx scripts/deep-clean-blog-posts.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as cheerio from "cheerio";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Convert Vi/Vaš form to ti/tvoj */
function viToTi(text: string): string {
  return text
    // Capitals at start of sentence or standalone
    .replace(/\bVi\b/g, "ti")
    .replace(/\bVaš\b/g, "tvoj")
    .replace(/\bVaša\b/g, "tvoja")
    .replace(/\bVaše\b/g, "tvoje")
    .replace(/\bVašeg\b/g, "tvog")
    .replace(/\bVašem\b/g, "tvom")
    .replace(/\bVašoj\b/g, "tvojoj")
    .replace(/\bVašu\b/g, "tvoju")
    .replace(/\bVašim\b/g, "tvojim")
    .replace(/\bVama\b/g, "tebi")
    .replace(/\bVas\b(?![\wčćžšđ])/g, "te")
    // Verb forms Vi → ti
    .replace(/\bimate\b/g, "imaš")
    .replace(/\bImate\b/g, "Imaš")
    .replace(/\bželite\b/g, "želiš")
    .replace(/\bŽelite\b/g, "Želiš")
    .replace(/\bmožete\b/g, "možeš")
    .replace(/\bMožete\b/g, "Možeš")
    .replace(/\bznate\b/g, "znaš")
    .replace(/\bZnate\b/g, "Znaš")
    .replace(/\bvidite\b/g, "vidiš")
    .replace(/\bVidete\b/g, "Vidiš")
    .replace(/\bkoristite\b/g, "koristiš")
    .replace(/\bKoristite\b/g, "Koristiš")
    .replace(/\bnaučite\b/g, "naučiš")
    .replace(/\bNaučite\b/g, "Naučiš")
    .replace(/\bpogledajte\b/g, "pogledaj")
    .replace(/\bPogledajte\b/g, "Pogledaj")
    .replace(/\bpročitajte\b/g, "pročitaj")
    .replace(/\bPročitajte\b/g, "Pročitaj")
    .replace(/\bprobajte\b/g, "probaj")
    .replace(/\bProbajte\b/g, "Probaj")
    .replace(/\bkliknite\b/g, "klikni")
    .replace(/\bKliknite\b/g, "Klikni")
    .replace(/\bproverite\b/g, "proveri")
    .replace(/\bProverite\b/g, "Proveri")
    .replace(/\bprijavite se\b/g, "prijavi se")
    .replace(/\bPrijavite se\b/g, "Prijavi se")
    .replace(/\bzapočnite\b/g, "započni")
    .replace(/\bZapočnite\b/g, "Započni")
    .replace(/\bpripremite\b/g, "pripremi")
    .replace(/\bPripremite\b/g, "Pripremi")
    .replace(/\bpišete\b/g, "pišeš")
    .replace(/\bPišete\b/g, "Pišeš")
    .replace(/\bgovorite\b/g, "govoriš")
    .replace(/\bGovorite\b/g, "Govoriš")
    .replace(/\bučite\b/g, "učiš")
    .replace(/\bUčite\b/g, "Učiš")
    .replace(/\bčitate\b/g, "čitaš")
    .replace(/\bČitate\b/g, "Čitaš")
    .replace(/\bslušate\b/g, "slušaš")
    .replace(/\bSlušate\b/g, "Slušaš")
    .replace(/\bvidećete\b/g, "videćeš")
    .replace(/\bVidećete\b/g, "Videćeš")
    .replace(/\bniste\b/g, "nisi")
    .replace(/\bNiste\b/g, "Nisi")
    .replace(/\bjeste\b/g, "jesi")
    .replace(/\bJeste\b/g, "Jesi")
    .replace(/\bste\b/g, "si")
    // Fix over-corrections: common words containing "si" that shouldn't change
    .replace(/\bsi gur/g, "ste gur") // restore "ste" in context
    // "niste" already handled above
    // Possessive
    .replace(/\bvaš\b/g, "tvoj")
    .replace(/\bvaša\b/g, "tvoja")
    .replace(/\bvaše\b/g, "tvoje")
    .replace(/\bvašeg\b/g, "tvog")
    .replace(/\bvašem\b/g, "tvom")
    .replace(/\bvašoj\b/g, "tvojoj")
    .replace(/\bvašu\b/g, "tvoju")
    .replace(/\bvašim\b/g, "tvojim")
    .replace(/\bvama\b/g, "tebi")
    .replace(/\bvas\b(?![\wčćžšđ])/g, "te");
}

function deepClean(raw: string): string {
  const $ = cheerio.load(raw, { decodeEntities: false });

  // Remove Elementor theme widgets (duplicate title + featured image)
  $('[data-widget_type="theme-post-title.default"]').remove();
  $('[data-widget_type="theme-post-featured-image.default"]').remove();

  // Remove share buttons, social widgets
  $('[data-widget_type="share-buttons.default"]').remove();
  $(".elementor-share-btn").remove();

  // Remove author box if exists
  $('[data-widget_type="author-box.default"]').remove();

  // Extract only content-bearing elements
  const contentElements: string[] = [];

  // Walk through all elements and extract meaningful ones
  const meaningfulTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "blockquote", "table", "figure", "hr", "pre", "code"]);

  function extractContent(el: cheerio.Element) {
    const $el = $(el);
    const tag = el.type === "tag" ? (el as cheerio.TagElement).tagName.toLowerCase() : "";

    if (meaningfulTags.has(tag)) {
      // Get the HTML of this element, clean it up
      let html = $.html(el);
      // Remove all class and data attributes but keep style (for colors), src, alt, href, etc
      html = html.replace(/\s+class="[^"]*"/g, "");
      html = html.replace(/\s+data-[^=]*="[^"]*"/g, "");
      html = html.replace(/\s+id="[^"]*"/g, "");

      // Skip empty elements
      const text = $el.text().trim();
      if (!text && !$el.find("img").length) return;

      contentElements.push(html);
      return; // Don't recurse into content elements
    }

    if (tag === "img") {
      // Standalone image not wrapped in <p> or <figure>
      let html = $.html(el);
      html = html.replace(/\s+class="[^"]*"/g, "");
      html = html.replace(/\s+data-[^=]*="[^"]*"/g, "");
      html = html.replace(/\s+id="[^"]*"/g, "");
      // Remove srcset to simplify
      html = html.replace(/\s+srcset="[^"]*"/g, "");
      html = html.replace(/\s+sizes="[^"]*"/g, "");
      contentElements.push(`<p>${html}</p>`);
      return;
    }

    // For div/section/etc, recurse into children
    $el.children().each((_, child) => {
      extractContent(child as cheerio.Element);
    });
  }

  $("body").children().each((_, el) => {
    extractContent(el as cheerio.Element);
  });

  let html = contentElements.join("\n\n");

  // Apply Vi → ti conversion
  html = viToTi(html);

  // Clean up excessive whitespace
  html = html
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return html;
}

async function main() {
  console.log("=== Deep Clean Blog Posts ===\n");

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, content")
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.error("Failed to fetch posts:", error);
    return;
  }

  console.log(`Processing ${posts.length} posts...\n`);

  let updated = 0;

  for (const post of posts) {
    const cleaned = deepClean(post.content);

    if (cleaned === post.content) {
      console.log(`  SKIP: ${post.slug} (no changes)`);
      continue;
    }

    const origSize = post.content.length;
    const newSize = cleaned.length;
    const reduction = Math.round((1 - newSize / origSize) * 100);

    // Also clean title
    const cleanTitle = viToTi(post.title);

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        content: cleaned,
        title: cleanTitle,
      })
      .eq("id", post.id);

    if (updateError) {
      console.log(`  ERROR: ${post.slug} — ${updateError.message}`);
    } else {
      console.log(`  OK: ${post.slug} (${reduction}% smaller)`);
      updated++;
    }
  }

  console.log(`\n=== Done: ${updated}/${posts.length} posts cleaned ===`);
}

main().catch(console.error);

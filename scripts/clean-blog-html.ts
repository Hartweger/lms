/**
 * Clean Elementor HTML from blog_posts content in Supabase.
 * Strips wrapper divs, keeps only meaningful content (headings, paragraphs, images, lists, tables).
 *
 * Usage: npx tsx scripts/clean-blog-html.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as cheerio from "cheerio";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanHtml(raw: string): string {
  const $ = cheerio.load(raw, { decodeEntities: false });

  // Remove duplicate post title (Elementor theme-post-title widget)
  $('[data-widget_type="theme-post-title.default"]').remove();
  $(".elementor-widget-heading").has("h1").first().remove();

  // Remove duplicate featured image (Elementor theme-post-featured-image widget)
  $('[data-widget_type="theme-post-featured-image.default"]').remove();

  // Unwrap all Elementor structural containers — keep their children
  const wrappers = [
    ".elementor",
    ".elementor-section",
    ".elementor-container",
    ".elementor-column",
    ".elementor-widget-wrap",
    ".elementor-element",
    ".elementor-widget-container",
    ".elementor-top-section",
    ".elementor-top-column",
    ".elementor-inner-section",
    ".elementor-inner-column",
  ];

  // Unwrap from inside out (deepest first)
  for (let i = 0; i < 5; i++) {
    for (const sel of wrappers) {
      $(sel).each((_, el) => {
        $(el).replaceWith($(el).html() || "");
      });
    }
  }

  // Remove data-elementor attributes from remaining elements
  $("*").each((_, el) => {
    const attrs = (el as any).attribs || {};
    for (const attr of Object.keys(attrs)) {
      if (attr.startsWith("data-elementor") || attr === "data-id" || attr === "data-element_type" || attr === "data-e-type" || attr === "data-widget_type" || attr === "data-settings") {
        $(el).removeAttr(attr);
      }
    }
  });

  // Remove empty divs
  $("div").each((_, el) => {
    const content = $(el).html()?.trim();
    if (!content) $(el).remove();
  });

  // Clean up elementor CSS classes but keep content classes
  $("*").each((_, el) => {
    const cls = $(el).attr("class");
    if (!cls) return;
    const cleaned = cls
      .split(/\s+/)
      .filter((c) => !c.startsWith("elementor-") && c !== "elementor" && !c.startsWith("e-") && !c.startsWith("eicon-"))
      .join(" ")
      .trim();
    if (cleaned) {
      $(el).attr("class", cleaned);
    } else {
      $(el).removeAttr("class");
    }
  });

  // Get just the body content
  let html = $("body").html() || "";

  // Clean up whitespace
  html = html
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+$/gm, "")
    .trim();

  return html;
}

async function main() {
  console.log("=== Clean Blog HTML ===\n");

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, content")
    .eq("is_published", true);

  if (error || !posts) {
    console.error("Failed to fetch posts:", error);
    return;
  }

  console.log(`Found ${posts.length} posts\n`);

  let updated = 0;
  let unchanged = 0;

  for (const post of posts) {
    const cleaned = cleanHtml(post.content);

    if (cleaned === post.content) {
      unchanged++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ content: cleaned })
      .eq("id", post.id);

    if (updateError) {
      console.log(`  ERROR: ${post.slug} — ${updateError.message}`);
    } else {
      const reduction = Math.round((1 - cleaned.length / post.content.length) * 100);
      console.log(`  CLEANED: ${post.slug} (${reduction}% smaller)`);
      updated++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Updated:   ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Total:     ${posts.length}`);
}

main().catch(console.error);

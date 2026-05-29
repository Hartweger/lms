/**
 * 1. Remove "Ovo je bio samo uvod" sections + trailing CTA from all posts
 * 2. Auto-link mentions of other blog post titles to /magazin/[slug]
 *
 * Usage: npx tsx scripts/cleanup-blog-cta-and-autolink.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Patterns to remove from end of posts */
const REMOVAL_PATTERNS = [
  /Ovo je bio samo uvod/i,
  /U ovom tekstu sam ti pokazala osnove/i,
  /Na kursu idemo mnogo dublje/i,
  /Moj paket A1-B1 sadrži/i,
  /Pogledaj paket A1-B1/i,
  /Svako može da nauči nemački/i,
  /Puno pozdrava do sledeće prilike/i,
  /Nataša Hartweger$/,
  /Tvoja,?\s*Nataša/i,
  /Do sledećeg puta/i,
];

function removeCta(html: string): { html: string; removed: boolean } {
  const $ = cheerio.load(html, { decodeEntities: false });

  let removed = false;

  // Find and remove "Ovo je bio samo uvod" h3 and everything after it
  $("h3").each((_, el) => {
    const text = $(el).text().trim();
    if (/ovo je bio samo uvod/i.test(text)) {
      // Remove this heading and all siblings after it
      let current = $(el);
      while (current.length) {
        const next = current.next();
        current.remove();
        removed = true;
        current = next;
      }
    }
  });

  // Remove blog-cta blocks that reference paket A1-B1 or similar generic CTAs
  $(".blog-cta").each((_, el) => {
    const text = $(el).text();
    if (/paket A1-B1|Pogledaj paket|150\+ video/i.test(text)) {
      $(el).remove();
      removed = true;
    }
  });

  // Remove trailing paragraphs matching patterns
  const allP = $("body > p, body > div > p").toArray().reverse();
  for (const p of allP) {
    const text = $(p).text().trim();
    if (!text) { $(p).remove(); continue; }

    const matches = REMOVAL_PATTERNS.some((pat) => pat.test(text));
    if (matches) {
      $(p).remove();
      removed = true;
    } else {
      break; // stop at first non-matching paragraph from the end
    }
  }

  // Also check last few elements for sign-off patterns
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (/^(Tvoja,?\s*)?Nataša\s*(Hartweger)?$/i.test(text)) {
      $(el).remove();
      removed = true;
    }
    if (/^Puno pozdrava/i.test(text)) {
      $(el).remove();
      removed = true;
    }
  });

  let result = $("body").html() || "";
  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return { html: result, removed };
}

function autoLink(html: string, posts: { slug: string; title: string }[]): { html: string; linked: number } {
  let linked = 0;

  // Build keyword → slug mapping from post titles
  // Use shorter, recognizable phrases from titles
  const linkMap: { keyword: string; slug: string; label: string }[] = [];

  for (const post of posts) {
    // Extract meaningful short phrases from titles
    const title = post.title;

    // Common patterns in titles like "Weil rečenice", "Relativne rečenice", etc.
    const patterns = [
      // Exact title match (without " — Hartweger" suffix)
      { keyword: title.replace(/\s*[—–-]\s*Hartweger.*$/i, "").trim(), label: title },
    ];

    // Also extract key phrases
    const phrases = title.match(/((?:weil|dass|als|wenn|relativne|modalni|negacija|imperativ|prezent|preterit|padež[ie]|predlozi|glagoli|množina|rodovi|spelovanje)\s*(?:rečenice?|glagoli?|imenica)?(?:\s+u\s+nema[čc]kom(?:\s+jeziku)?)?)/gi);
    if (phrases) {
      for (const phrase of phrases) {
        if (phrase.length >= 4) {
          linkMap.push({ keyword: phrase.trim(), slug: post.slug, label: phrase.trim() });
        }
      }
    }
  }

  // Sort by keyword length descending (match longer phrases first)
  linkMap.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const { keyword, slug, label } of linkMap) {
    // Don't link if keyword is too short
    if (keyword.length < 5) continue;

    // Escape for regex
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Match keyword NOT already inside an <a> tag
    // Simple approach: match the keyword and check it's not preceded by href=" or >
    const regex = new RegExp(`(?<![">\/])\\b(${escaped})\\b(?![^<]*<\\/a>)`, "gi");

    const before = html;
    html = html.replace(regex, (match) => {
      return `<a href="/magazin/${slug}">${match}</a>`;
    });

    if (html !== before) linked++;
  }

  return { html, linked };
}

async function main() {
  console.log("=== Cleanup CTAs + Auto-link ===\n");

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, content")
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.error("Failed:", error);
    return;
  }

  // Build post list for auto-linking (exclude current post when processing)
  const allPosts = posts.map((p) => ({ slug: p.slug, title: p.title }));

  let ctaRemoved = 0;
  let autoLinked = 0;
  let updated = 0;

  for (const post of posts) {
    const otherPosts = allPosts.filter((p) => p.slug !== post.slug);

    // Step 1: Remove CTA sections
    const { html: cleanedHtml, removed } = removeCta(post.content);
    if (removed) ctaRemoved++;

    // Step 2: Auto-link mentions of other posts
    const { html: linkedHtml, linked } = autoLink(cleanedHtml, otherPosts);
    if (linked > 0) autoLinked++;

    // Update if changed
    if (linkedHtml !== post.content) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ content: linkedHtml })
        .eq("id", post.id);

      if (updateError) {
        console.log(`  ERROR: ${post.slug} — ${updateError.message}`);
      } else {
        const changes = [];
        if (removed) changes.push("CTA removed");
        if (linked > 0) changes.push(`${linked} links added`);
        console.log(`  ${post.slug}: ${changes.join(", ")}`);
        updated++;
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`CTA removed from: ${ctaRemoved} posts`);
  console.log(`Auto-linked in: ${autoLinked} posts`);
  console.log(`Total updated: ${updated} / ${posts.length}`);
}

main().catch(console.error);

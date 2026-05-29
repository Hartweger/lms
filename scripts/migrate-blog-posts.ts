/**
 * Migrate blog posts from WordPress REST API to Supabase blog_posts table.
 *
 * Usage: npx tsx scripts/migrate-blog-posts.ts
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * (from .env.local or set manually)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API = "https://hartweger.rs/wp-json/wp/v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified: string;
  featured_media: number;
  categories: number[];
}

interface WPMedia {
  source_url: string;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\n/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00ad/g, ""); // soft hyphen
}

async function fetchAllPosts(): Promise<WPPost[]> {
  const allPosts: WPPost[] = [];
  let page = 1;

  while (true) {
    const url = `${WP_API}/posts?per_page=100&page=${page}&_embed=false`;
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 400) break; // no more pages
      throw new Error(`WP API error: ${res.status}`);
    }

    const posts: WPPost[] = await res.json();
    if (posts.length === 0) break;

    allPosts.push(...posts);
    page++;
  }

  return allPosts;
}

async function fetchMediaUrl(mediaId: number): Promise<string | null> {
  if (!mediaId) return null;
  try {
    const res = await fetch(`${WP_API}/media/${mediaId}?_fields=source_url`);
    if (!res.ok) return null;
    const media: WPMedia = await res.json();
    return media.source_url || null;
  } catch {
    return null;
  }
}

async function fetchCategories(): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const res = await fetch(`${WP_API}/categories?per_page=100`);
    if (!res.ok) return map;
    const cats: WPCategory[] = await res.json();
    for (const c of cats) {
      map.set(c.id, c.name);
    }
  } catch {
    // ignore
  }
  return map;
}

async function main() {
  console.log("=== WordPress → Supabase Blog Migration ===\n");

  // Fetch categories
  console.log("Fetching categories...");
  const categoryMap = await fetchCategories();
  console.log(`Found ${categoryMap.size} categories\n`);

  // Fetch all posts
  const posts = await fetchAllPosts();
  console.log(`\nFound ${posts.length} posts total\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of posts) {
    const title = decodeHtmlEntities(post.title.rendered);
    const slug = post.slug;
    const content = post.content.rendered;
    const excerptRaw = stripHtml(post.excerpt.rendered);
    const excerpt = decodeHtmlEntities(excerptRaw).substring(0, 300) || null;
    const metaDescription = excerpt ? excerpt.substring(0, 160) : null;

    // Fetch featured image
    const thumbnailUrl = await fetchMediaUrl(post.featured_media);

    // Check if already exists
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  SKIP: "${title}" (slug exists)`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("blog_posts").insert({
      title,
      slug,
      content,
      excerpt,
      thumbnail_url: thumbnailUrl,
      meta_description: metaDescription,
      is_published: true,
      published_at: post.date,
      created_at: post.date,
      updated_at: post.modified,
    });

    if (error) {
      console.log(`  ERROR: "${title}" — ${error.message}`);
      errors++;
    } else {
      console.log(`  OK: "${title}"`);
      inserted++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Errors:   ${errors}`);
  console.log(`Total:    ${posts.length}`);
}

main().catch(console.error);

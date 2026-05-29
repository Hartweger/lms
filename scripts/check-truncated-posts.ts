/**
 * Compare WP original content length vs Supabase content length.
 * Flag posts where >50% of content was lost.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WP_API = "https://hartweger.rs/wp-json/wp/v2";

async function main() {
  // Fetch all WP posts
  const allWp: any[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${WP_API}/posts?per_page=100&page=${page}&_fields=slug,content`);
    if (!res.ok) break;
    const posts = await res.json();
    if (!posts.length) break;
    allWp.push(...posts);
    page++;
  }

  // Fetch all Supabase posts
  const { data: dbPosts } = await supabase
    .from("blog_posts")
    .select("slug, content");

  if (!dbPosts) return;

  const dbMap = new Map(dbPosts.map((p) => [p.slug, p.content.length]));

  console.log("Posts with significant content loss (>50%):\n");
  let truncated = 0;

  for (const wp of allWp) {
    // Strip HTML to get text-only length for fair comparison
    const wpText = wp.content.rendered.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    const dbLen = dbMap.get(wp.slug);
    if (dbLen === undefined) continue;

    const dbPost = dbPosts.find((p) => p.slug === wp.slug);
    const dbText = dbPost ? dbPost.content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";

    if (wpText.length > 200 && dbText.length < wpText.length * 0.5) {
      const loss = Math.round((1 - dbText.length / wpText.length) * 100);
      console.log(`  ${wp.slug}: WP=${wpText.length} DB=${dbText.length} (${loss}% lost)`);
      truncated++;
    }
  }

  console.log(`\nTotal truncated: ${truncated} / ${allWp.length}`);
}

main().catch(console.error);

/**
 * Hide blog posts older than 2026 (set is_published = false).
 * Keep only 2026 posts visible on the new site.
 *
 * Usage: npx tsx scripts/hide-old-blog-posts.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Hide posts before 2026
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ is_published: false })
    .lt("published_at", "2026-01-01T00:00:00Z")
    .select("slug, title, published_at");

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`Hidden ${data?.length ?? 0} posts older than 2026:\n`);
  for (const p of data ?? []) {
    console.log(`  ${p.published_at?.slice(0, 10)}  ${p.title}`);
  }

  // Count remaining
  const { count } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact" })
    .eq("is_published", true);

  console.log(`\nVisible posts remaining: ${count}`);
}

main().catch(console.error);

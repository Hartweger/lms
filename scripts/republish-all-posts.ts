import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ is_published: true })
    .eq("is_published", false)
    .select("id");

  if (error) {
    console.error("Error:", error.message);
    return;
  }
  console.log(`Republished ${data?.length ?? 0} posts. All 75 are now visible.`);
}

main().catch(console.error);

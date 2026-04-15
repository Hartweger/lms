import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, created_at")
    .eq("is_published", true);

  const courseUrls = (courses ?? []).map((course) => ({
    url: `https://hartweger.rs/kurs/${course.slug}`,
    lastModified: course.created_at,
  }));

  return [
    { url: "https://hartweger.rs", lastModified: new Date() },
    { url: "https://hartweger.rs/test-nivoa", lastModified: new Date() },
    { url: "https://hartweger.rs/politika-privatnosti", lastModified: new Date() },
    ...courseUrls,
  ];
}

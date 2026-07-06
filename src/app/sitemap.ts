import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: courses }, { data: posts }] = await Promise.all([
    supabase.from("courses").select("slug, created_at").eq("is_published", true).eq("is_purchasable", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
  ]);

  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://www.hartweger.rs", lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: "https://www.hartweger.rs/kursevi", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.hartweger.rs/grupni-kursevi", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://www.hartweger.rs/raspored", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://www.hartweger.rs/individualni-kursevi", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.hartweger.rs/kursevi/paket-a1-a2-b1", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.hartweger.rs/besplatno-testiranje", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.hartweger.rs/naki", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.hartweger.rs/magazin", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: "https://www.hartweger.rs/o-natasi", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.hartweger.rs/metodologija", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.hartweger.rs/kontakt", lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: "https://www.hartweger.rs/faq", lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: "https://www.hartweger.rs/uslovi", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.hartweger.rs/politika-privatnosti", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.hartweger.rs/provera-sertifikata", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.hartweger.rs/instaliraj", lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const coursePages: MetadataRoute.Sitemap = (courses ?? []).map((c) => ({
    url: `https://www.hartweger.rs/kursevi/${c.slug}`,
    lastModified: c.created_at,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `https://www.hartweger.rs/magazin/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dedup (npr. paket-a1-a2-b1 je i u statičkim i u courses) - prva pojava (viši prioritet) ostaje
  const seen = new Set<string>();
  return [...staticPages, ...coursePages, ...blogPages].filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
}

# Mobile + SEO Polishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete SEO foundation and mobile image optimization for hartweger.rs before launch.

**Architecture:** Static files (robots.txt, llms.txt) + metadata additions across all page files + JSON-LD structured data as `<script>` tags + `<img>` to `next/Image` conversion across components and pages.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase

**Spec:** `docs/superpowers/specs/2026-05-29-mobile-seo-polishing-design.md`

---

### Task 1: robots.txt + trailing slash + metadataBase

**Files:**
- Create: `public/robots.txt`
- Modify: `next.config.ts` (add `trailingSlash: false`)
- Modify: `src/app/layout.tsx` (add `metadataBase`, `alternates`, `robots`, `twitter`)

- [ ] **Step 1: Create robots.txt**

Create `public/robots.txt`:
```
User-agent: *
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Sitemap: https://www.hartweger.rs/sitemap.xml
```

- [ ] **Step 2: Add trailingSlash to next.config.ts**

In `next.config.ts`, add `trailingSlash: false` to the `nextConfig` object (after line 9, inside the config):
```ts
const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
```

- [ ] **Step 3: Update layout.tsx metadata**

In `src/app/layout.tsx`, update the metadata export (lines 30-46) to:
```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://www.hartweger.rs"),
  title: "Hartweger — Škola nemačkog jezika",
  description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
  manifest: "/manifest.json",
  alternates: { canonical: "./" },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hartweger",
  },
  openGraph: {
    title: "Hartweger — Škola nemačkog jezika",
    description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Hartweger — Škola nemačkog jezika" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hartweger — Škola nemačkog jezika",
    description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt next.config.ts src/app/layout.tsx
git commit -m "feat(seo): add robots.txt, metadataBase, canonical, twitter card, trailing slash"
```

---

### Task 2: Download OG images from WP

**Files:**
- Create: `public/og/default.png`
- Create: `public/og/o-natasi.jpg`
- Create: `public/og/kontakt.png`

- [ ] **Step 1: Create og directory and download images**

```bash
mkdir -p public/og
curl -o public/og/default.png "https://www.hartweger.rs/wp-content/uploads/2024/04/header-graphic@2x1.png"
curl -o public/og/o-natasi.jpg "https://www.hartweger.rs/wp-content/uploads/elementor/thumbs/natasa-hartweger-o-meni-qf6p45ys3z5yy4z5n1gp2gq3w9g075z9cbxkc1g8rc.jpg"
curl -o public/og/kontakt.png "https://www.hartweger.rs/wp-content/uploads/2023/04/natasa_hartweger_contact.png"
```

- [ ] **Step 2: Verify images downloaded correctly**

```bash
ls -la public/og/
file public/og/default.png public/og/o-natasi.jpg public/og/kontakt.png
```

Expected: three files, each >10KB, correct image formats.

- [ ] **Step 3: Commit**

```bash
git add public/og/
git commit -m "feat(seo): add OG images from WP for social sharing"
```

---

### Task 3: Expand sitemap.ts

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Rewrite sitemap.ts**

Replace the entire content of `src/app/sitemap.ts` with:

```ts
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
    { url: "https://www.hartweger.rs/individualni-kursevi", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.hartweger.rs/kursevi/paket-a1-a2-b1", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.hartweger.rs/besplatno-testiranje", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.hartweger.rs/magazin", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: "https://www.hartweger.rs/o-natasi", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.hartweger.rs/metodologija", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.hartweger.rs/kontakt", lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: "https://www.hartweger.rs/faq", lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: "https://www.hartweger.rs/uslovi", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
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

  return [...staticPages, ...coursePages, ...blogPages];
}
```

**Note:** The old sitemap used `hartweger.rs` (no www) and `/kurs/` URL pattern. The new one uses `www.hartweger.rs` to match metadataBase and `/kursevi/` to match the actual route.

- [ ] **Step 2: Build to verify no errors**

```bash
npx next build 2>&1 | head -30
```

Expected: no TypeScript errors related to sitemap.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): expand sitemap with all static pages and blog posts"
```

---

### Task 4: Add openGraph to all page metadata

**Files:**
- Modify: `src/app/page.tsx` (homepage)
- Modify: `src/app/kursevi/page.tsx`
- Modify: `src/app/grupni-kursevi/page.tsx`
- Modify: `src/app/individualni-kursevi/page.tsx`
- Modify: `src/app/o-natasi/page.tsx`
- Modify: `src/app/kontakt/page.tsx`
- Modify: `src/app/faq/page.tsx`
- Modify: `src/app/metodologija/page.tsx`
- Modify: `src/app/uslovi/page.tsx`
- Modify: `src/app/provera-sertifikata/page.tsx`
- Modify: `src/app/kursevi/paket-a1-a2-b1/page.tsx`
- Modify: `src/app/magazin/page.tsx`
- Modify: `src/app/besplatno-testiranje/page.tsx` (fix typo + url)
- Modify: `src/app/kursevi/[slug]/page.tsx` (add OG to generateMetadata)
- Modify: `src/app/magazin/[slug]/page.tsx` (add OG to generateMetadata)

For `src/app/instaliraj/page.tsx`: skip — it's a "use client" component, can't export metadata. This is fine; it's a utility page.

- [ ] **Step 1: Homepage — add openGraph**

In `src/app/page.tsx`, replace the metadata export (lines 5-9) with:
```ts
export const metadata: Metadata = {
  title: "Hartweger — Online škola nemačkog jezika",
  description: "Nauči nemački koji ćeš stvarno koristiti. VoKuM metoda — video kursevi, grupni kursevi i individualni časovi sa Natašom Hartweger.",
  openGraph: {
    title: "Hartweger — Online škola nemačkog jezika",
    description: "Nauči nemački koji ćeš stvarno koristiti. VoKuM metoda — video kursevi, grupni kursevi i individualni časovi.",
  },
};
```

- [ ] **Step 2: /kursevi — add openGraph**

In `src/app/kursevi/page.tsx`, replace metadata (lines 4-8) with:
```ts
export const metadata: Metadata = {
  title: "Kursevi nemačkog jezika — Hartweger",
  description: "Video kursevi, grupna i individualna nastava nemačkog jezika od A1 do C1. Izaberite tip kursa, filtrirajte po nivou i odmah se prijavite.",
  openGraph: {
    title: "Kursevi nemačkog jezika — Hartweger",
    description: "Video kursevi, grupna i individualna nastava nemačkog jezika od A1 do C1.",
  },
};
```

- [ ] **Step 3: /grupni-kursevi — add openGraph**

In `src/app/grupni-kursevi/page.tsx`, replace metadata (lines 6-10) with:
```ts
export const metadata: Metadata = {
  title: "Grupni kursevi nemačkog jezika — Hartweger",
  description: "Pogledajte raspored grupnih kurseva nemačkog jezika i prijavite se online.",
  openGraph: {
    title: "Grupni kursevi nemačkog jezika — Hartweger",
    description: "Pogledajte raspored grupnih kurseva nemačkog jezika i prijavite se online.",
  },
};
```

- [ ] **Step 4: /individualni-kursevi — add openGraph**

In `src/app/individualni-kursevi/page.tsx`, replace metadata (lines 5-9) with:
```ts
export const metadata: Metadata = {
  title: "Individualni kursevi nemačkog jezika — Hartweger",
  description: "Individualna nastava nemačkog jezika sa sertifikovanim profesorima. Prilagođen tempo i program.",
  openGraph: {
    title: "Individualni kursevi nemačkog jezika — Hartweger",
    description: "Individualna nastava nemačkog jezika sa sertifikovanim profesorima.",
  },
};
```

- [ ] **Step 5: /o-natasi — add openGraph with specific image**

In `src/app/o-natasi/page.tsx`, replace metadata (lines 4-8) with:
```ts
export const metadata: Metadata = {
  title: "O Nataši — Hartweger škola nemačkog jezika",
  description: "Upoznajte Natašu Hartweger — profesorku nemačkog jezika, osnivačicu Hartweger Centra i autorku VoKuM metode.",
  openGraph: {
    title: "O Nataši — Hartweger škola nemačkog jezika",
    description: "Upoznajte Natašu Hartweger — profesorku nemačkog jezika, osnivačicu Hartweger Centra i autorku VoKuM metode.",
    images: [{ url: "/og/o-natasi.jpg", alt: "Nataša Hartweger" }],
  },
};
```

- [ ] **Step 6: /kontakt — add openGraph with specific image**

In `src/app/kontakt/page.tsx`, replace metadata (lines 5-8) with:
```ts
export const metadata: Metadata = {
  title: "Kontakt — Hartweger škola nemačkog jezika",
  description: "Pošaljite nam poruku — pitanja o kursevima, plaćanju ili saradnji.",
  openGraph: {
    title: "Kontakt — Hartweger škola nemačkog jezika",
    description: "Pošaljite nam poruku — pitanja o kursevima, plaćanju ili saradnji.",
    images: [{ url: "/og/kontakt.png", alt: "Hartweger kontakt" }],
  },
};
```

- [ ] **Step 7: /faq — add openGraph**

In `src/app/faq/page.tsx`, replace metadata (lines 7-10) with:
```ts
export const metadata: Metadata = {
  title: "Česta pitanja — Hartweger",
  description: "Odgovori na najčešća pitanja o kursevima nemačkog jezika, plaćanju, pristupu platformi i sertifikatima.",
  openGraph: {
    title: "Česta pitanja — Hartweger",
    description: "Odgovori na najčešća pitanja o kursevima nemačkog jezika, plaćanju, pristupu platformi i sertifikatima.",
  },
};
```

- [ ] **Step 8: /metodologija — add openGraph**

In `src/app/metodologija/page.tsx`, replace metadata (lines 4-8) with:
```ts
export const metadata: Metadata = {
  title: "VoKuM metoda — Hartweger škola nemačkog jezika",
  description: "VoKuM metoda — Vokabular, Komunikacija i Motivacija. Saznajte kako učimo nemački u Hartweger školi.",
  openGraph: {
    title: "VoKuM metoda — Hartweger škola nemačkog jezika",
    description: "VoKuM metoda — Vokabular, Komunikacija i Motivacija.",
  },
};
```

- [ ] **Step 9: /uslovi — add openGraph**

In `src/app/uslovi/page.tsx`, replace metadata (lines 4-7) with:
```ts
export const metadata: Metadata = {
  title: "Opšti uslovi poslovanja — Hartweger",
  description: "Opšti uslovi korišćenja platforme Hartweger — uslovi kupovine, pristup kursevima i pravila korišćenja.",
  openGraph: {
    title: "Opšti uslovi poslovanja — Hartweger",
    description: "Opšti uslovi korišćenja platforme Hartweger.",
  },
};
```

- [ ] **Step 10: /provera-sertifikata — add openGraph**

In `src/app/provera-sertifikata/page.tsx`, replace metadata (lines 4-8) with:
```ts
export const metadata: Metadata = {
  title: "Provera sertifikata — Hartweger",
  description: "Proverite validnost sertifikata iz Hartweger škole nemačkog jezika.",
  openGraph: {
    title: "Provera sertifikata — Hartweger",
    description: "Proverite validnost sertifikata iz Hartweger škole nemačkog jezika.",
  },
};
```

- [ ] **Step 11: /kursevi/paket-a1-a2-b1 — add openGraph**

In `src/app/kursevi/paket-a1-a2-b1/page.tsx`, replace metadata (lines 4-8) with:
```ts
export const metadata: Metadata = {
  title: "Video paket A1 + A2 + B1 — Hartweger",
  description: "Kompletna putanja od nule do B1. 150+ video lekcija, testovi, PDF materijali, WhatsApp podrška i 3 sertifikata — sve u jednom paketu za 249€.",
  openGraph: {
    title: "Video paket A1 + A2 + B1 — Hartweger",
    description: "Kompletna putanja od nule do B1. 150+ video lekcija, testovi, PDF materijali i 3 sertifikata.",
  },
};
```

- [ ] **Step 12: /magazin — add openGraph**

In `src/app/magazin/page.tsx`, replace metadata (lines 6-9) with:
```ts
export const metadata: Metadata = {
  title: "Magazin — Hartweger škola nemačkog jezika",
  description: "Saveti za učenje nemačkog jezika, gramatika, vokabular, priprema za ispite i život u nemačkom govornom području.",
  openGraph: {
    title: "Magazin — Hartweger škola nemačkog jezika",
    description: "Saveti za učenje nemačkog jezika, gramatika, vokabular i priprema za ispite.",
  },
};
```

- [ ] **Step 13: /besplatno-testiranje — fix typos and URL**

In `src/app/besplatno-testiranje/page.tsx`, the metadata has typos ("namerickog" instead of "nemačkog") and uses the old `kurs.hartweger.rs` URL. Replace metadata (lines 4-13) with:
```ts
export const metadata: Metadata = {
  title: "Besplatno testiranje nemačkog jezika | Hartweger",
  description: "Besplatno testiranje nivoa nemačkog jezika online. Testiraj se odmah i saznaj da li si A1, A2, B1 ili B2. Bez registracije, rezultat odmah + preporuka kursa.",
  openGraph: {
    title: "Besplatno testiranje nemačkog jezika — saznaj svoj nivo",
    description: "Besplatno testiraj svoj nivo nemačkog jezika. Bez registracije, rezultat odmah + preporuka kursa.",
    url: "https://www.hartweger.rs/besplatno-testiranje",
    siteName: "Hartweger",
    type: "website",
  },
};
```

- [ ] **Step 14: /kursevi/[slug] generateMetadata — add OG + thumbnail**

In `src/app/kursevi/[slug]/page.tsx`, replace the generateMetadata function (lines 57-63) with:
```ts
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title, description, thumbnail_url, price")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();
  if (!course) return { title: "Kurs nije pronađen — Hartweger" };
  return {
    title: `${course.title} — Hartweger`,
    description: course.description,
    openGraph: {
      title: `${course.title} — Hartweger`,
      description: course.description,
      ...(course.thumbnail_url && {
        images: [{ url: course.thumbnail_url, alt: course.title }],
      }),
    },
  };
}
```

- [ ] **Step 15: /magazin/[slug] generateMetadata — add OG + thumbnail**

In `src/app/magazin/[slug]/page.tsx`, replace the generateMetadata function (lines 7-23) with:
```ts
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description, excerpt, thumbnail_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (!post) return { title: "Članak nije pronađen — Hartweger" };
  const description = post.meta_description || post.excerpt || "";
  return {
    title: `${post.title} — Hartweger Magazin`,
    description,
    openGraph: {
      title: `${post.title} — Hartweger Magazin`,
      description,
      type: "article",
      ...(post.thumbnail_url && {
        images: [{ url: post.thumbnail_url, alt: post.title }],
      }),
    },
  };
}
```

- [ ] **Step 16: Commit**

```bash
git add src/app/page.tsx src/app/kursevi/page.tsx src/app/grupni-kursevi/page.tsx src/app/individualni-kursevi/page.tsx src/app/o-natasi/page.tsx src/app/kontakt/page.tsx src/app/faq/page.tsx src/app/metodologija/page.tsx src/app/uslovi/page.tsx src/app/provera-sertifikata/page.tsx src/app/kursevi/paket-a1-a2-b1/page.tsx src/app/magazin/page.tsx src/app/besplatno-testiranje/page.tsx src/app/kursevi/\[slug\]/page.tsx src/app/magazin/\[slug\]/page.tsx
git commit -m "feat(seo): add openGraph metadata to all pages"
```

---

### Task 5: JSON-LD Organization schema (global)

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Organization JSON-LD to layout.tsx**

In `src/app/layout.tsx`, add a `<script>` tag right after `<Navigacija />` (line 64):

```tsx
<Navigacija />
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Centar za nemački jezik Hartweger",
      url: "https://www.hartweger.rs",
      logo: "https://www.hartweger.rs/logo.jpg",
      email: "info@hartweger.rs",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Jurija Gagarina 20",
        addressLocality: "Novi Beograd",
        postalCode: "11070",
        addressCountry: "RS",
      },
      sameAs: [
        "https://www.instagram.com/hartweger_centar/",
        "https://www.youtube.com/channel/UCa_7vX8_EtWNUbjA9SqqMwQ",
        "https://www.facebook.com/hartwegercentar/",
        "https://rs.linkedin.com/in/natasahartweger",
        "https://x.com/nacapaun",
      ],
    }),
  }}
/>
<main className="flex-1">{children}</main>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): add Organization JSON-LD schema"
```

---

### Task 6: JSON-LD Course schema on /kursevi/[slug]

**Files:**
- Modify: `src/app/kursevi/[slug]/page.tsx`

- [ ] **Step 1: Add Course JSON-LD**

In `src/app/kursevi/[slug]/page.tsx`, find the return statement of the page component (the first `<>` or wrapping element). Add a `<script>` tag as the first child inside the return:

```tsx
// Add this right at the top of the return JSX, before the first visible section
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description,
      provider: {
        "@type": "Organization",
        name: "Centar za nemački jezik Hartweger",
        url: "https://www.hartweger.rs",
      },
      ...(slugToNivo[slug] && { educationalLevel: slugToNivo[slug] }),
      inLanguage: "de",
      offers: {
        "@type": "Offer",
        price: course.price,
        priceCurrency: "RSD",
        availability: "https://schema.org/InStock",
      },
    }),
  }}
/>
```

The `slugToNivo` mapping at line 12 already maps slugs to levels (A1.1, A2.1, etc.), so we reuse it.

- [ ] **Step 2: Add BreadcrumbList JSON-LD**

In the same file, add a second `<script>` tag right after the Course schema:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: "https://www.hartweger.rs" },
        { "@type": "ListItem", position: 2, name: "Kursevi", item: "https://www.hartweger.rs/kursevi" },
        { "@type": "ListItem", position: 3, name: course.title },
      ],
    }),
  }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/kursevi/\[slug\]/page.tsx
git commit -m "feat(seo): add Course + Breadcrumb JSON-LD on course pages"
```

---

### Task 7: JSON-LD BlogPosting + Breadcrumb on /magazin/[slug]

**Files:**
- Modify: `src/app/magazin/[slug]/page.tsx`

- [ ] **Step 1: Add BlogPosting + Breadcrumb JSON-LD**

In `src/app/magazin/[slug]/page.tsx`, find where `post` is loaded and the return JSX. Add two `<script>` tags at the top of the return:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      author: { "@type": "Person", name: "Nataša Hartweger" },
      publisher: {
        "@type": "Organization",
        name: "Centar za nemački jezik Hartweger",
        url: "https://www.hartweger.rs",
      },
      ...(post.thumbnail_url && { image: post.thumbnail_url }),
    }),
  }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: "https://www.hartweger.rs" },
        { "@type": "ListItem", position: 2, name: "Magazin", item: "https://www.hartweger.rs/magazin" },
        { "@type": "ListItem", position: 3, name: post.title },
      ],
    }),
  }}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/magazin/\[slug\]/page.tsx
git commit -m "feat(seo): add BlogPosting + Breadcrumb JSON-LD on blog posts"
```

---

### Task 8: JSON-LD FAQPage on /faq

**Files:**
- Modify: `src/app/faq/page.tsx`

- [ ] **Step 1: Add FAQPage JSON-LD**

In `src/app/faq/page.tsx`, `faqItems` is already fetched (line 21). Add a `<script>` tag as the first child inside the return JSX (line 24):

```tsx
<>
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }),
    }}
  />
  <section className="bg-gradient-to-b ...">
```

- [ ] **Step 2: Commit**

```bash
git add src/app/faq/page.tsx
git commit -m "feat(seo): add FAQPage JSON-LD schema"
```

---

### Task 9: llms.txt

**Files:**
- Create: `public/llms.txt`

- [ ] **Step 1: Create llms.txt**

Create `public/llms.txt`:
```
# Hartweger — Centar za nemački jezik

> Online škola nemačkog jezika sa sertifikovanim profesorima. Video kursevi, grupna i individualna nastava od A1 do C1 nivoa.

## O nama
Hartweger je online škola nemačkog jezika koju je osnovala Nataša Hartweger. Koristimo VoKuM metodu (Vokabular, Komunikacija, Motivacija) za efikasno učenje nemačkog jezika.

## Kursevi
- Video kursevi (A1.1 — C1.2): Samostalno učenje sa video lekcijama, testovima i PDF materijalima
- Grupni kursevi (A1.1 — C1.2): Nastava uživo sa 3-6 polaznika putem Google Meet
- Individualni kursevi (A1.1 — B2.1): 1-na-1 nastava sa profesorom
- Paket A1+A2+B1: Kompletna putanja od nule do B1

## Ključne stranice
- [Svi kursevi](https://www.hartweger.rs/kursevi)
- [Grupni kursevi — raspored](https://www.hartweger.rs/grupni-kursevi)
- [Individualni kursevi](https://www.hartweger.rs/individualni-kursevi)
- [Besplatno testiranje nivoa](https://www.hartweger.rs/besplatno-testiranje)
- [Blog / Magazin](https://www.hartweger.rs/magazin)
- [O Nataši](https://www.hartweger.rs/o-natasi)
- [VoKuM metodologija](https://www.hartweger.rs/metodologija)
- [Kontakt](https://www.hartweger.rs/kontakt)
- [Česta pitanja](https://www.hartweger.rs/faq)

## Kontakt
- Email: info@hartweger.rs
- Web: https://www.hartweger.rs
- Instagram: https://www.instagram.com/hartweger_centar/
- YouTube: https://www.youtube.com/channel/UCa_7vX8_EtWNUbjA9SqqMwQ
```

- [ ] **Step 2: Commit**

```bash
git add public/llms.txt
git commit -m "feat(seo): add llms.txt for AI crawlers"
```

---

### Task 10: next/Image conversion — ProizvodKartica + remote patterns

**Files:**
- Modify: `next.config.ts` (add remote patterns)
- Modify: `src/components/ProizvodKartica.tsx`

- [ ] **Step 1: Add remote patterns to next.config.ts**

In `next.config.ts`, update the `images.remotePatterns` array (lines 6-9) to:
```ts
images: {
  remotePatterns: [
    { hostname: "rzmyglynjcygsbicssbt.supabase.co" },
    { hostname: "*.supabase.co" },
    { hostname: "www.hartweger.rs" },
    { hostname: "vumbnail.com" },
  ],
},
```

- [ ] **Step 2: Convert ProizvodKartica.tsx**

Replace the full content of `src/components/ProizvodKartica.tsx` with:
```tsx
import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/lib/types";

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

export default function ProizvodKartica({ course }: { course: Course }) {
  const isVariable =
    course.category === "individualni" || course.category === "mesecni";

  return (
    <Link href={`/kursevi/${course.slug}`} className="block group">
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-plava hover:shadow-md transition-all">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            width={400}
            height={192}
            className="w-full h-48 object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-plava to-plava-dark flex items-center justify-center">
            <span className="text-white text-lg font-bold text-center px-4">
              {course.title}
            </span>
          </div>
        )}
        <div className="p-5">
          <h3 className="font-heading font-semibold text-lg text-gray-900 group-hover:text-plava transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {course.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-bold text-gray-900">
              {isVariable && "od "}
              {formatPrice(course.price)} din
            </span>
            <span className="text-sm text-plava font-medium group-hover:translate-x-1 transition-transform inline-block">
              Saznaj više →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts src/components/ProizvodKartica.tsx
git commit -m "feat(mobile): convert ProizvodKartica to next/Image, add remote patterns"
```

---

### Task 11: next/Image conversion — Homepage (page.tsx)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add Image import**

At the top of `src/app/page.tsx`, add the import (after existing imports):
```ts
import Image from "next/image";
```

- [ ] **Step 2: Convert hero image (line 54)**

Replace the `<img>` at line 54:
```tsx
<img
  src="https://www.hartweger.rs/wp-content/uploads/2025/06/Hartweger_Centar_Natasa_Hartweger.jpg"
  alt="Nataša Hartweger"
```
with:
```tsx
<Image
  src="https://www.hartweger.rs/wp-content/uploads/2025/06/Hartweger_Centar_Natasa_Hartweger.jpg"
  alt="Nataša Hartweger"
  width={540}
  height={540}
  priority
  sizes="(max-width: 768px) 100vw, 540px"
```
Keep all existing className attributes. Change the closing `/>` if needed.

- [ ] **Step 3: Convert VoKuM image (line 111)**

Replace the `<img>` at line 111:
```tsx
<img
  src="/images/natasa-laptop.jpg"
  alt="Nataša Hartweger"
```
with:
```tsx
<Image
  src="/images/natasa-laptop.jpg"
  alt="Nataša Hartweger"
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, 50vw"
```
Keep existing className.

- [ ] **Step 4: Convert blog image (line 301)**

Replace the `<img>` at line 301:
```tsx
<img
  src="https://www.hartweger.rs/wp-content/uploads/2026/05/Untitled-1200-x-628-px-1-1024x536.png"
  alt="Blog"
```
with:
```tsx
<Image
  src="https://www.hartweger.rs/wp-content/uploads/2026/05/Untitled-1200-x-628-px-1-1024x536.png"
  alt="Blog"
  width={1024}
  height={536}
  sizes="(max-width: 768px) 100vw, 50vw"
```
Keep existing className.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(mobile): convert homepage images to next/Image"
```

---

### Task 12: next/Image conversion — /o-natasi

**Files:**
- Modify: `src/app/o-natasi/page.tsx`

- [ ] **Step 1: Add Image import**

Add at top:
```ts
import Image from "next/image";
```

- [ ] **Step 2: Convert portrait image (line 17)**

Replace `<img>` at line 17:
```tsx
<img
  src="/images/IMG_6264.jpg"
  alt="Nataša Hartweger"
```
with:
```tsx
<Image
  src="/images/IMG_6264.jpg"
  alt="Nataša Hartweger"
  width={320}
  height={400}
  priority
  sizes="(max-width: 768px) 256px, 320px"
```

- [ ] **Step 3: Convert team image (line 66)**

Replace `<img>` at line 66:
```tsx
<img
  src="https://www.hartweger.rs/wp-content/uploads/2021/02/natasa-hartweger-i-tim-hartweger.jpg"
  alt="Nataša Hartweger i tim"
```
with:
```tsx
<Image
  src="https://www.hartweger.rs/wp-content/uploads/2021/02/natasa-hartweger-i-tim-hartweger.jpg"
  alt="Nataša Hartweger i tim"
  width={800}
  height={500}
  sizes="(max-width: 768px) 100vw, 800px"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/o-natasi/page.tsx
git commit -m "feat(mobile): convert o-natasi images to next/Image"
```

---

### Task 13: next/Image conversion — /kursevi/paket-a1-a2-b1

**Files:**
- Modify: `src/app/kursevi/paket-a1-a2-b1/page.tsx`

- [ ] **Step 1: Add Image import**

Add at top:
```ts
import Image from "next/image";
```

- [ ] **Step 2: Convert first image (line 62)**

Replace `<img>` at line 62:
```tsx
<img
  src="/images/natasa-laptop.jpg"
  alt="Nataša Hartweger"
```
with:
```tsx
<Image
  src="/images/natasa-laptop.jpg"
  alt="Nataša Hartweger"
  width={600}
  height={400}
  priority
  sizes="(max-width: 768px) 100vw, 50vw"
```

- [ ] **Step 3: Convert second image (line 350)**

Replace `<img>` at line 350:
```tsx
<img
  src="/images/IMG_6264.jpg"
  alt="Nataša Hartweger"
```
with:
```tsx
<Image
  src="/images/IMG_6264.jpg"
  alt="Nataša Hartweger"
  width={400}
  height={500}
  sizes="(max-width: 768px) 100vw, 400px"
```

- [ ] **Step 4: Add safe-bottom to sticky CTA bar (line ~443)**

Find the mobile sticky CTA bar div (should be near line 443 with `fixed bottom-0`) and add the `safe-bottom` class if not present.

- [ ] **Step 5: Commit**

```bash
git add src/app/kursevi/paket-a1-a2-b1/page.tsx
git commit -m "feat(mobile): convert paket images to next/Image, add safe-bottom"
```

---

### Task 14: next/Image conversion — /magazin pages

**Files:**
- Modify: `src/app/magazin/page.tsx`
- Modify: `src/app/magazin/[slug]/page.tsx`

- [ ] **Step 1: Convert magazin/page.tsx listing images**

Add `import Image from "next/image";` at top.

Find the `<img>` tag in the blog listing (around line 48-51):
```tsx
<img src={post.thumbnail_url} alt={post.title} className="w-full h-48 object-cover" />
```
Replace with:
```tsx
<Image src={post.thumbnail_url} alt={post.title} width={400} height={192} className="w-full h-48 object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
```

- [ ] **Step 2: Convert magazin/[slug]/page.tsx images**

Add `import Image from "next/image";` at top.

Find main article thumbnail (around line 87):
```tsx
<img src={post.thumbnail_url} alt={post.title}
```
Replace with:
```tsx
<Image src={post.thumbnail_url} alt={post.title} width={800} height={400} sizes="(max-width: 768px) 100vw, 800px" priority
```

Find related article thumbnails (around line 149):
```tsx
<img src={r.thumbnail_url} alt={r.title}
```
Replace with:
```tsx
<Image src={r.thumbnail_url} alt={r.title} width={400} height={192} sizes="(max-width: 768px) 100vw, 33vw"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/magazin/page.tsx src/app/magazin/\[slug\]/page.tsx
git commit -m "feat(mobile): convert magazin images to next/Image"
```

---

### Task 15: next/Image conversion — /metodologija + VideoPlayer

**Files:**
- Modify: `src/app/metodologija/page.tsx` (if has `<img>`)
- Modify: `src/components/VideoPlayer.tsx`

- [ ] **Step 1: Convert metodologija image**

Check `src/app/metodologija/page.tsx` for `<img>` tags. If found (reported at ~line 28-30 with `/images/natasa-laptop.jpg`):

Add `import Image from "next/image";` at top.

Replace `<img>` with:
```tsx
<Image
  src="/images/natasa-laptop.jpg"
  alt="Nataša Hartweger"
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, 50vw"
```

- [ ] **Step 2: Convert VideoPlayer thumbnail**

In `src/components/VideoPlayer.tsx`, add import and convert the Vimeo thumbnail (line 23).

Add `import Image from "next/image";` after line 1.

Replace:
```tsx
<img
  src={`https://vumbnail.com/${vimeoId}.jpg`}
  alt="Video thumbnail"
  className="absolute top-0 left-0 w-full h-full object-cover"
  loading="lazy"
/>
```
with:
```tsx
<Image
  src={`https://vumbnail.com/${vimeoId}.jpg`}
  alt="Video thumbnail"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 800px"
/>
```

Note: Using `fill` instead of width/height because the parent has `position: relative` and `padding-bottom: 56.25%`. Remove `loading="lazy"` as next/Image handles this automatically. Also remove the `absolute top-0 left-0 w-full h-full` classes since `fill` adds them.

- [ ] **Step 3: Commit**

```bash
git add src/app/metodologija/page.tsx src/components/VideoPlayer.tsx
git commit -m "feat(mobile): convert metodologija + VideoPlayer images to next/Image"
```

---

### Task 16: Final verification

- [ ] **Step 1: Build the project**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms
npx next build 2>&1 | tail -20
```

Expected: successful build, no TypeScript errors.

- [ ] **Step 2: Verify robots.txt accessible**

```bash
curl -s http://localhost:3000/robots.txt
```

- [ ] **Step 3: Verify sitemap**

```bash
curl -s http://localhost:3000/sitemap.xml | head -40
```

Expected: XML with all static pages + course URLs + blog URLs.

- [ ] **Step 4: Check for remaining `<img` tags in app/**

```bash
grep -rn '<img' src/app/ src/components/ --include='*.tsx' | grep -v 'node_modules' | grep -v '.next'
```

Expected: zero results (all converted to next/Image), or only intentional cases (SVG inline, noscript GTM iframe).

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "fix: address build issues from SEO + mobile polishing"
```

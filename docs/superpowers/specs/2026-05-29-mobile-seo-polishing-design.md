# Mobile + SEO Polishing — Design Spec

**Date:** 2026-05-29
**Status:** Approved
**Branch:** `feat/wp-migration`

## Goal

Prepare hartweger.rs Next.js site for launch with complete SEO foundation and mobile image optimization. The new site must be better than the current WordPress site in every measurable way.

---

## 1. SEO Osnove

### 1.1 robots.txt
Create `public/robots.txt`:
```
User-agent: *
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Sitemap: https://www.hartweger.rs/sitemap.xml
```

### 1.2 Sitemap
Expand `src/app/sitemap.ts` to include ALL public pages:
- Static: `/`, `/kursevi`, `/grupni-kursevi`, `/individualni-kursevi`, `/o-natasi`, `/kontakt`, `/faq`, `/metodologija`, `/uslovi`, `/besplatno-testiranje`, `/instaliraj`, `/provera-sertifikata`, `/kursevi/paket-a1-a2-b1`, `/magazin`
- Dynamic: `/kursevi/[slug]` for all courses (already exists)
- Dynamic: `/magazin/[slug]` for all blog posts

### 1.3 Canonical URLs
Add to `src/app/layout.tsx` metadata:
```ts
metadataBase: new URL('https://www.hartweger.rs'),
alternates: { canonical: './' }
```
Next.js auto-generates canonical per route from metadataBase.

### 1.4 Trailing Slash
Add `trailingSlash: false` to `next.config.ts` to prevent duplicate content.

### 1.5 Robots Metadata
Add to layout.tsx: `robots: { index: true, follow: true }`

---

## 2. Open Graph & Meta

### 2.1 Default OG Image
Download `https://www.hartweger.rs/wp-content/uploads/2024/04/header-graphic@2x1.png` to `public/og/default.png`. Set as default in layout.tsx openGraph.images.

### 2.2 Per-Page OG Images
- `/o-natasi` — download WP image: `natasa-hartweger-o-meni-*.jpg`
- `/kontakt` — download WP image: `natasa_hartweger_contact.png`

### 2.3 Dynamic OG
- `/kursevi/[slug]` — use `thumbnail_url` from Supabase in generateMetadata()
- `/magazin/[slug]` — use blog post image from Supabase

### 2.4 Missing openGraph on Pages
Add `openGraph: { title, description }` to metadata exports on ALL pages that lack it:
- `/kursevi`, `/grupni-kursevi`, `/individualni-kursevi`
- `/faq`, `/metodologija`, `/uslovi`
- `/kontakt`, `/o-natasi`
- `/besplatno-testiranje`, `/instaliraj`, `/provera-sertifikata`
- `/kursevi/paket-a1-a2-b1`, `/magazin`

Image inherits from layout.tsx default unless page specifies its own.

### 2.5 Twitter Card
Add to layout.tsx:
```ts
twitter: {
  card: 'summary_large_image',
  title: 'Hartweger — Škola nemačkog jezika',
  description: 'Naučite nemački jezik online — video kursevi, individualna i grupna nastava',
}
```

---

## 3. JSON-LD Structured Data

### 3.1 Organization (layout.tsx — global)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Centar za nemački jezik Hartweger",
  "url": "https://www.hartweger.rs",
  "logo": "https://www.hartweger.rs/logo.jpg",
  "email": "info@hartweger.rs",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jurija Gagarina 20",
    "addressLocality": "Novi Beograd",
    "postalCode": "11070",
    "addressCountry": "RS"
  },
  "areaServed": "Online",
  "sameAs": [
    "https://www.instagram.com/hartweger_centar/",
    "https://www.youtube.com/channel/UCa_7vX8_EtWNUbjA9SqqMwQ",
    "https://www.facebook.com/hartwegercentar/",
    "https://rs.linkedin.com/in/natasahartweger",
    "https://x.com/nacapaun"
  ]
}
```

### 3.2 Course (dynamic — `/kursevi/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "{{course.title}}",
  "description": "{{course.meta_description}}",
  "provider": { "@type": "Organization", "name": "Centar za nemački jezik Hartweger" },
  "educationalLevel": "{{course.level e.g. A1, A2, B1}}",
  "inLanguage": "de",
  "offers": {
    "@type": "Offer",
    "price": "{{course.price}}",
    "priceCurrency": "RSD",
    "availability": "https://schema.org/InStock"
  }
}
```

### 3.3 BlogPosting (dynamic — `/magazin/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{{post.title}}",
  "datePublished": "{{post.created_at}}",
  "dateModified": "{{post.updated_at}}",
  "author": { "@type": "Person", "name": "Nataša Hartweger" },
  "publisher": { "@type": "Organization", "name": "Centar za nemački jezik Hartweger" },
  "image": "{{post.image_url}}"
}
```

### 3.4 FAQPage (`/faq`)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{faq.question}}",
      "acceptedAnswer": { "@type": "Answer", "text": "{{faq.answer}}" }
    }
  ]
}
```
Note: Google retired FAQ rich results May 7 2026, but FAQ schema still helps AI citation (ChatGPT, Gemini, Perplexity).

### 3.5 BreadcrumbList (kursevi + blog)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Početna", "item": "https://www.hartweger.rs" },
    { "@type": "ListItem", "position": 2, "name": "Kursevi", "item": "https://www.hartweger.rs/kursevi" },
    { "@type": "ListItem", "position": 3, "name": "{{course.title}}" }
  ]
}
```

### 3.6 llms.txt
Create `public/llms.txt` — plain-text description of site for AI crawlers:
- Who: Centar za nemački jezik Hartweger, online škola
- What: Video kursevi, grupna i individualna nastava nemačkog (A1-C1)
- Key pages with descriptions
- Contact info

---

## 4. Mobile — Image Optimization

### 4.1 `<img>` → `next/Image` Conversion
Convert ALL plain `<img>` tags to `next/Image`:

| File | Instances | Notes |
|------|-----------|-------|
| `src/app/page.tsx` | ~3 | Hero image gets `priority` |
| `src/app/o-natasi/page.tsx` | ~2 | |
| `src/app/kontakt/page.tsx` | sidebar | |
| `src/app/kursevi/paket-a1-a2-b1/page.tsx` | TBD | |
| `src/app/magazin/[slug]/page.tsx` | thumbnails | |
| `src/components/ProizvodKartica.tsx` | 1 per card (x31) | Highest impact |

### 4.2 Remote Patterns
Add WP domain to `next.config.ts` images.remotePatterns:
```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'www.hartweger.rs' },
    // + any other external image domains (vumbnail.com for Vimeo, etc.)
  ]
}
```

### 4.3 Image Best Practices
- `sizes` attribute on all images for responsive srcset
- `priority={true}` on above-the-fold images (hero, first visible)
- All other images get default lazy loading

---

## 5. Finishing Touches

### 5.1 Vimeo Thumbnails
Add `loading="lazy"` to thumbnail images in VideoPlayer component.

### 5.2 Safe Area
Add `pb-[env(safe-area-inset-bottom)]` to sticky CTA bars for iPhone notch.

### 5.3 OG Images Download
Download from WP and save to `public/og/`:
- `default.png` — homepage hero (header-graphic@2x1.png)
- `o-natasi.jpg` — Nataša portrait
- `kontakt.png` — contact page image

---

## Out of Scope
- Blog content migration (separate task)
- Checkout flow
- NestPay integration
- NaKI chatbot
- New pages (/o-timu, /naki)

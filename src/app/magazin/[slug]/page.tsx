import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/public";
import { blogHtmlForRender } from "@/lib/sanitize";
import type { BlogPost } from "@/lib/types";

// Javni članak: ISR, servira se sa CDN-a (bez cookies), osvežava se na sat.
export const revalidate = 3600;

// Prerenderuj poznate objavljene članke pri build-u (SEO funnel); novi slugovi
// se renderuju on-demand i keširaju (dynamicParams podrazumevano true).
export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true);
  return (data ?? []).map((p) => ({ slug: p.slug as string }));
}

/** Strip Elementor wrapper divs/sections, keep only content */
function cleanWpContent(html: string): string {
  return html
    // Remove Elementor data attributes
    .replace(/\s*data-elementor[^=]*="[^"]*"/g, "")
    .replace(/\s*data-id="[^"]*"/g, "")
    .replace(/\s*data-element_type="[^"]*"/g, "")
    .replace(/\s*data-e-type="[^"]*"/g, "")
    .replace(/\s*data-widget_type="[^"]*"/g, "")
    .replace(/\s*data-settings='[^']*'/g, "")
    // Remove Elementor wrapper elements but keep their content
    .replace(/<section[^>]*class="elementor-section[^"]*"[^>]*>/g, "")
    .replace(/<\/section>/g, "")
    .replace(/<div[^>]*class="elementor-container[^"]*"[^>]*>/g, "")
    .replace(/<div[^>]*class="elementor-column[^"]*"[^>]*>/g, "")
    .replace(/<div[^>]*class="elementor-widget-wrap[^"]*"[^>]*>/g, "")
    .replace(/<div[^>]*class="elementor-element[^"]*"[^>]*>/g, "")
    .replace(/<div[^>]*class="elementor-widget-container"[^>]*>/g, "")
    .replace(/<div[^>]*class="elementor elementor-[^"]*"[^>]*>/g, "")
    // Clean up resulting empty closing divs (best effort)
    .replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, "")
    .replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, "")
    .replace(/<\/div>\s*<\/div>\s*<\/div>/g, "")
    // Remove elementor heading class but keep the heading
    .replace(/class="elementor-heading-title[^"]*"/g, "")
    .replace(/class="elementor-size-default"/g, "")
    // Remove duplicate featured image (already shown as thumbnail above)
    .replace(/<div[^>]*class="[^"]*theme-post-featured-image[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g, "")
    // Remove duplicate post title (already shown in hero)
    .replace(/<div[^>]*class="[^"]*theme-post-title[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g, "")
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description, excerpt, thumbnail_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) return { title: "Članak nije pronađen - Hartweger" };

  const description = post.meta_description || post.excerpt || "";
  return {
    title: `${post.title} - Hartweger Magazin`,
    description,
    openGraph: {
      title: `${post.title} - Hartweger Magazin`,
      description,
      type: "article",
      ...(post.thumbnail_url && {
        // width/height su bitni: bez njih WhatsApp/Viber/LinkedIn prikazuju mali isečen kvadrat
        images: [{ url: post.thumbnail_url, alt: post.title, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Hartweger Magazin`,
      description,
      ...(post.thumbnail_url && { images: [post.thumbnail_url] }),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) notFound();

  const post = data as BlogPost;

  // FAQ schema: parovi <h4>pitanje</h4> + prvi <p> odgovora iz sadržaja.
  // Renderuje se samo ako post ima bar 2 para (sekcija "Česta pitanja").
  const faqPairs = Array.from(
    post.content.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>/g)
  )
    .map((m) => ({
      q: m[1].replace(/<[^>]+>/g, "").trim(),
      a: m[2].replace(/<[^>]+>/g, "").trim(),
    }))
    .filter((p) => p.q && p.a);

  // Related posts (same category, different slug)
  const { data: related } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, thumbnail_url, published_at, category")
    .eq("is_published", true)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <>
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
      {faqPairs.length >= 2 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqPairs.map((p) => ({
                "@type": "Question",
                name: p.q,
                acceptedAnswer: { "@type": "Answer", text: p.a },
              })),
            }),
          }}
        />
      )}
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-plava">Početna</Link>
            <span>/</span>
            <Link href="/magazin" className="hover:text-plava">Magazin</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{post.title}</span>
          </nav>

          {(post as any).category && (
            <span className="inline-block text-xs font-bold tracking-wide uppercase text-plava bg-plava-light px-3 py-1 rounded-full mb-4">
              {(post as any).category}
            </span>
          )}

          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>

          {post.published_at && (
            <p className="text-gray-400 text-sm">
              {new Date(post.published_at).toLocaleDateString("sr-Latn-RS", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </section>

      {/* Thumbnail */}
      {post.thumbnail_url && (
        <div className="max-w-3xl mx-auto px-4 -mt-2 mb-8">
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            width={800}
            height={400}
            className="w-full rounded-xl shadow-md"
            sizes="(max-width: 768px) 100vw, 800px"
            preload
            fetchPriority="high"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
        <div
          className="prose prose-gray max-w-none
            prose-headings:font-montserrat prose-headings:text-gray-900
            prose-p:text-base prose-p:leading-[1.8] prose-p:text-gray-600
            prose-a:text-plava prose-a:underline prose-a:decoration-plava/40 prose-a:underline-offset-2 hover:prose-a:decoration-plava
            prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:my-8
            prose-li:text-gray-600 prose-li:leading-[1.8]
            prose-blockquote:border-plava prose-blockquote:bg-plava-light/20 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-5
            prose-strong:text-gray-800
            prose-table:text-sm
            [&_figure]:my-8 [&_figure]:text-center
            [&_figcaption]:text-sm [&_figcaption]:text-gray-400 [&_figcaption]:mt-2
            [&_iframe]:rounded-xl [&_iframe]:shadow-md [&_iframe]:max-w-full
            [&_.aligncenter]:mx-auto [&_.aligncenter]:block [&_.aligncenter]:my-6"
          dangerouslySetInnerHTML={{ __html: blogHtmlForRender(slug, post.content) }}
        />
        </div>
      </article>

      {/* NaKI + Kursevi banner */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-rose-50 rounded-2xl p-5 md:p-6 flex gap-4 items-start border border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 bg-plava-light rounded-full flex items-center justify-center text-xl">
            💬
          </div>
          <div className="text-sm md:text-base text-gray-700 leading-relaxed">
            <p>
              Učiš nemački? Isprobaj{" "}
              <Link href="/naki" className="text-plava font-semibold hover:underline">
                NaKI
              </Link>
              {" "}- besplatnog AI asistenta za vežbanje gramatike i konverzaciju.
            </p>
            <p className="mt-1">
              A ako želiš učenje sa profesorom, pogledaj našu{" "}
              <Link href="/kursevi" className="text-[#F78687] font-semibold hover:underline">
                ponudu kurseva
              </Link>
              .
            </p>
          </div>
        </div>
      </div>


      {/* Related */}
      {related && related.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-8 text-center">
              Pročitaj još
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((r: any) => (
                <Link
                  key={r.slug}
                  href={`/magazin/${r.slug}`}
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:border-plava hover:shadow-md transition-all"
                >
                  {r.thumbnail_url ? (
                    <Image src={r.thumbnail_url} alt={r.title} width={400} height={192} className="w-full h-40 object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-plava-light to-white" />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-plava transition-colors text-[15px] leading-snug">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

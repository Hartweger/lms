import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) notFound();

  const post = data as BlogPost;

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
            priority
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        <div
          className="prose prose-gray prose-lg max-w-none
            prose-headings:font-montserrat prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-gray-600
            prose-a:text-plava prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:max-h-[500px] prose-img:w-auto
            prose-li:text-gray-600
            prose-blockquote:border-plava prose-blockquote:bg-plava-light/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-strong:text-gray-800
            prose-table:text-sm
            [&_figure]:my-8 [&_figure]:text-center
            [&_figcaption]:text-sm [&_figcaption]:text-gray-400 [&_figcaption]:mt-2
            [&_iframe]:rounded-xl [&_iframe]:shadow-md [&_iframe]:max-w-full
            [&_.wp-block-image]:my-8 [&_.wp-block-image]:text-center
            [&_.wp-block-image_img]:mx-auto [&_.wp-block-image_img]:rounded-xl [&_.wp-block-image_img]:shadow-md [&_.wp-block-image_img]:max-h-[500px] [&_.wp-block-image_img]:w-auto"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* CTA */}
      <section className="py-12 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-montserrat font-bold text-xl text-gray-900">
              Hoćeš da naučiš nemački?
            </h2>
            <p className="text-gray-600 mt-1">
              Pogledaj naše kurseve ili uradi besplatno testiranje.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/kursevi"
              className="bg-[#F78687] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e06060] transition-all whitespace-nowrap"
            >
              Pogledaj kurseve
            </Link>
            <Link
              href="/besplatno-testiranje"
              className="border-2 border-plava text-plava px-6 py-3 rounded-xl font-bold text-sm hover:bg-plava hover:text-white transition-all whitespace-nowrap"
            >
              Besplatno testiranje
            </Link>
          </div>
        </div>
      </section>

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

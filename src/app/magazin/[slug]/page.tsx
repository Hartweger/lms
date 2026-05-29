import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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

          {post.category && (
            <span className="inline-block text-xs font-bold tracking-wide uppercase text-plava bg-plava-light px-3 py-1 rounded-full mb-4">
              {post.category}
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
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full rounded-xl shadow-md"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        <div
          className="prose prose-gray prose-lg max-w-none
            prose-headings:font-montserrat prose-headings:text-gray-900
            prose-a:text-plava prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl"
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
              {(related as BlogPost[]).map((r) => (
                <Link
                  key={r.slug}
                  href={`/magazin/${r.slug}`}
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:border-plava hover:shadow-md transition-all"
                >
                  {r.thumbnail_url ? (
                    <img src={r.thumbnail_url} alt={r.title} className="w-full h-40 object-cover" />
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

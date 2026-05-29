import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Magazin — Hartweger škola nemačkog jezika",
  description: "Saveti za učenje nemačkog jezika, gramatika, vokabular, priprema za ispite i život u nemačkom govornom području.",
  openGraph: {
    title: "Magazin — Hartweger škola nemačkog jezika",
    description: "Saveti za učenje nemačkog jezika, gramatika, vokabular i priprema za ispite.",
  },
};

export default async function MagazinPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const articles = (posts ?? []) as BlogPost[];

  return (
    <>
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Magazin
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Saveti za učenje nemačkog, gramatika, vokabular, priprema za ispite i život u nemačkom govornom području.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {articles.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Članci se dodaju uskoro.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((post) => (
                <Link
                  key={post.id}
                  href={`/magazin/${post.slug}`}
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:border-plava hover:shadow-md transition-all"
                >
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-plava-light to-white flex items-center justify-center">
                      <span className="text-plava text-4xl font-bold opacity-20">H</span>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">
                      {post.category && (
                        <span className="uppercase tracking-wide font-semibold text-plava mr-2">{post.category}</span>
                      )}
                      {post.published_at && new Date(post.published_at).toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <h2 className="font-bold text-gray-900 group-hover:text-plava transition-colors mb-2 leading-snug">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

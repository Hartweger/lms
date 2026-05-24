import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import quotesData from "@/data/quotes.json";

export const dynamic = "force-dynamic";

function getRandomQuote() {
  const quotes = quotesData.quotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export default async function Pocetna() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const quote = getRandomQuote();

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Greeting */}
        <p className="text-sm font-medium text-plava tracking-wider uppercase mb-4">
          Škola nemačkog jezika
        </p>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
          Učenje počinje<br />
          <span className="text-plava">ovde.</span>
        </h1>

        <p className="text-gray-500 mb-8 text-lg">
          Video lekcije, vežbe, kvizovi i AI dijalozi —<br className="hidden sm:block" />
          sve na jednom mestu.
        </p>

        {/* CTA */}
        <Link
          href="/prijava"
          className="inline-block bg-plava text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-plava-dark transition-colors shadow-lg shadow-plava/20"
        >
          Prijavi se
        </Link>

        <p className="text-sm text-gray-400 mt-4">
          Nemaš nalog? Kurseve kupi na{" "}
          <a href="https://hartweger.rs" className="text-plava hover:underline" target="_blank" rel="noopener noreferrer">
            hartweger.rs
          </a>
        </p>

        {/* Motivational quote */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-gray-400 italic text-sm">
            „{quote.text_de}"
          </p>
          {quote.show_translation && (
            <p className="text-gray-300 text-xs mt-1">{quote.text_sr}</p>
          )}
        </div>
      </div>
    </div>
  );
}

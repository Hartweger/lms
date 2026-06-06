"use client";

import { useEffect, useState } from "react";

const CYR_TO_LAT: Record<string, string> = {
  А:"A",Б:"B",В:"V",Г:"G",Д:"D",Ђ:"Đ",Е:"E",Ж:"Ž",З:"Z",И:"I",Ј:"J",
  К:"K",Л:"L",Љ:"Lj",М:"M",Н:"N",Њ:"Nj",О:"O",П:"P",Р:"R",С:"S",Т:"T",
  Ћ:"Ć",У:"U",Ф:"F",Х:"H",Ц:"C",Ч:"Č",Џ:"Dž",Ш:"Š",
  а:"a",б:"b",в:"v",г:"g",д:"d",ђ:"đ",е:"e",ж:"ž",з:"z",и:"i",ј:"j",
  к:"k",л:"l",љ:"lj",м:"m",н:"n",њ:"nj",о:"o",п:"p",р:"r",с:"s",т:"t",
  ћ:"ć",у:"u",ф:"f",х:"h",ц:"c",ч:"č",џ:"dž",ш:"š",
};

function toLatin(text: string): string {
  return text.replace(/./g, (ch) => CYR_TO_LAT[ch] ?? ch);
}

interface Review {
  author: string;
  rating: number;
  text: string;
  time: string;
  photo: string;
}

interface ReviewData {
  rating: number;
  total: number;
  reviews: Review[];
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  );
}

export default function GoogleRecenzije() {
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d && Array.isArray(d.reviews) ? d : null))
      .catch(() => {});
  }, []);

  // Render nothing if the API failed (e.g. missing key, quota) or has no
  // reviews — never reach data.reviews.map() with an undefined reviews array.
  if (!data || !data.reviews?.length) return null;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_42x16dp.png"
              alt="Google"
              className="h-5"
            />
            <span className="text-2xl font-bold text-gray-900">{data.rating}</span>
            <Stars count={Math.round(data.rating)} />
          </div>
          <p className="text-gray-500 text-sm">
            {data.total} recenzija na Google-u
          </p>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                {r.photo ? (
                  <img
                    src={r.photo}
                    alt={r.author}
                    className="w-9 h-9 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-plava-light flex items-center justify-center text-plava text-sm font-bold">
                    {r.author[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.author}</p>
                  <div className="flex items-center gap-2">
                    <Stars count={r.rating} />
                    <span className="text-xs text-gray-400">{toLatin(r.time)}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {(() => { const t = toLatin(r.text); return t.length > 200 ? t.slice(0, 200) + "..." : t; })()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

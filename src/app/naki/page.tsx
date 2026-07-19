import type { Metadata } from "next";
import NakiChat from "@/components/naki/NakiChat";
import { NakiAvatar } from "@/components/naki/NakiAvatar";

export const metadata: Metadata = {
  title: "NaKI - prvi AI asistent za učenje nemačkog | Hartweger",
  description:
    "Vežbaj razgovor i gramatiku na nemačkom sa NaKI, prvim AI asistentom na našem jeziku. Besplatno, dostupno 0-24, uz pravog profesora i ispitivača.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "NaKI - prvi AI asistent za učenje nemačkog | Hartweger",
    description:
      "Vežbaj razgovor i gramatiku na nemačkom sa NaKI, prvim AI asistentom na našem jeziku. Besplatno, 0-24, uz pravog profesora.",
  },
};

const NAKI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

.naki-page { font-family: 'Nunito', sans-serif; color: #2d3748; line-height: 1.6; }

.naki-hero {
  display: flex; align-items: center; justify-content: center;
  gap: 3rem; padding: 3rem 2rem 2rem; max-width: 1000px; margin: 0 auto; flex-wrap: wrap;
}
.naki-avatar-wrapper { flex-shrink: 0; animation: nakiSway 3s ease-in-out infinite; transform-origin: bottom center; }
@keyframes nakiSway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
.naki-hero-text { max-width: 440px; text-align: left; }
.naki-hero-text h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.8rem; line-height: 1.25; color: #2d3748; }
.naki-hero-text h1 span { color: #0AB3D7; }
.naki-hero-text p { font-size: 1.05rem; color: #718096; margin-bottom: 1.5rem; }
.naki-btn-primary {
  display: inline-block; background: linear-gradient(135deg, #0AB3D7, #F78687);
  color: white; font-weight: 700; font-size: 1.05rem; padding: 0.85rem 2rem;
  border: none; border-radius: 50px; cursor: pointer; text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(10,179,215,0.3);
}
.naki-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(10,179,215,0.4); color: white; }

.naki-chat-section { max-width: 750px; margin: 0 auto 3rem; padding: 0 1.5rem; }
.naki-chat-section h2 { text-align: center; font-size: 1.5rem; margin-bottom: 1rem; color: #0AB3D7; }

.naki-features {
  max-width: 900px; margin: 2rem auto 3rem; padding: 0 1.5rem;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1.2rem;
}
.naki-feature-card {
  background: white; border-radius: 16px; padding: 1.5rem; text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.2s;
}
.naki-feature-card:hover { transform: translateY(-4px); }
.naki-feature-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.naki-feature-card h3 { font-size: 1rem; margin-bottom: 0.3rem; color: #0AB3D7; }
.naki-feature-card p { font-size: 0.85rem; color: #718096; margin: 0; }

.naki-seo { max-width: 820px; margin: 1rem auto 0; padding: 0 1.5rem; }
.naki-seo h2 { font-size: 1.5rem; color: #2d3748; margin: 2rem 0 0.8rem; text-align: center; }
.naki-seo p { color: #4a5568; margin-bottom: 1rem; }
.naki-seo ul { color: #4a5568; padding-left: 1.2rem; margin-bottom: 1rem; }
.naki-seo li { margin-bottom: 0.5rem; }

.naki-faq { max-width: 820px; margin: 1.5rem auto 2rem; padding: 0 1.5rem; }
.naki-faq h2 { font-size: 1.5rem; color: #2d3748; margin-bottom: 1rem; text-align: center; }
.naki-faq details {
  background: white; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.8rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}
.naki-faq summary { font-weight: 700; cursor: pointer; color: #2d3748; list-style: none; }
.naki-faq summary::-webkit-details-marker { display: none; }
.naki-faq details p { color: #718096; margin: 0.6rem 0 0; }
.naki-cta-final { text-align: center; margin: 2rem auto 0; }

@media (max-width: 680px) {
  .naki-hero { flex-direction: column; text-align: center; padding: 2rem 1.5rem; }
  .naki-hero-text { text-align: center; }
  .naki-avatar-wrapper svg { width: 170px; height: auto; }
}
`;

const FEATURES = [
  { icon: "📖", title: "Gramatika", text: "Padeži, vremena, red reči - sve objašnjeno jednostavno." },
  { icon: "💬", title: "Razgovori", text: "Vežbaj dijaloge za svakodnevne situacije na nemačkom." },
  { icon: "✍️", title: "Vežbanja", text: "Interaktivni zadaci prilagođeni tvom nivou znanja." },
  { icon: "🎯", title: "Schreiben", text: "Ocenjujem ti pismeni rad kao ispitivač, po nivou." },
];

const FAQ = [
  {
    q: "Da li je NaKI zaista besplatan?",
    a: "Da, vežbanje sa NaKI je besplatno. Dovoljno je da otvoriš stranicu i počneš razgovor.",
  },
  {
    q: "Mogu li da vežbam razgovor, ne samo gramatiku?",
    a: "Možeš oboje - NaKI vodi razgovor sa tobom na nemačkom i ispravlja greške usput.",
  },
  {
    q: "Treba li mi predznanje?",
    a: "Ne. NaKI radi sa svim nivoima, od potpunih početnika (A1) do naprednih.",
  },
  {
    q: "Da li NaKI zamenjuje časove?",
    a: "NaKI je odlična dopuna za svakodnevno vežbanje. Za strukturisano napredovanje i pripremu za ispit, tu su video kursevi i individualni časovi sa Natašom Hartweger.",
  },
];

export default function NakiPage() {
  return (
    <main className="naki-page min-h-screen bg-gray-50 pb-8">
      <style dangerouslySetInnerHTML={{ __html: NAKI_CSS }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      {/* HERO */}
      <section className="naki-hero">
        <div className="naki-avatar-wrapper">
          <NakiAvatar />
        </div>
        <div className="naki-hero-text">
          <h1>
            Zdravo! Ja sam <span>NaKI</span> - tvoj lični asistent za nemački!
          </h1>
          <p>
            NaKI je Natašin AI asistent koji ti pomaže da savladaš nemačku gramatiku,
            vežbaš razgovore i naučiš nove reči - brzo, lako i uz osmeh.
          </p>
          <a href="#naki-chat" className="naki-btn-primary">
            Počni razgovor
          </a>
        </div>
      </section>

      {/* CHAT */}
      <section className="naki-chat-section" id="naki-chat">
        <h2>Razgovaraj sa NaKI</h2>
        <NakiChat />
      </section>

      {/* FEATURES */}
      <section className="naki-features">
        {FEATURES.map((f) => (
          <div className="naki-feature-card" key={f.title}>
            <div className="naki-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      {/* SEO CONTENT */}
      <section className="naki-seo">
        <h2>Zašto NaKI, a ne obična aplikacija</h2>
        <p>
          Globalne aplikacije te uče uopšteno i bezlično. NaKI je drugačiji - napravljen je
          uz pravu školu nemačkog i profesora koji je licencirani ispitivač za Goethe i TELC ispite.
        </p>
        <ul>
          <li><strong>Na našem jeziku</strong> - objašnjenja razumeš odmah, bez prevođenja.</li>
          <li><strong>Uz pravog profesora</strong> - radi po VoKuM metodi Nataše Hartweger (vokabular, komunikacija, motivacija).</li>
          <li><strong>Sa kontekstom ispita</strong> - korisno ako se spremaš za Goethe, TELC ili FSP ispit.</li>
          <li><strong>Deo prave škole</strong> - kad budeš spreman za korak dalje, tu su video kursevi i individualni časovi.</li>
        </ul>
        <p>
          Zanima te kako se NaKI poredi sa Duolingom, Babbelom i ostalima? Pogledaj naš pregled{" "}
          <a href="/magazin/aplikacije-za-ucenje-nemackog-jezika">najboljih aplikacija za učenje nemačkog jezika</a>.
        </p>
      </section>

      {/* FAQ */}
      <section className="naki-faq">
        <h2>Često postavljana pitanja</h2>
        {FAQ.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
        <div className="naki-cta-final">
          <a href="#naki-chat" className="naki-btn-primary">
            Počni da vežbaš sa NaKI
          </a>
        </div>
      </section>
    </main>
  );
}

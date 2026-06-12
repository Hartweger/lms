import type { Metadata } from "next";
import NakiChat from "@/components/naki/NakiChat";
import { NakiAvatar } from "@/components/naki/NakiAvatar";

export const metadata: Metadata = {
  title: "NaKI - AI asistent za nemački | Hartweger",
  description:
    "NaKI je AI asistent Nataše Hartweger za učenje nemačkog jezika. Postavi pitanje, vežbaj gramatiku i dobij objašnjenja na srpskom - besplatno.",
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

export default function NakiPage() {
  return (
    <main className="naki-page min-h-screen bg-gray-50 pb-8">
      <style dangerouslySetInnerHTML={{ __html: NAKI_CSS }} />

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
    </main>
  );
}

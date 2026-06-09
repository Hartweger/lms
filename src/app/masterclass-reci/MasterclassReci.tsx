"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "masterclass-reci-unlocked";
const VIMEO_ID = "1130736020";
const VIMEO_HASH = "719665c471";
const SLIDES_URL = "https://docs.google.com/presentation/d/16pn54U-ciZKJSM29xsXZza6HSEByX1V5LVc1XmSMuDs/edit?usp=sharing";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1SODoBnZkZ7wWh_U-TmT-dXUuLc3QdIBTPpw3f-gHXV4/edit?usp=sharing";
const QUIZLET_URL = "https://quizlet.com/user/Hartweger/folders/a1?i=2a998&x=1xqt";

const BULLETS = [
  { icon: "🧠", text: "kako da praviš svoje kartice i grupe reči" },
  { icon: "🌳", text: "kako da koristiš mape uma i asocijacije" },
  { icon: "📱", text: "koje aplikacije ti zaista pomažu da pamtiš efikasno" },
  { icon: "🔁", text: "kako da obnavljaš reči tako da ostanu u glavi — ne samo u svesci" },
];

export default function MasterclassReci() {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Unesi ispravnu email adresu.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/masterclass-reci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nešto nije u redu. Pokušaj ponovo.");
      }
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nešto nije u redu. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-plava-light inline-block px-4 py-1 rounded-full text-plava text-sm font-medium mb-4">
          Besplatan masterclass
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Kako da (na)učiš reči na stranom jeziku
        </h1>

        <div className="rounded-xl overflow-hidden shadow-sm mb-8" style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src={`https://player.vimeo.com/video/${VIMEO_ID}?h=${VIMEO_HASH}&title=0&byline=0&portrait=0`}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Kako da naučiš reči na stranom jeziku"
          />
        </div>

        <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">Materijali uz masterclass</h2>
        <div className="space-y-3">
          <a href={SLIDES_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-plava hover:bg-plava-light/40 transition-colors">
            <span className="text-2xl">📊</span>
            <span className="font-medium text-gray-900">Prezentacija</span>
            <span className="ml-auto text-plava text-sm font-medium">Otvori →</span>
          </a>
          <a href={SHEET_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-plava hover:bg-plava-light/40 transition-colors">
            <span className="text-2xl">📋</span>
            <span>
              <span className="font-medium text-gray-900 block">Tabela reči</span>
              <span className="text-gray-500 text-sm">Radi samo ako imaš Google nalog — kopiraj je na svoj Google Drive i koristi kao Google Sheet.</span>
            </span>
            <span className="ml-auto text-plava text-sm font-medium whitespace-nowrap">Otvori →</span>
          </a>
          <a href={QUIZLET_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-plava hover:bg-plava-light/40 transition-colors">
            <span className="text-2xl">🗂️</span>
            <span className="font-medium text-gray-900">Quizlet — kartice za vežbanje</span>
            <span className="ml-auto text-plava text-sm font-medium">Otvori →</span>
          </a>
        </div>

        <div className="mt-12 rounded-2xl bg-plava-light p-6 text-center">
          <p className="text-gray-700 mb-4">Spreman/na da kreneš ozbiljnije sa nemačkim?</p>
          <Link href="/kursevi" className="inline-block bg-plava text-white px-6 py-3 rounded-xl font-semibold hover:bg-plava-dark transition-colors">
            Pogledaj kurseve →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <div className="bg-plava-light inline-block px-4 py-1 rounded-full text-plava text-sm font-medium mb-6">
        Besplatan masterclass · ~90 minuta
      </div>
      <h1 className="font-heading text-3xl md:text-5xl font-bold text-gray-900 mb-4">
        Kako da (na)učiš reči na stranom jeziku
      </h1>
      <p className="text-lg text-gray-700 mb-2">Učiš reči, ali imaš utisak da ih sutradan zaboraviš?</p>
      <p className="text-lg text-gray-700 mb-6">Učiš reči kao što se učilo pre 20 godina?</p>
      <p className="text-lg text-gray-900 mb-8">
        Na ovom besplatnom masterclassu Nataša Hartweger ti pokazuje <strong>kako da promeniš način na koji pamtiš reči.</strong>
      </p>

      <p className="font-semibold text-gray-900 mb-3">Zajedno ćemo proći:</p>
      <ul className="space-y-3 mb-8">
        {BULLETS.map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-gray-700">
            <span className="text-xl leading-none mt-0.5">{b.icon}</span>
            <span>{b.text}</span>
          </li>
        ))}
      </ul>

      <p className="text-gray-700 mb-8">
        Bez obzira na nivo — bilo da tek počinješ sa nemačkim ili si već na B1/B2 — naučićeš <strong>taktike koje funkcionišu.</strong>
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <label htmlFor="mc-email" className="block font-semibold text-gray-900 mb-2">
          Ostavi mejl i odmah gledaš snimak
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="mc-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tvoj@email.com"
            autoComplete="email"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-plava focus:ring-2 focus:ring-plava/20 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-plava text-white px-6 py-3 rounded-xl font-semibold hover:bg-plava-dark transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? "Učitavam…" : "Gledaj besplatno →"}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <p className="text-gray-400 text-xs mt-3">Dobićeš i materijale uz masterclass. Bez spama, odjava u svakom trenutku.</p>
      </form>

      <div className="mt-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-plava text-white flex items-center justify-center font-bold text-sm">NH</div>
        <p className="text-sm text-gray-500">Nataša Hartweger · 20+ godina iskustva · 4.000+ polaznika</p>
      </div>
    </div>
  );
}

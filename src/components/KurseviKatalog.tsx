"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─── Types ─── */
type TabId = "grupni" | "video" | "individualni" | "besplatno";

interface KursKartica {
  badges: { label: string; color: string }[];
  title: string;
  meta: string;
  desc: string;
  price: string;
  priceEur: string;
  oldPrice?: string;
  salePrice?: string;
  salePriceEur?: string;
  saveAmount?: string;
  href: string;
  cta: string;
  level: string;
  accent?: boolean;
  freeCta?: boolean;
}

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  levels: { id: string; label: string }[];
  defaultLevel: string;
  cards: KursKartica[];
  info: { items: string[]; color: string };
}

/* ─── Badge colors ─── */
const badgeColors: Record<string, string> = {
  a1: "bg-sky-100 text-sky-700",
  a2: "bg-sky-50 text-sky-800",
  b1: "bg-amber-50 text-amber-700",
  b2: "bg-red-50 text-red-600",
  c1: "bg-pink-50 text-pink-700",
  video: "bg-red-50 text-red-600",
  paket: "bg-gray-900 text-white",
  spec: "bg-[#F78687] text-white",
  ind: "bg-blue-50 text-blue-700",
  master: "bg-gray-900 text-white",
  gram: "bg-blue-50 text-blue-700",
  novo: "bg-[#F78687] text-white",
  sale: "bg-[#F78687] text-white",
  free: "bg-sky-100 text-[#0AB3D7]",
  ai: "bg-[#0AB3D7] text-white",
  fide: "bg-gray-900 text-white",
};

/* ─── SVG Icons ─── */
const GroupIcon = (
  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" /><path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" /><circle cx="17" cy="9" r="2" /><path d="M21 20c0-2.5-1.5-4-4-4" />
  </svg>
);
const PlayIcon = (
  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const PersonIcon = (
  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const GiftIcon = (
  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

/* ─── Tab data ─── */
const tabs: TabConfig[] = [
  {
    id: "grupni",
    label: "Grupni",
    icon: GroupIcon,
    info: {
      items: [
        "Male grupe do 6 polaznika",
        "2 časa nedeljno sa profesorkom uživo",
        "Video lekcije sa Natašom dostupne 24/7",
        "Sertifikat po završetku kursa",
      ],
      color: "#0AB3D7",
    },
    levels: [
      { id: "a1", label: "A1" },
      { id: "a2", label: "A2" },
      { id: "b1", label: "B1" },
      { id: "b2", label: "B2" },
      { id: "c1", label: "C1" },
    ],
    defaultLevel: "a1",
    cards: [
      { badges: [{ label: "A1.1", color: "a1" }], title: "Grupni kurs A1.1", meta: "3–6 polaznika", desc: "Za apsolutne početnike. Osnove komunikacije, pozdrave i svakodnevne fraze.", price: "19.600 din", priceEur: "≈ 168€", href: "/kursevi/grupni-kurs-nemackog-jezika-a1-1", cta: "Prijavi se", level: "a1" },
      { badges: [{ label: "A1.2", color: "a1" }], title: "Grupni kurs A1.2", meta: "3–6 polaznika", desc: "Nastavak A1.1. Proširivanje rečnika i uvod u gramatičke strukture.", price: "19.600 din", priceEur: "≈ 168€", href: "/kursevi/grupni-kurs-nemackog-jezika-a1-2-2", cta: "Prijavi se", level: "a1" },
      { badges: [{ label: "A2.1", color: "a2" }], title: "Grupni kurs A2.1", meta: "3–6 polaznika", desc: "Elementarni nivo. Razgovarate o sebi, porodici i svakodnevnim situacijama.", price: "19.600 din", priceEur: "≈ 168€", href: "/kursevi/grupni-kurs-nemackog-jezika-a2", cta: "Prijavi se", level: "a2" },
      { badges: [{ label: "A2.2", color: "a2" }], title: "Grupni kurs A2.2", meta: "3–6 polaznika", desc: "Nastavak A2.1. Gramatika, konverzacija i svakodnevne situacije na višem nivou.", price: "19.600 din", priceEur: "≈ 168€", href: "/kursevi/grupni-kurs-nemackog-jezika-a2-2", cta: "Prijavi se", level: "a2" },
      { badges: [{ label: "B1.1", color: "b1" }], title: "Grupni kurs B1.1", meta: "3–6 polaznika", desc: "Srednji nivo. Razumete glavne teme i slobodno izražavate mišljenje.", price: "19.600 din", priceEur: "≈ 168€", href: "/kursevi/grupni-kurs-nemackog-jezika-b1-1-2", cta: "Prijavi se", level: "b1" },
      { badges: [{ label: "B1.2", color: "b1" }], title: "Grupni kurs B1.2", meta: "3–6 polaznika", desc: "Nastavak B1.1. Kompleksnija gramatika i bogaćenje vokabulara.", price: "19.600 din", priceEur: "≈ 168€", href: "/kursevi/grupni-kurs-nemackog-b1-2", cta: "Prijavi se", level: "b1" },
      { badges: [{ label: "B2.1", color: "b2" }], title: "Grupni kurs B2.1", meta: "3–6 polaznika", desc: "Više-srednji nivo. Tečna komunikacija, složene strukture i apstraktne teme.", price: "21.200 din", priceEur: "≈ 181€", href: "/kursevi/grupni-kurs-b2-1", cta: "Prijavi se", level: "b2" },
      { badges: [{ label: "B2.2", color: "b2" }], title: "Grupni kurs B2.2", meta: "3–6 polaznika", desc: "Nastavak B2.1. Priprema za Goethe B2 ispit i napredna konverzacija.", price: "21.200 din", priceEur: "≈ 181€", href: "/kursevi/grupni-kurs-b2-2", cta: "Prijavi se", level: "b2" },
      { badges: [{ label: "C1.1", color: "c1" }], title: "Grupni kurs C1.1", meta: "3–6 polaznika", desc: "Napredni nivo. Poslovni i akademski nemački, priprema za C1 ispit.", price: "21.200 din", priceEur: "≈ 181€", href: "/kursevi/grupni-kurs-c1-1", cta: "Prijavi se", level: "c1" },
      { badges: [{ label: "C1.2", color: "c1" }], title: "Grupni kurs C1.2", meta: "3–6 polaznika", desc: "Nastavak C1.1. Kompleksne strukture i kompletna priprema za Goethe C1 ispit.", price: "21.200 din", priceEur: "≈ 181€", href: "/kursevi/grupni-kurs-c1-2", cta: "Prijavi se", level: "c1" },
    ],
  },
  {
    id: "video",
    label: "Video",
    icon: PlayIcon,
    info: {
      items: [
        "Učite sopstvenim tempom, 24/7 pristup",
        "Video lekcije sa prof. Natašom Hartweger",
        "Testovi, vežbanja i materijali na platformi",
        "Pristup godinu dana + sertifikat",
      ],
      color: "#cc3333",
    },
    levels: [
      { id: "a1", label: "A1" },
      { id: "a2", label: "A2" },
      { id: "b1", label: "B1" },
      { id: "paket", label: "Paketi" },
      { id: "masterclass", label: "Masterclass" },
      { id: "gramatika", label: "Gramatika" },
      { id: "specijalni", label: "Specijalni kursevi" },
    ],
    defaultLevel: "a1",
    cards: [
      { badges: [{ label: "Video", color: "video" }, { label: "A1", color: "a1" }], title: "VIDEO kurs A1", meta: "Tvoj tempo · Pristup godinu dana", desc: "Kompletan A1 nivo u video lekcijama. Gramatika, izgovor, vežbanja — prati sopstvenim tempom.", price: "11.600 din", priceEur: "≈ 99€", href: "/kursevi/video-kurs-a1", cta: "Kupi kurs", level: "a1" },
      { badges: [{ label: "Video", color: "video" }, { label: "A2", color: "a2" }], title: "VIDEO kurs A2", meta: "Tvoj tempo · Pristup godinu dana", desc: "Nastavak A1. Gramatika i vokabular za svakodnevne situacije — bez vremenskog pritiska.", price: "11.600 din", priceEur: "≈ 99€", href: "/kursevi/video-kurs-a2", cta: "Kupi kurs", level: "a2" },
      { badges: [{ label: "Video", color: "video" }, { label: "B1", color: "b1" }], title: "VIDEO kurs B1", meta: "Tvoj tempo · Pristup godinu dana", desc: "Srednji nivo u tvom tempu. Priprema za B1 ispit ili rad u nemačkom govornom području.", price: "11.600 din", priceEur: "≈ 99€", href: "/kursevi/video-kurs-b1", cta: "Kupi kurs", level: "b1" },
      { badges: [{ label: "Paket", color: "paket" }, { label: "– 12%", color: "sale" }], title: "Video paket A1 + A2", meta: "2 kursa u paketu", desc: "A1 i A2 video kurs zajedno po specijalnoj ceni. Idealno za početnike koji žele brži napredak.", oldPrice: "23.200 din", salePrice: "20.475 din", salePriceEur: "≈ 175€", saveAmount: "Uštedite 2.725 din", price: "", priceEur: "", href: "/kursevi/paket-a1-i-a2", cta: "Kupi paket", level: "paket" },
      { badges: [{ label: "Paket", color: "paket" }, { label: "Najpopularnije", color: "novo" }, { label: "– 16%", color: "sale" }], title: "Video paket A1 + A2 + B1", meta: "3 kursa · najveća ušteda", desc: "Kompletna putanja od nule do B1. Tri video kursa po najboljoj ceni.", oldPrice: "34.800 din", salePrice: "29.133 din", salePriceEur: "≈ 249€", saveAmount: "Uštedite 5.667 din", price: "", priceEur: "", href: "/kursevi/paket-a1-a2-b1", cta: "Kupi paket", level: "paket" },
      { badges: [{ label: "Masterclass", color: "master" }, { label: "B1", color: "b1" }], title: "Video + B1 ispit – kompletna priprema", meta: "Svi delovi ispita", desc: "Kompletna priprema za B1 ispit — pisanje, čitanje, slušanje i govor u jednom video kursu.", price: "3.600 din", priceEur: "≈ 31€", href: "https://kurs.hartweger.rs/kurs/polozi-goethe-b1", cta: "Kupi", level: "masterclass" },
      { badges: [{ label: "Masterclass", color: "master" }, { label: "Goethe B2", color: "b2" }], title: "VIDEO: Položi Goethe B2", meta: "Sa Natašom i Ankom", desc: "Ciljana priprema za Goethe B2 ispit. Strategije, tipovi zadataka i vežbanje svih delova testa.", price: "2.880 din", priceEur: "≈ 25€", href: "https://kurs.hartweger.rs/kurs/polozi-goethe-b2", cta: "Kupi", level: "masterclass" },
      { badges: [{ label: "Masterclass", color: "master" }, { label: "Goethe C1", color: "c1" }], title: "VIDEO: Položi Goethe C1", meta: "Napredni nivo", desc: "Priprema za Goethe C1. Kompleksni tekstovi, esej pisanje, govor i slušanje na naprednom nivou.", price: "3.500 din", priceEur: "≈ 30€", href: "https://kurs.hartweger.rs/kurs/polozi-goethe-c1", cta: "Kupi", level: "masterclass" },
      { badges: [{ label: "Gramatika", color: "gram" }, { label: "A2–B1", color: "b1" }], title: "VIDEO + E-book Gramatika A2–B1", meta: "Tvoj tempo · Uključen e-book", desc: "90 minuta predavanja prof. Nataše Hartweger + e-book sa svim objašnjenjima i vežbama na platformi. Kompletna gramatika od A2 do B1.", price: "4.680 din", priceEur: "≈ 40€", href: "/kursevi/gramatika-a2-b1", cta: "Kupi", level: "gramatika" },
      { badges: [{ label: "Specijalni", color: "spec" }, { label: "U pripremi", color: "novo" }], title: "Kurs za mame i trudnice", meta: "Prilagođen mamama", desc: "Kurs nemačkog posebno dizajniran za mame i trudnice koje se pripremaju za život u Nemačkoj ili Austriji.", price: "6.435 din", priceEur: "≈ 55€", href: "/kursevi/kurs-za-mame-i-trudnice", cta: "Saznaj više", level: "specijalni", accent: true },
      { badges: [{ label: "Specijalni", color: "spec" }, { label: "FIDE", color: "fide" }], title: "VIDEO: Položi FIDE", meta: "Boravišna dozvola — Švajcarska", desc: "Priprema za FIDE jezički ispit koji se traži za dobijanje boravišne dozvole u Švajcarskoj.", price: "9.360 din", priceEur: "≈ 80€", href: "/kursevi/polozi-fide", cta: "Kupi", level: "specijalni", accent: true },
      { badges: [{ label: "Specijalni", color: "spec" }, { label: "FSP · Lekari", color: "fide" }], title: "VIDEO: FSP – pripremni kurs za lekare", meta: "Medicinski nemački", desc: "Specijalizovana priprema za FSP — stručni ispit neophodan lekarima koji žele da rade u Nemačkoj.", price: "5.960 din", priceEur: "≈ 51€", href: "/kursevi/fsp", cta: "Kupi", level: "specijalni", accent: true },
    ],
  },
  {
    id: "individualni",
    label: "Individualni",
    icon: PersonIcon,
    info: {
      items: [
        "Nastava 1-na-1 sa profesorkom",
        "Termin i tempo potpuno prilagođeni tebi",
        "Zakazivanje odmah nakon uplate",
        "Video lekcije + sertifikat (po nivou)",
      ],
      color: "#1a5fa8",
    },
    levels: [
      { id: "a1", label: "A1" },
      { id: "a2", label: "A2" },
      { id: "b1", label: "B1" },
      { id: "b2", label: "B2" },
      { id: "paket", label: "Paketi" },
      { id: "spec", label: "Specijalni" },
    ],
    defaultLevel: "a1",
    cards: [
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "A1.1", color: "a1" }], title: "Individualni kurs A1.1", meta: "Termin po dogovoru", desc: "Potpuno prilagođen tebi. Tvoj tempo, tvoji ciljevi — idealno za zaposlene bez fiksnog rasporeda.", price: "od 23.000 din", priceEur: "≈ od 197€", href: "/kursevi/individualni-kurs-nemackog-jezika-a11", cta: "Zakaži", level: "a1" },
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "A1.2", color: "a1" }], title: "Individualni kurs A1.2", meta: "Termin po dogovoru", desc: "Nastavak A1.1 u individualnom formatu. Gramatika i konverzacija prilagođeni tvom napretku.", price: "od 23.000 din", priceEur: "≈ od 197€", href: "/kursevi/individualni-kurs-nemackog-jezika-a1-2", cta: "Zakaži", level: "a1" },
      { badges: [{ label: "Paket", color: "paket" }, { label: "A1 komplet", color: "a1" }], title: "Paket A1 individualni (A1.1 + A1.2)", meta: "Oba A1 nivoa", desc: "A1.1 i A1.2 individualno u paketu. Kompletno savladajte A1 nivo uz personalnu pažnju predavača.", price: "46.000 din", priceEur: "≈ 393€", href: "/kursevi/paket-nivo-a1-a1-1-a1-2-individualni-standard", cta: "Zakaži", level: "a1" },
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "A2.1", color: "a2" }], title: "Individualni kurs A2.1", meta: "Termin po dogovoru", desc: "Elementarni nivo jedan na jedan. Brži napredak jer je sve fokusirano samo na vas.", price: "od 33.000 din", priceEur: "≈ od 282€", href: "/kursevi/individualni-kurs-nemackog-jezika-a2", cta: "Zakaži", level: "a2" },
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "A2.2", color: "a2" }], title: "Individualni kurs A2.2", meta: "Termin po dogovoru", desc: "Nastavak A2.1. Konverzacija, gramatika i vežbanja po tvojim potrebama.", price: "od 33.000 din", priceEur: "≈ od 282€", href: "/kursevi/individualni-kurs-nemackog-jezika-a2-2", cta: "Zakaži", level: "a2" },
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "B1.1", color: "b1" }], title: "Individualni kurs B1.1", meta: "Termin po dogovoru", desc: "Srednji nivo, potpuno prilagođen. Fokus na govoru i razumevanju autentičnih materijala.", price: "od 35.000 din", priceEur: "≈ od 299€", href: "/kursevi/individualni-kurs-nemackog-jezika-b11", cta: "Zakaži", level: "b1" },
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "B1.2", color: "b1" }], title: "Individualni kurs B1.2", meta: "Termin po dogovoru", desc: "Nastavak B1.1. Kompleksnija gramatika i priprema za B1 ispit u individualnom formatu.", price: "od 35.000 din", priceEur: "≈ od 299€", href: "/kursevi/individualni-kurs-nemackog-jezika-b1-2", cta: "Zakaži", level: "b1" },
      { badges: [{ label: "1 na 1", color: "ind" }, { label: "B2.1", color: "b2" }], title: "Individualni kurs B2.1", meta: "Termin po dogovoru", desc: "Više-srednji nivo jedan na jedan. Tečna komunikacija, kompleksne strukture i apstraktne teme.", price: "od 37.000 din", priceEur: "≈ od 316€", href: "/kursevi/individualni-kurs-nemackog-jezika-b2-1", cta: "Zakaži", level: "b2" },
      { badges: [{ label: "Mesečni paket", color: "paket" }], title: "Individualni mesečni paketi", meta: "Fleksibilno · Nema sertifikata", desc: "Za poseban zahtev mimo nivoa. Plaćate mesečno i prilagođavate tempo i sadržaj prema potrebama.", price: "od 14.000 din", priceEur: "≈ od 120€", href: "/kursevi/individualni-mesecni-paketi", cta: "Zakaži", level: "paket" },
      { badges: [{ label: "Specijalni", color: "spec" }, { label: "FIDE · 1 na 1", color: "fide" }], title: "Individualni: Položi FIDE", meta: "Boravišna dozvola — Švajcarska", desc: "Individualna priprema za FIDE ispit. Personalizovan program za dobijanje švajcarske boravišne dozvole.", price: "od 23.000 din", priceEur: "≈ od 197€", href: "/kursevi/individualni-polozi-fide", cta: "Zakaži", level: "spec" },
      { badges: [{ label: "Specijalni", color: "spec" }, { label: "FSP · Lekari", color: "fide" }], title: "FSP individualni – za lekare", meta: "Medicinski nemački · 1 na 1", desc: "Individualna priprema za FSP stručni ispit za lekare koji žele da rade u Nemačkoj.", price: "od 23.000 din", priceEur: "≈ od 197€", href: "/kursevi/fsp-individualni", cta: "Zakaži", level: "spec" },
    ],
  },
  {
    id: "besplatno",
    label: "Besplatno",
    icon: GiftIcon,
    info: {
      items: [
        "Bez registracije i bez obaveza",
        "Idealno za početak i upoznavanje sa metodom",
      ],
      color: "#0a7a4a",
    },
    levels: [],
    defaultLevel: "sve",
    cards: [
      { badges: [{ label: "Besplatno", color: "free" }], title: "Besplatno testiranje nivoa", meta: "Rezultat odmah", desc: "Ne znate koji nivo da upišete? Uradite kratak test i saznajte odmah gde stojite.", price: "Besplatno", priceEur: "", href: "/besplatno-testiranje", cta: "Uradi test", level: "sve", freeCta: true },
      { badges: [{ label: "Besplatno", color: "free" }, { label: "Masterclass", color: "video" }], title: "Kako da naučiš reči na stranom jeziku", meta: "90 minuta", desc: "Besplatan masterclass Nataše Hartweger sa smernicama kako se lakše i efikasnije uče reči na stranom jeziku.", price: "Besplatno", priceEur: "", href: "https://www.hartweger.rs/proizvod/kako-da-naucis-reci-na-stranom-jeziku/", cta: "Preuzmi", level: "sve", freeCta: true },
      { badges: [{ label: "Besplatno", color: "free" }, { label: "AI", color: "ai" }], title: "NaKI – AI asistent za nemački", meta: "Vežbajte uvek i svuda", desc: "Hartwegerov AI asistent za učenje nemačkog. Vežbajte gramatiku i dobijajte objašnjenja na srpskom.", price: "Besplatno", priceEur: "", href: "https://www.hartweger.rs/naki-ai-asistent-nemacki/", cta: "Isprobaj", level: "sve", freeCta: true },
    ],
  },
];

/* ─── Tab accent colors ─── */
const tabAccent: Record<TabId, { active: string; border: string; bg: string }> = {
  grupni: { active: "text-[#0AB3D7]", border: "border-[#0AB3D7]", bg: "bg-[#0AB3D7]/[.08]" },
  video: { active: "text-[#cc3333]", border: "border-[#cc3333]", bg: "bg-[#cc3333]/[.07]" },
  individualni: { active: "text-[#1a5fa8]", border: "border-[#1a5fa8]", bg: "bg-[#1a5fa8]/[.07]" },
  besplatno: { active: "text-[#0a7a4a]", border: "border-[#0a7a4a]", bg: "bg-[#0a7a4a]/[.07]" },
};

/* ─── Component ─── */
export default function KurseviKatalog() {
  const [activeTab, setActiveTab] = useState<TabId>("grupni");
  const [activeLevel, setActiveLevel] = useState<Record<TabId, string>>({
    grupni: "a1",
    video: "a1",
    individualni: "a1",
    besplatno: "sve",
  });

  // Deep-link support
  useEffect(() => {
    function fromHash() {
      const h = (window.location.hash || "").replace("#", "").toLowerCase();
      if (!h) return;
      const parts = h.split("-");
      const tabId = parts[0] as TabId;
      const lvId = parts.slice(1).join("-") || null;

      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      setActiveTab(tabId);
      if (lvId) {
        const lv = tab.levels.find((l) => l.id === lvId);
        if (lv) {
          setActiveLevel((prev) => ({ ...prev, [tabId]: lvId }));
        }
      }

      document.getElementById("kursevi-katalog")?.scrollIntoView({ behavior: "smooth" });
    }

    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const currentTab = tabs.find((t) => t.id === activeTab)!;
  const currentLevel = activeLevel[activeTab];
  const hasLevels = currentTab.levels.length > 0;
  const filteredCards = hasLevels
    ? currentTab.cards.filter((c) => c.level === currentLevel)
    : currentTab.cards;

  return (
    <div id="kursevi-katalog">
      {/* Tab bar */}
      <div className="relative mb-6">
        <div className="flex border-b-2 border-gray-200 overflow-x-auto scrollbar-hide gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const accent = tabAccent[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[15px] font-semibold whitespace-nowrap border-b-[3px] -mb-[2px] rounded-t-lg transition-all min-h-[50px] ${
                  isActive
                    ? `${accent.active} ${accent.border} ${accent.bg}`
                    : "text-gray-400 border-transparent hover:text-[#0AB3D7] hover:bg-[#0AB3D7]/[.06]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info block */}
      <div
        className="rounded-xl p-4 mb-7 flex flex-wrap gap-x-6 gap-y-1.5"
        style={{ backgroundColor: `${currentTab.info.color}08`, borderLeft: `3px solid ${currentTab.info.color}` }}
      >
        {currentTab.info.items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: currentTab.info.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {item}
          </span>
        ))}
      </div>

      {/* Level filter */}
      {hasLevels && (
        <div className="flex gap-2 flex-wrap mb-7">
          {currentTab.levels.map((lv) => (
            <button
              key={lv.id}
              onClick={() => setActiveLevel((prev) => ({ ...prev, [activeTab]: lv.id }))}
              className={`px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all min-h-[44px] ${
                currentLevel === lv.id
                  ? "bg-[#0AB3D7] text-white border-[#0AB3D7]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#0AB3D7] hover:text-[#0AB3D7]"
              }`}
            >
              {lv.label}
            </button>
          ))}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {filteredCards.map((card, i) => (
          <div
            key={i}
            className={`border rounded-2xl p-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 ${
              card.accent
                ? "border-[#F78687] bg-gradient-to-br from-red-50/50 to-white hover:shadow-lg hover:shadow-[#F78687]/10"
                : "border-gray-200 bg-white hover:border-[#0AB3D7] hover:shadow-lg hover:shadow-[#0AB3D7]/10"
            }`}
          >
            {/* Badges */}
            <div className="flex gap-1.5 flex-wrap">
              {card.badges.map((b, j) => (
                <span
                  key={j}
                  className={`text-xs font-bold px-3 py-1 rounded-full tracking-wide ${badgeColors[b.color] || "bg-gray-100 text-gray-600"}`}
                >
                  {b.label}
                </span>
              ))}
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-gray-900 leading-snug">{card.title}</h3>

            {/* Meta */}
            <p className="text-[13px] text-gray-400">{card.meta}</p>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed flex-1">{card.desc}</p>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3.5 border-t border-gray-100 mt-auto gap-3">
              {card.salePrice ? (
                <div>
                  <p className="text-[13px] text-gray-300 line-through">{card.oldPrice}</p>
                  <p className="text-lg font-bold text-[#0AB3D7]">{card.salePrice}</p>
                  <p className="text-xs font-bold text-[#F78687]">{card.salePriceEur}</p>
                  <span className="inline-block mt-1 text-[11px] font-bold bg-[#F78687] text-white px-2.5 py-0.5 rounded-lg">
                    {card.saveAmount}
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-[17px] font-bold text-gray-900">{card.price}</p>
                  {card.priceEur && <p className="text-xs font-bold text-[#F78687] mt-0.5">{card.priceEur}</p>}
                </div>
              )}
              <Link
                href={card.href}
                className={`flex-shrink-0 px-5 py-3 rounded-[10px] text-sm font-bold transition-all hover:-translate-y-px min-h-[46px] flex items-center ${
                  card.freeCta
                    ? "bg-[#0AB3D7] text-white hover:bg-[#089ab9]"
                    : "bg-[#F78687] text-white hover:bg-[#e06060]"
                }`}
              >
                {card.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Test bar */}
      {activeTab !== "besplatno" && (
        <div className="mt-8 p-5 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[15px] text-gray-500">
            <strong className="text-[#0AB3D7]">Ne znate koji nivo?</strong> Uradite besplatno testiranje i saznajte za 10 minuta.
          </p>
          <Link
            href="/besplatno-testiranje"
            className="px-6 py-3 rounded-[10px] border-2 border-[#0AB3D7] text-[#0AB3D7] text-sm font-bold hover:bg-[#0AB3D7] hover:text-white transition-all whitespace-nowrap min-h-[46px] flex items-center"
          >
            Besplatno testiranje →
          </Link>
        </div>
      )}
    </div>
  );
}

import { SITE_URL } from "@/lib/site-url";

// Jedna mapa slug → nivo (CEFR), izvor istine za grupne/individualne kurseve.
export const SLUG_TO_NIVO: Record<string, string> = {
  "grupni-kurs-nemackog-jezika-a1-1": "A1.1",
  "grupni-kurs-nemackog-jezika-a1-2-2": "A1.2",
  "grupni-kurs-nemackog-jezika-a2": "A2.1",
  "grupni-kurs-nemackog-jezika-a2-2": "A2.2",
  "grupni-kurs-nemackog-jezika-b1-1-2": "B1.1",
  "grupni-kurs-nemackog-b1-2": "B1.2",
  "grupni-kurs-b2-1": "B2.1",
  "grupni-kurs-b2-2": "B2.2",
  "individualni-kurs-nemackog-jezika-a11": "A1.1",
  "individualni-kurs-nemackog-jezika-a1-2": "A1.2",
  "individualni-kurs-nemackog-jezika-a2": "A2.1",
  "individualni-kurs-nemackog-jezika-a2-2": "A2.2",
  "individualni-kurs-nemackog-jezika-b11": "B1.1",
  "individualni-kurs-nemackog-jezika-b1-2": "B1.2",
  "individualni-kurs-nemackog-jezika-b2-1": "B2.1",
  "grupni-kurs-c1-1": "C1.1",
  "grupni-kurs-c1-2": "C1.2",
};

export function nivoForSlug(slug: string): string | null {
  return SLUG_TO_NIVO[slug] ?? null;
}

// Sledeći nivo u nizu (za ponudu/podsetnik). C1.2 nema sledeći.
export const NEXT_NIVO: Record<string, string> = {
  "A1.1": "A1.2", "A1.2": "A2.1", "A2.1": "A2.2", "A2.2": "B1.1",
  "B1.1": "B1.2", "B1.2": "B2.1", "B2.1": "B2.2", "B2.2": "C1.1", "C1.1": "C1.2",
};

export function nextNivoFor(nivo: string): string | null {
  return NEXT_NIVO[nivo] ?? null;
}

// Grupni slug za nivo (obrnuto od SLUG_TO_NIVO, samo "grupni-" slugovi).
export function grupniSlugForNivo(nivo: string): string | null {
  for (const [slug, n] of Object.entries(SLUG_TO_NIVO)) {
    if (n === nivo && slug.startsWith("grupni-")) return slug;
  }
  return null;
}

// Individualni slug za nivo (samo "individualni-" slugovi). Za „još 1 čas" preporuku sledećeg nivoa.
export function individualniSlugForNivo(nivo: string): string | null {
  for (const [slug, n] of Object.entries(SLUG_TO_NIVO)) {
    if (n === nivo && slug.startsWith("individualni-")) return slug;
  }
  return null;
}

// Video kursevi postoje za A1-B2 (jedan kurs pokriva ceo nivo, npr. A2.1 i A2.2); za C1 nema videa.
const VIDEO_SLUG: Record<string, string> = {
  A1: "video-kurs-a1",
  A2: "video-kurs-a2",
  B1: "video-kurs-b1",
  B2: "video-kurs-b2",
};

// Linkovi ka kursevima za dati nivo - koristi ih testiranje-funnel (#1 rezultat i #2-#4 podsetnici).
export function funnelUrlsForNivo(rawNivo: string) {
  const nivo = rawNivo === "C1+" ? "C1.1" : rawNivo;
  const grupniSlug = grupniSlugForNivo(nivo);
  const indSlug = individualniSlugForNivo(nivo);
  const videoSlug = VIDEO_SLUG[nivo.split(".")[0]];
  return {
    grupniUrl: grupniSlug ? `${SITE_URL}/kursevi/${grupniSlug}` : null,
    individualniUrl: indSlug ? `${SITE_URL}/kursevi/${indSlug}` : null,
    videoUrl: videoSlug ? `${SITE_URL}/kursevi/${videoSlug}` : null,
    kurseviUrl: `${SITE_URL}/kursevi`,
  };
}

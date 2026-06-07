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

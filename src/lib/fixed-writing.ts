/**
 * Fiksni zadaci za AI-vežbu PISANJA (B1.2) — student spaja elemente u jednu rečenicu
 * koristeći zadatu gramatiku; AI proverava prema rešenju.
 *
 * Pravilo (analogno [[fixed-translations]]): zadaci i rešenja su FIKSNI (ne AI-generisani).
 * /api/ai-translate (mode "writing") vraća ove zadatke kad postoje za naslov lekcije.
 *
 * Ključ = TAČAN naslov lekcije (lessons.title). Dugme „AI vežba pisanja" se prikazuje
 * samo ako naslov postoji u ovoj mapi.
 *
 * Izvor: Schritte 6, radna sveska.
 */
export interface WritingTask {
  /** Elementi/postavka koju student spaja u rečenicu. */
  prompt: string;
  /** Tačno rešenje (model-rečenica). */
  solution: string;
}

export const FIXED_WRITING: Record<string, WritingTask[]> = {
  "Temporalsätze: während · bevor · nachdem": [
    // Toms Morgen (#7)
    { prompt: "sein Wecker hatte geklingelt / Tom ist aufgestanden und ins Bad gegangen", solution: "Nachdem sein Wecker geklingelt hatte, ist Tom aufgestanden und ins Bad gegangen." },
    { prompt: "Tom hatte geduscht / er hat sich angezogen und Frühstück gemacht", solution: "Nachdem Tom geduscht hatte, hat er sich angezogen und Frühstück gemacht." },
    { prompt: "Tom saß am Tisch und frühstückte / er hat die Zeitung gelesen", solution: "Während Tom am Tisch saß und frühstückte, hat er die Zeitung gelesen." },
    { prompt: "Tom ist aus dem Haus gegangen / er hat seine Freundin geweckt", solution: "Bevor Tom aus dem Haus gegangen ist, hat er seine Freundin geweckt." },
    { prompt: "Tom ist U-Bahn gefahren / er hat Musik gehört", solution: "Während Tom U-Bahn gefahren ist, hat er Musik gehört." },
    // Mein Tag (#8)
    { prompt: "in den Bus steigen, zuerst: Fahrkarte kaufen", solution: "Bevor ich in den Bus gestiegen bin, habe ich eine Fahrkarte gekauft." },
    { prompt: "zur gleichen Zeit: unterwegs sein und Musik hören", solution: "Während ich unterwegs war, habe ich Musik gehört." },
    { prompt: "nach Hause gehen, zuerst: einkaufen", solution: "Bevor ich nach Hause gegangen bin, habe ich eingekauft." },
    { prompt: "zu Hause ankommen, dann: kochen", solution: "Nachdem ich zu Hause angekommen war, habe ich gekocht." },
  ],
  "indem und ohne dass - Vereine": [
    { prompt: "In unserer Nachbarschaft schonen wir die Umwelt, ... (uns - wir - teilen - ein Auto). Man nennt das Car-Sharing.", solution: "indem wir uns ein Auto teilen" },
    { prompt: "Katja unterstützt ihre Großmutter, ... (sie - einkauft - für sie - und - übernimmt - schwere Hausarbeiten).", solution: "indem sie für sie einkauft und schwere Hausarbeiten übernimmt" },
    { prompt: "Die Supermärkte in unserer Stadt helfen den Armen, ... (Lebensmittel - spenden - sie).", solution: "indem sie Lebensmittel spenden" },
    { prompt: "Senioren können ihr Wissen weitergeben, ... (sie - Schülern - Nachhilfe geben - kostenlos).", solution: "indem sie Schülern kostenlos Nachhilfe geben" },
    { prompt: "Die Schulklasse sammelt Geld für arme Kinder, ... (sie - verkauft - selbst gebackenen Kuchen).", solution: "indem sie selbst gebackenen Kuchen verkauft" },
  ],
};

/** Uputstvo koje se prikazuje studentu (po naslovu lekcije). Fallback je generičko. */
export const WRITING_INSTRUCTIONS: Record<string, string> = {
  "Temporalsätze: während · bevor · nachdem": "Spoji elemente u JEDNU rečenicu sa bevor, nachdem ili während (pazi na slaganje vremena).",
  "indem und ohne dass - Vereine": "Napiši indem rečenicu od materijala u zagradi (glagol ide na kraj).",
};

/** Vraća fiksne zadatke pisanja za naslov lekcije, ili null ako ih nema. */
export function getFixedWriting(lessonTitle: string): WritingTask[] | null {
  return FIXED_WRITING[lessonTitle] ?? null;
}

export function getWritingInstruction(lessonTitle: string): string {
  return WRITING_INSTRUCTIONS[lessonTitle] ?? "Napiši tačnu rečenicu na nemačkom prema zadatim elementima.";
}

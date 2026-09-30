/**
 * Beleška sa časa = obrazac sa fiksnim sekcijama, ne slobodan dokument.
 * Šest tekstualnih sekcija su markdown-lite stringovi, WORTSCHATZ je niz parova -
 * te iste reči su kartice polaznika.
 *
 * PRAVILO: prazna sekcija se NE prikazuje - ni sadržaj ni naslov.
 */

export type TextSectionKey =
  | "tema" | "redemittel" | "fehler" | "grammatik" | "hausaufgabe" | "lob";

export interface WortschatzRow {
  de: string;
  sr: string;
}

export interface NoteContent {
  v: 1;
  tema?: string;
  wortschatz: WortschatzRow[];
  redemittel?: string;
  fehler?: string;
  grammatik?: string;
  hausaufgabe?: string;
  lob?: string;
}

/** Oznaka = nemačka reč kao u starom Google Doc šablonu; podnaslov = objašnjenje na našem. */
export const TEXT_SECTIONS: ReadonlyArray<{
  key: TextSectionKey;
  label: string;
  hint: string;
}> = [
  { key: "tema",        label: "TEMA",        hint: "tema časa" },
  { key: "redemittel",  label: "REDEMITTEL",  hint: "korisne fraze i izrazi" },
  { key: "fehler",      label: "FEHLER",      hint: "greške i ispravke — bez imena" },
  { key: "grammatik",   label: "GRAMMATIK",   hint: "gramatika" },
  { key: "hausaufgabe", label: "HAUSAUFGABE", hint: "domaći zadatak" },
  { key: "lob",         label: "LOB",         hint: "pohvala" },
];

/** WORTSCHATZ stoji između TEMA i REDEMITTEL u prikazu; nije u TEXT_SECTIONS jer nije tekst. */
export const WORTSCHATZ_AFTER: TextSectionKey = "tema";

export function emptyNoteContent(): NoteContent {
  return { v: 1, wortschatz: [] };
}

export function isSectionEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function visibleSections(
  content: NoteContent,
): Array<{ key: TextSectionKey; label: string; hint: string; value: string }> {
  return TEXT_SECTIONS.filter((s) => !isSectionEmpty(content[s.key])).map((s) => ({
    ...s,
    value: (content[s.key] as string).trim(),
  }));
}

/** Plain-text ogledalo za content_text (PDF fallback i kasnija pretraga). */
export function noteToPlainText(content: NoteContent): string {
  const parts: string[] = [];
  for (const s of TEXT_SECTIONS) {
    if (isSectionEmpty(content[s.key])) continue;
    parts.push(`${s.label}\n${(content[s.key] as string).trim()}`);
    if (s.key === WORTSCHATZ_AFTER && content.wortschatz.length > 0) {
      parts.push(
        "WORTSCHATZ\n" + content.wortschatz.map((r) => `${r.de} — ${r.sr}`).join("\n"),
      );
    }
  }
  // Ako TEMA nije popunjena a reči jesu, WORTSCHATZ ipak mora da uđe.
  if (isSectionEmpty(content.tema) && content.wortschatz.length > 0) {
    parts.unshift(
      "WORTSCHATZ\n" + content.wortschatz.map((r) => `${r.de} — ${r.sr}`).join("\n"),
    );
  }
  return parts.join("\n\n");
}

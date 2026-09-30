/**
 * Beleška sa časa = obrazac sa fiksnim sekcijama, ne slobodan dokument.
 * Šest tekstualnih sekcija su markdown-lite stringovi, WORTSCHATZ je niz parova -
 * te iste reči su kartice polaznika.
 *
 * PRAVILO: prazna sekcija se NE prikazuje - ni sadržaj ni naslov.
 */

import { tokenizeInline } from "./beleska-markup";

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

/** Definicija jedne tekstualne sekcije - oznaka, ključ u NoteContent i kratak opis za profesorku. */
export interface TextSectionDef {
  key: TextSectionKey;
  label: string;
  hint: string;
}

/** Sekcija spremna za prikaz - definicija plus već popunjena (trimovana) vrednost. */
export interface VisibleSection extends TextSectionDef {
  value: string;
}

/** Oznaka = nemačka reč kao u starom Google Doc šablonu; podnaslov = objašnjenje na našem. */
export const TEXT_SECTIONS: ReadonlyArray<TextSectionDef> = [
  { key: "tema",        label: "TEMA",        hint: "tema časa" },
  { key: "redemittel",  label: "REDEMITTEL",  hint: "korisne fraze i izrazi" },
  { key: "fehler",      label: "FEHLER",      hint: "greške i ispravke, bez imena" },
  { key: "grammatik",   label: "GRAMMATIK",   hint: "gramatika" },
  { key: "hausaufgabe", label: "HAUSAUFGABE", hint: "domaći zadatak" },
  { key: "lob",         label: "LOB",         hint: "pohvala" },
];

/** WORTSCHATZ stoji između TEMA i REDEMITTEL u prikazu; nije u TEXT_SECTIONS jer nije tekst. */
export const WORTSCHATZ_AFTER: TextSectionKey = "tema";

export function emptyNoteContent(): NoteContent {
  return { v: 1, wortschatz: [] };
}

/**
 * Prazna je i vrednost od samih razmaka, i undefined, i null - null nije redak slučaj
 * jer sadržaj sekcije često dolazi direktno iz Supabase jsonb polja.
 */
export function isSectionEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function visibleSections(content: NoteContent): VisibleSection[] {
  return TEXT_SECTIONS.filter((s) => !isSectionEmpty(content[s.key])).map((s) => ({
    ...s,
    value: (content[s.key] as string).trim(),
  }));
}

/**
 * Sadržaj beleške može doći iz baze (stariji/oštećen zapis) ili sa fronta (profesorkin unos) -
 * u oba slučaja ga svodimo na očekivani oblik PRE nego što uđe u noteToPlainText/deriveWordsetItems,
 * koje ne proveravaju tipove (npr. content.wortschatz.length bi pukao da wortschatz nije niz).
 * Bez ovoga bi neispravan content (null, string umesto niza...) oborio rutu u 500 bez poruke.
 *
 * Deljeno između profesorkinog API-ja (upis) i polaznikovog čitanja (src/lib/beleske-student.ts) -
 * namerno JEDNA definicija, da se dve strane iste beleške ne raziđu u tumačenju zapisa.
 */
export function sanitizeNoteContent(raw: unknown): NoteContent {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = emptyNoteContent();
  for (const s of TEXT_SECTIONS) {
    const v = src[s.key];
    if (typeof v === "string" && v.trim().length > 0) out[s.key] = v;
  }
  const rows = Array.isArray(src.wortschatz) ? src.wortschatz : [];
  out.wortschatz = rows
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r): WortschatzRow => ({ de: String(r.de ?? ""), sr: String(r.sr ?? "") }));
  return out;
}

/** Jedan red WORTSCHATZ tabele kao tekst: „nemačka reč = naš prevod". */
function formatWortschatz(rows: WortschatzRow[]): string {
  return rows.map((r) => `${r.de} = ${r.sr}`).join("\n");
}

/** Plain-text ogledalo za content_text (PDF fallback i kasnija pretraga). */
export function noteToPlainText(content: NoteContent): string {
  const parts: string[] = [];
  for (const s of TEXT_SECTIONS) {
    if (isSectionEmpty(content[s.key])) continue;
    parts.push(`${s.label}\n${(content[s.key] as string).trim()}`);
    if (s.key === WORTSCHATZ_AFTER && content.wortschatz.length > 0) {
      parts.push("WORTSCHATZ\n" + formatWortschatz(content.wortschatz));
    }
  }
  // Ako sekcija posle koje ide WORTSCHATZ nije popunjena, reči ipak moraju da uđu.
  if (isSectionEmpty(content[WORTSCHATZ_AFTER]) && content.wortschatz.length > 0) {
    parts.unshift("WORTSCHATZ\n" + formatWortschatz(content.wortschatz));
  }
  return parts.join("\n\n");
}

const PREVIEW_MAX = 140;

/**
 * Kratak opis za listu beleški: prvi neprazan red TEME, bez markdown-lite oznaka
 * (**bold**, *kurziv*, ==marker==, [link](url)) - u listi stoji čist tekst, ne markup.
 * Vraća null kad TEMA nije popunjena (npr. profesorka je snimila belešku bez ijednog
 * polja) - prikaz onda pokazuje svoju rezervnu formulaciju, ne prazan red.
 */
export function notePreview(content: NoteContent): string | null {
  if (isSectionEmpty(content.tema)) return null;
  const firstLine = content.tema!.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return null;
  const plain = tokenizeInline(firstLine.trim())
    .map((t) => t.text)
    .join("")
    .trim();
  if (!plain) return null;
  return plain.length > PREVIEW_MAX ? `${plain.slice(0, PREVIEW_MAX - 1).trimEnd()}…` : plain;
}

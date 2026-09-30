/**
 * Markdown-lite koji profesorka kuca u belešku:
 *   **podebljano**  *kurziv*  ==marker==  - lista  [tekst](url)
 *
 * Parser vraća tokene; React prikaz (BeleskaRenderer, sledeći zadatak) ih mapira u čvorove.
 * Nikad se ne generiše HTML string, pa XSS-a nema po konstrukciji.
 */

export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "mark"; text: string }
  | { kind: "link"; text: string; href: string };

export type Block =
  | { kind: "p"; lines: InlineToken[][] }
  | { kind: "ul"; items: InlineToken[][] };

// Bold je pisan preko *jedan nivo* zagrada u URL-u (npr. Wikipedia "Dativ_(padež)") -
// grupa href zato dozvoljava i jedan balansiran par zagrada unutar linka.
// Bold sadržaj je namerno pohlepan-lenj (.+?) preko celog reda, ne isključuje pojedinačnu
// zvezdicu - ugnježdeni *kurziv* unutar **bold** teksta ostaje kao doslovan tekst unutar
// bold tokena, umesto da se razbije na tri komada sa osiročenim zvezdicama na ekranu.
const INLINE_RE =
  /\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)|\*\*(.+?)\*\*|==([^=\n]+)==|\*([^*\n]+)\*/g;

function safeHref(href: string): string | null {
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  return null; // javascript:, data: i sve ostalo se odbacuje
}

export function tokenizeInline(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      const href = safeHref(m[2]);
      if (href) out.push({ kind: "link", text: m[1], href });
      else out.push({ kind: "text", text: m[1] });
    } else if (m[3] !== undefined) {
      out.push({ kind: "bold", text: m[3] });
    } else if (m[4] !== undefined) {
      out.push({ kind: "mark", text: m[4] });
    } else if (m[5] !== undefined) {
      out.push({ kind: "italic", text: m[5] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

// Jedina oznaka za stavku liste je "- " (crtica pa razmak) - namerno NE i "*" ili "•".
// "*" kao bullet bi se sudarao sa *kurziv* na početku reda (npr. "* naglašeno nešto*" bi
// bio pročitan kao lista pre nego što inline parser dobije priliku da ga vidi kao kurziv).
const BULLET_RE = /^-\s+(.*)$/;

export function parseBlocks(input: string): Block[] {
  if (!input || input.trim().length === 0) return [];
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "p", lines: paragraph.map(tokenizeInline) });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ kind: "ul", items: list.map(tokenizeInline) });
    list = [];
  };

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      flushList();
      flushParagraph();
      continue;
    }
    const bullet = line.match(BULLET_RE);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushList();
  flushParagraph();
  return blocks;
}

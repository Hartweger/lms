/**
 * Markdown-lite koji profesorka kuca u belešku:
 *   **podebljano**  *kurziv*  ==marker==  - lista  [tekst](url)
 *
 * Goli URL (https://..., http://..., www...) takođe postaje link, bez markdown zagrada -
 * beleške su pune zalepljenih linkova (Meet, DW video, YouTube, folder sa materijalima), a
 * u starom Google Doc-u se to samo od sebe pretvaralo u link. Isti pristup kao u
 * src/components/naki/render-rich.tsx (odvajanje repa interpunkcije), da se prikazi ne
 * razilaze - ne uvozi se odatle, samo je ponašanje preuzeto.
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

// Markdown link ima prednost nad golim URL-om - stoji prvi u alternaciji, pa regex skener
// koji ide levo-udesno uhvati ceo "[tekst](url)" počev od "[" pre nego što bi gola URL
// grana uopšte stigla na red da proba da se uklopi na poziciju URL-a unutar zagrada.
//
// Bold je pisan preko *jedan nivo* zagrada u URL-u (npr. Wikipedia "Dativ_(padež)") -
// grupa href zato dozvoljava i jedan balansiran par zagrada unutar linka.
// Bold sadržaj je namerno pohlepan-lenj (.+?) preko celog reda, ne isključuje pojedinačnu
// zvezdicu - ugnježdeni *kurziv* unutar **bold** teksta ostaje kao doslovan tekst unutar
// bold tokena, umesto da se razbije na tri komada sa osiročenim zvezdicama na ekranu.
//
// Goli URL (https://..., http://..., www.) namerno isključuje ")" iz sadržaja - isti trik
// kao u render-rich.tsx: ako URL stoji u rečeničnoj zagradi bez otvorene unutar samog URL-a,
// zatvorena zagrada nikad ne uđe u match, pa ostaje kao običan tekst posle linka.
const INLINE_RE =
  /\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)|\*\*(.+?)\*\*|==([^=\n]+)==|\*([^*\n]+)\*|((?:https?:\/\/|www\.)[^\s)]+)/g;

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
    } else if (m[6] !== undefined) {
      // Rep interpunkcije (. , ; : ! ?) na kraju rečenice nije deo URL-a - ista granica
      // kao u render-rich.tsx, da se dva prikaza ne razilaze.
      let url = m[6];
      let trail = "";
      const tm = url.match(/[.,;:!?]+$/);
      if (tm) {
        trail = tm[0];
        url = url.slice(0, url.length - trail.length);
      }
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      out.push({ kind: "link", text: url, href });
      if (trail) out.push({ kind: "text", text: trail });
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

import { type CSSProperties, type ReactNode } from "react";

// NaKI/Smile šalju markdown (**bold**, *kurziv*, [tekst](url)). Pretvori u React čvorove
// (kao stari WP widget) - inače se vide gole zvezdice. Novi red čuva whitespace-pre-wrap.
// XSS-safe: nikad ne koristi dangerouslySetInnerHTML; sve je React čvor.
//
// Link izgled je parametrizovan da bi se isti renderer koristio i u NakiChat
// (Tailwind klasa "text-plava underline") i u SmileWidget (inline coral stil),
// bez menjanja postojećeg ponašanja nijednog widget-a.
type RenderRichOptions = {
  linkClassName?: string;
  linkStyle?: CSSProperties;
};

export function renderRich(text: string, opts: RenderRichOptions = {}): ReactNode[] {
  const linkClassName = opts.linkClassName ?? "text-plava underline";
  const linkStyle = opts.linkStyle;
  const withBullets = text.replace(/^- /gm, "• ");
  // markdown link | bold | kurziv | goli URL (www. ili https://) | mejl | goli domen (hartweger.rs / youtube - NaKI često izostavi https://)
  const re =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|((?:https?:\/\/|www\.)[^\s)]+)|([^\s@]+@[^\s@]+\.[A-Za-z]{2,})|((?:[a-z0-9-]+\.)*(?:hartweger\.rs|youtube\.com|youtu\.be)(?:\/[^\s)]*)?)/gi;
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withBullets)) !== null) {
    if (m.index > last) nodes.push(withBullets.slice(last, m.index));
    if (m[1]) {
      nodes.push(
        <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" className={linkClassName} style={linkStyle}>
          {m[1]}
        </a>
      );
    } else if (m[3]) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    } else if (m[4]) {
      nodes.push(<em key={key++}>{m[4]}</em>);
    } else if (m[5] || m[7]) {
      // odvoji rep interpunkcije (tačka/zarez na kraju rečenice nije deo URL-a)
      let url = (m[5] || m[7]) as string;
      let trail = "";
      const tm = url.match(/[.,;:!?]+$/);
      if (tm) {
        trail = tm[0];
        url = url.slice(0, url.length - trail.length);
      }
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={linkClassName} style={linkStyle}>
          {url}
        </a>
      );
      if (trail) nodes.push(trail);
    } else if (m[6]) {
      let mail = m[6];
      let trail = "";
      const tm = mail.match(/[.,;:!?]+$/);
      if (tm) {
        trail = tm[0];
        mail = mail.slice(0, mail.length - trail.length);
      }
      nodes.push(
        <a key={key++} href={`mailto:${mail}`} className={linkClassName} style={linkStyle}>
          {mail}
        </a>
      );
      if (trail) nodes.push(trail);
    }
    last = re.lastIndex;
  }
  if (last < withBullets.length) nodes.push(withBullets.slice(last));
  return nodes;
}

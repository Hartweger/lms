import { parse, HTMLElement } from "node-html-parser";
import type { Section } from "./types";

const VIMEO_RE = /(?:player\.vimeo\.com\/video\/|vimeo\.com\/(?:video\/)?)(\d{6,})/;

function pdfUrlFrom(src: string): string | null {
  const m = src.match(/[?&]url=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  return src.endsWith(".pdf") ? src : null;
}

// Google Docs/Slides/Sheets/Forms embed → dugme (link), ne ugrađeni iframe.
function googleEmbedFrom(src: string): { href: string; label: string } | null {
  if (!/docs\.google\.com|drive\.google\.com/.test(src)) return null;
  let href = src.replace(/&amp;/g, "&");
  let label = "Otvori dokument";
  if (src.includes("/presentation/")) { href = href.replace("/embed", "/pub"); label = "Otvori prezentaciju"; }
  else if (src.includes("/document/")) { href = href.replace("/embed", "/pub"); label = "Otvori dokument"; }
  else if (src.includes("/spreadsheets/")) { label = "Otvori tabelu"; }
  else if (src.includes("/forms/")) { label = "Otvori upitnik"; }
  else if (src.includes("drive.google.com")) { label = "Otvori fajl"; }
  return { href, label };
}

function htmlToMarkdown(el: HTMLElement): string {
  let md = el.innerHTML
    // <a href="URL">tekst</a> → [tekst](URL) (TextBlock renderuje markdown link kao klikabilan)
    .replace(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, txt) => `[${txt.replace(/<[^>]+>/g, "").trim()}](${href})`)
    .replace(/<\/(h[1-6])>/gi, "\n\n").replace(/<h2[^>]*>/gi, "## ").replace(/<h3[^>]*>/gi, "### ")
    .replace(/<strong[^>]*>|<b>/gi, "**").replace(/<\/strong>|<\/b>/gi, "**")
    .replace(/<em[^>]*>|<i>/gi, "_").replace(/<\/em>|<\/i>/gi, "_")
    .replace(/<li[^>]*>/gi, "- ").replace(/<\/li>/gi, "\n")
    .replace(/<\/p>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&#8211;/g, "–").replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'").replace(/&quot;/g, '"');
  return md.replace(/\n{3,}/g, "\n\n").trim();
}

export function htmlToSections(html: string): Section[] {
  const root = parse(html || "");
  const sections: Section[] = [];
  let textBuffer: HTMLElement[] = [];

  const flush = () => {
    if (!textBuffer.length) return;
    const wrap = parse("<div></div>").querySelector("div")!;
    textBuffer.forEach((n) => wrap.appendChild(n));
    const md = htmlToMarkdown(wrap);
    if (md) sections.push({ type: "text", content: md });
    textBuffer = [];
  };

  for (const node of root.childNodes) {
    if (!(node instanceof HTMLElement)) {
      if (node.text && node.text.trim()) textBuffer.push(parse(`<p>${node.text}</p>`).querySelector("p")!);
      continue;
    }
    const iframe = node.tagName === "IFRAME" ? node : node.querySelector("iframe");
    const src = iframe?.getAttribute("src") || "";
    const vimeo = (node.innerHTML.match(VIMEO_RE) || [])[1];
    const table = node.tagName === "TABLE" ? node : node.querySelector("table");
    const img = node.tagName === "IMG" ? node : node.querySelector("img");

    const gembed = src ? googleEmbedFrom(src) : null;

    if (vimeo) { flush(); sections.push({ type: "video", vimeoId: vimeo }); }
    else if (gembed) { flush(); sections.push({ type: "link", linkType: "external", href: gembed.href, label: gembed.label }); }
    else if (src && pdfUrlFrom(src)) { flush(); sections.push({ type: "pdf", url: pdfUrlFrom(src)!, label: "PDF" }); }
    else if (table) {
      flush();
      const trs = table.querySelectorAll("tr");
      const headers = trs[0]?.querySelectorAll("th,td").map((c) => c.text.trim()) || [];
      const rows = trs.slice(1).map((tr) => tr.querySelectorAll("td").map((c) => c.text.trim()));
      if (headers.length) sections.push({ type: "table", headers, rows });
    }
    else if (img) { flush(); sections.push({ type: "image", url: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "" }); }
    else textBuffer.push(node);
  }
  flush();
  return sections.filter((s) => s.type !== "text" || (s as any).content.length > 1);
}

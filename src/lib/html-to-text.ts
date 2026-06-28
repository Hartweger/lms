// Plain-text verzija HTML mejla. Spam filteri (Gmail/Yahoo) boduju mejlove sa plain-text
// alternativom bolje od samo-HTML. Bez zavisnosti - dovoljno dobra konverzija za naše šablone.
export function htmlToText(html: string): string {
  return html
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // linkovi -> "tekst (url)" da se URL ne izgubi u plain-textu
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<\/(p|div|h[1-6]|tr|li|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // ostali tagovi
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

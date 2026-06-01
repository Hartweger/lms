import { FilterXSS } from "xss";

/**
 * Sanitize admin/seed-authored HTML before rendering via dangerouslySetInnerHTML.
 *
 * Defense-in-depth: lesson/quiz content is currently admin-only, but this strips
 * <script>, inline event handlers (on*) and javascript: URLs so that if any
 * non-admin or AI-generated content ever reaches the DB it can't inject scripts.
 *
 * Implemented with `xss` (pure JS) rather than DOMPurify on purpose: this module
 * is imported by BOTH Server Components (LekcijaContent, TextBlock, TableBlock)
 * and Client Components (the exercise renderers). DOMPurify needs a real DOM, so
 * `isomorphic-dompurify` pulls in `jsdom` on the server — and jsdom's transitive
 * `@exodus/bytes` is ESM-only, which crashes the Vercel serverless runtime with
 * ERR_REQUIRE_ESM, 500-ing every lesson page. `xss` has no DOM dependency and
 * runs identically in Node and the browser.
 *
 * The allowlist preserves every tag/attribute the content actually uses:
 * formatContent() output (p, br, strong, em, a, h2, h3) plus admin-authored
 * markup (mark, span, div, ul/ol/li, tables) and media embeds (iframe, audio,
 * video, source). `xss` drops disallowed tags, on* handlers and javascript: URLs.
 */
const filter = new FilterXSS({
  whiteList: {
    p: ["class"],
    br: [],
    strong: ["class"],
    em: ["class"],
    mark: ["class", "style"],
    span: ["class", "style"],
    div: ["class", "style"],
    h2: ["class"],
    h3: ["class"],
    ul: ["class"],
    ol: ["class"],
    li: ["class"],
    a: ["href", "target", "rel", "class"],
    iframe: [
      "src",
      "allow",
      "allowfullscreen",
      "frameborder",
      "width",
      "height",
      "title",
      "loading",
      "class",
    ],
    audio: ["controls", "src", "class"],
    video: ["controls", "src", "width", "height", "class"],
    source: ["src", "type"],
    table: ["class"],
    thead: ["class"],
    tbody: ["class"],
    tr: ["class"],
    td: ["class", "colspan", "rowspan"],
    th: ["class", "colspan", "rowspan"],
  },
  // Drop the tags + bodies of anything script-like instead of escaping them.
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return filter.process(dirty);
}

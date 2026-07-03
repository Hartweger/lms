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
 * `isomorphic-dompurify` pulls in `jsdom` on the server - and jsdom's transitive
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
    img: ["src", "alt", "class", "width", "height"],
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

/**
 * Blog varijanta: isti XSS filter, ali sa proširenim allowlistom za markup
 * koji dolazi iz WP-a (h4 FAQ sekcije, figure/figcaption, blockquote, hr...).
 * Lekcijski filter ostaje uži - ne proširivati njega.
 */
const blogFilter = new FilterXSS({
  whiteList: {
    p: ["class"],
    br: [],
    hr: ["class"],
    strong: ["class"],
    b: ["class"],
    em: ["class"],
    i: ["class"],
    u: ["class"],
    sup: [],
    sub: [],
    mark: ["class", "style"],
    span: ["class", "style"],
    bdi: [],
    div: ["class", "style"],
    h2: ["class", "id"],
    h3: ["class", "id"],
    h4: ["class", "id"],
    h5: ["class", "id"],
    h6: ["class", "id"],
    blockquote: ["class"],
    pre: ["class"],
    code: ["class"],
    figure: ["class", "style"],
    figcaption: ["class"],
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
    img: ["src", "alt", "class", "width", "height", "loading", "srcset", "sizes"],
    table: ["class"],
    thead: ["class"],
    tbody: ["class"],
    tr: ["class"],
    td: ["class", "colspan", "rowspan"],
    th: ["class", "colspan", "rowspan"],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});

export function sanitizeBlogHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return blogFilter.process(dirty);
}

/**
 * Admin-autorski interaktivni postovi koji NAMERNO sadrže <script>
 * (npr. kalkulator nivoa) - sanitizacija bi im ubila funkcionalnost.
 * Svaki novi interaktivni post mora svesno da se doda ovde.
 */
const INTERACTIVE_BLOG_SLUGS = new Set(["kalkulator-nemackog-a1-b1"]);

export function blogHtmlForRender(slug: string, content: string | null | undefined): string {
  if (INTERACTIVE_BLOG_SLUGS.has(slug)) return content ?? "";
  return sanitizeBlogHtml(content);
}

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize admin/seed-authored HTML before rendering via dangerouslySetInnerHTML.
 *
 * Defense-in-depth: lesson/quiz content is currently admin-only, but this strips
 * <script>, inline event handlers (on*) and javascript: URLs so that if any
 * non-admin or AI-generated content ever reaches the DB it can't inject scripts.
 *
 * The allowlist preserves every tag the existing content actually uses
 * (mark, strong, em, p, div, br, ul/ol/li, h2/h3, a, span) plus media embeds
 * (iframe, audio, source, video) so rendering is unchanged.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "allow", "allowfullscreen", "frameborder"],
  });
}

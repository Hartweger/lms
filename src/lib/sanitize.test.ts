import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeBlogHtml, blogHtmlForRender } from "./sanitize";

describe("sanitizeBlogHtml", () => {
  it("skida <script> zajedno sa sadržajem", () => {
    const out = sanitizeBlogHtml('<p>Zdravo</p><script>alert("xss")</script>');
    expect(out).toContain("<p>Zdravo</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
  });

  it("skida inline event handlere i javascript: linkove", () => {
    const out = sanitizeBlogHtml('<img src="x" onerror="alert(1)"><a href="javascript:alert(1)">klik</a>');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("javascript:");
  });

  it("čuva blog markup: h4 (FAQ), figure/figcaption, blockquote", () => {
    const html = '<h4>Pitanje?</h4><blockquote>Citat</blockquote><figure class="aligncenter"><img src="/a.jpg" alt="a"><figcaption>Opis</figcaption></figure>';
    const out = sanitizeBlogHtml(html);
    expect(out).toContain("<h4>Pitanje?</h4>");
    expect(out).toContain("<blockquote>Citat</blockquote>");
    expect(out).toContain("<figcaption>Opis</figcaption>");
    expect(out).toContain('<figure class="aligncenter">');
  });

  it("čuva <bdi> (cene u WP sadržaju)", () => {
    const out = sanitizeBlogHtml("<p><bdi>5.960,00 <span>rsd</span></bdi></p>");
    expect(out).toContain("<bdi>");
  });

  it("čuva YouTube iframe embed", () => {
    const html = '<iframe src="https://www.youtube.com/embed/abc" title="Video" allowfullscreen></iframe>';
    expect(sanitizeBlogHtml(html)).toContain("youtube.com/embed/abc");
  });
});

describe("blogHtmlForRender", () => {
  it("običan post se sanitizuje", () => {
    const out = blogHtmlForRender("neki-post", "<p>Tekst</p><script>alert(1)</script>");
    expect(out).not.toContain("script");
  });

  it("interaktivni kalkulator post zadržava svoj script", () => {
    const html = '<div id="kalk"></div><script>document.getElementById("kalk").textContent = "A1";</script>';
    const out = blogHtmlForRender("kalkulator-nemackog-a1-b1", html);
    expect(out).toBe(html);
  });
});

describe("sanitizeHtml (postojeće ponašanje netaknuto)", () => {
  it("i dalje skida script i čuva lekcijski markup", () => {
    const out = sanitizeHtml('<h2>Lektion</h2><script>alert(1)</script>');
    expect(out).toContain("<h2>Lektion</h2>");
    expect(out).not.toContain("alert");
  });
});

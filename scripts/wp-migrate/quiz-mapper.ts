import type { ExerciseDump } from "./types";

const strip = (h: string) =>
  (h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–").replace(/&#8212;/g, "—").replace(/&amp;/g, "&")
    .replace(/&#8216;|&#8217;|&#8242;/g, "'").replace(/&#8220;|&#8221;|&#8243;/g, '"')
    .replace(/&#8222;/g, "„").replace(/&#8230;/g, "…").replace(/\s+/g, " ").trim();

// Kao strip(), ali ČUVA strukturu (prelomi redova, stavke) — za Schreiben/essay zadatke.
const ents = (s: string) => s
  .replace(/&nbsp;/g, " ").replace(/&#8211;/g, "–").replace(/&#8212;/g, "—").replace(/&amp;/g, "&")
  .replace(/&#8216;|&#8217;|&#8242;/g, "'").replace(/&#8220;|&#8221;|&#8243;/g, '"')
  .replace(/&#8222;/g, "„").replace(/&#8230;/g, "…");
const stripStructured = (h: string) =>
  ents((h || "")
    .replace(/<li[^>]*>/gi, "\n– ").replace(/<\/li>/gi, "")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();

// Izvuci string iz polja koje može biti string ili {rendered: string}
function rendered(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && typeof val.rendered === "string") return val.rendered;
  return String(val);
}

// LearnDash pitanje → ExerciseDump.questions[0] (+ flag ako treba review)
export function mapQuestion(q: any): { mapped: ExerciseDump["questions"][0]; reviewType: string | null } {
  const ldType = q.question_type as string;
  const questionText = strip(rendered(q.content) || rendered(q.title) || "");
  const explanation = strip(rendered(q.correct_message));

  if (ldType === "matrix_sort_answer") {
    const items = (q.answers || []).map((a: any) => {
      const text = strip(a._answer); const sort = strip(a._sortString);
      return { de: text, sr: sort };
    });
    return { mapped: { question: questionText || "Spoji parove:", options: { type: "match_pairs", items }, correct_answer: "all", question_type: "match_pairs", explanation: explanation || undefined }, reviewType: null };
  }

  if (ldType === "essay") {
    // Schreiben zadatak: čuvaj strukturu (prelomi, stavke) umesto zbijenog teksta
    const essayText = stripStructured(rendered(q.content) || rendered(q.title) || "");
    return { mapped: { question: essayText, options: { type: "essay" }, correct_answer: "", question_type: "essay", explanation: explanation || undefined }, reviewType: "essay (proveri prompt)" };
  }

  // cloze_answer: _answer sadrži više pod-praznina sa {tačno}; teško auto → flag za review
  const rawAnswer = (q.answers?.[0]?._answer) || "";
  const gaps = [...rawAnswer.matchAll(/\{([^}]+)\}/g)].map((m: any) => m[1].trim());
  return {
    mapped: {
      question: questionText || strip(rawAnswer).slice(0, 300),
      options: { type: "fill_blank", items: gaps },
      correct_answer: gaps.join(", "),
      question_type: "fill_blank",
      explanation: explanation || undefined,
    },
    reviewType: "cloze_answer (multi-gap — proveri pitanje/opcije/tačan odgovor)",
  };
}

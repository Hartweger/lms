const BASE = "https://www.hartweger.rs/wp-json/ldlms/v2";
const AUTH = "Basic " + Buffer.from("Nati:cEbg CO8J 1dPP olXw sK4W zDor").toString("base64");

export const COURSE_MAP: Record<string, number> = {
  "fsp": 40305, "polozi-fide": 45501, "gramatika-a2-b1": 47790,
  "polozi-goethe-b1": 31516, "polozi-goethe-b2": 31515,
};

async function wp(path: string): Promise<any> {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: AUTH } });
  if (!r.ok) throw new Error(`WP ${path} → ${r.status}`);
  return r.json();
}

// Vrati uređenu listu lekcija sa njihovim temama (redosled iz steps)
// courseQuizIds: kvizovi direktno na nivou kursa (ne unutar lekcija)
export async function getCourseTree(courseId: number) {
  const steps = await wp(`/sfwd-courses/${courseId}/steps`);
  const lessonsMap = steps?.h?.["sfwd-lessons"] ?? {};
  // t["sfwd-lessons"] daje redosled; ako nedostaje, koristimo ključeve iz h
  const orderedIds: number[] = Array.isArray(steps?.t?.["sfwd-lessons"])
    ? steps.t["sfwd-lessons"]
    : Object.keys(lessonsMap).map(Number);
  const out: { lessonId: number; topicIds: number[]; quizIds: number[] }[] = [];
  for (const lid of orderedIds) {
    const node = lessonsMap[lid] ?? {};
    const topics = node["sfwd-topic"];
    const topicIds = topics && !Array.isArray(topics) ? Object.keys(topics).map(Number) : [];
    const quizNode = node["sfwd-quiz"];
    const lessonQuizIds = quizNode && !Array.isArray(quizNode) ? Object.keys(quizNode).map(Number) : [];
    const topicQuizIds: number[] = [];
    if (topics && !Array.isArray(topics))
      for (const t of Object.values<any>(topics)) {
        const tq = t["sfwd-quiz"];
        if (tq && !Array.isArray(tq)) topicQuizIds.push(...Object.keys(tq).map(Number));
      }
    out.push({ lessonId: Number(lid), topicIds, quizIds: [...lessonQuizIds, ...topicQuizIds] });
  }
  // Kvizovi na nivou kursa (ne vezani za konkretnu lekciju)
  const courseQuizNode = steps?.h?.["sfwd-quiz"];
  const courseQuizIds: number[] = courseQuizNode && !Array.isArray(courseQuizNode)
    ? Object.keys(courseQuizNode).map(Number)
    : [];
  return { lessons: out, courseQuizIds };
}

export const getPost = (type: "sfwd-lessons" | "sfwd-topic", id: number) => wp(`/${type}/${id}`);
export const getQuizQuestions = (quizId: number) =>
  wp(`/sfwd-question?quiz=${quizId}&per_page=100`);

// Cista logika za dnevni rezime Schreiben-a. Bez I/O - sve zavisnosti se prosledjuju.

const MS_PER_DAY = 86400000;

export type DigestEssay = {
  id: string;
  userId: string;       // ucenik (auth.users.id)
  courseId: string;     // izveden iz lesson.course_id
  studentName: string;
  lessonTitle: string;
  submittedAt: string;  // ISO
};

export type Assignment = {
  professorId: string;
  studentId: string;
  courseId: string;
};

export type ProfessorGroup = { professorId: string; essays: DigestEssay[] };

export type DigestGrouping = {
  byProfessor: ProfessorGroup[];
  unassigned: DigestEssay[];
};

// Grupise pending eseje po profesoru. Rutiranje:
//  1) tačan (učenik, kurs) red u professor_students -> taj prof (individualni 1:1: course_id se poklapa).
//  2) nema tačnog kursa, ali učenik ima TAČNO JEDNOG profa -> taj prof. Ovo hvata grupne učenike:
//     oni su u professor_students pod *grupnim* kursom (proizvod, npr. „Grupni kurs B1.2"), a Schreiben
//     lekcija pripada *sadržajnom* kursu („Nemački B1.2") - course_id se nikad ne poklapa. Panel ionako
//     prikazuje radove po učeniku, pa ovo izjednačava rezime sa panelom.
//  3) bez profa, ili učenik ima više profa a nijedan ne odgovara kursu (dvosmisleno) -> `unassigned` (adminu).
export function groupEssaysForDigest(essays: DigestEssay[], assignments: Assignment[]): DigestGrouping {
  // Pretpostavka: najviše jedan profesor po (učenik, kurs). Ako bi bilo više redova - poslednji pobeđuje.
  const profByKey = new Map<string, string>(); // `${studentId}|${courseId}` -> professorId
  const profsByStudent = new Map<string, Set<string>>(); // studentId -> set profesora (svi kursevi)
  for (const a of assignments) {
    profByKey.set(`${a.studentId}|${a.courseId}`, a.professorId);
    const set = profsByStudent.get(a.studentId) ?? new Set<string>();
    set.add(a.professorId);
    profsByStudent.set(a.studentId, set);
  }

  const groups = new Map<string, DigestEssay[]>();
  const unassigned: DigestEssay[] = [];

  for (const essay of essays) {
    let professorId = profByKey.get(`${essay.userId}|${essay.courseId}`);
    if (!professorId) {
      const profs = profsByStudent.get(essay.userId);
      if (profs && profs.size === 1) professorId = [...profs][0];
    }
    if (!professorId) {
      unassigned.push(essay);
      continue;
    }
    const list = groups.get(professorId) ?? [];
    list.push(essay);
    groups.set(professorId, list);
  }

  return {
    byProfessor: [...groups.entries()].map(([professorId, list]) => ({ professorId, essays: list })),
    unassigned,
  };
}

// Eseji koji cekaju >= `days` dana (za osigurac u jutarnjem pregledu).
export function essaysOverdue<T extends { submittedAt: string }>(essays: T[], nowMs: number, days: number): T[] {
  const cutoff = nowMs - days * MS_PER_DAY;
  return essays.filter((e) => new Date(e.submittedAt).getTime() <= cutoff);
}

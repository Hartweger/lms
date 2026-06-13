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

// Grupise pending eseje: oni ciji (student, kurs) ima reda u professor_students idu pod tog profa,
// ostali (npr. samostalni video kursevi bez profa) idu u `unassigned` -> adminu.
export function groupEssaysForDigest(essays: DigestEssay[], assignments: Assignment[]): DigestGrouping {
  // Pretpostavka: najviše jedan profesor po (učenik, kurs). Ako bi bilo više redova - poslednji pobeđuje.
  const profByKey = new Map<string, string>(); // `${studentId}|${courseId}` -> professorId
  for (const a of assignments) {
    profByKey.set(`${a.studentId}|${a.courseId}`, a.professorId);
  }

  const groups = new Map<string, DigestEssay[]>();
  const unassigned: DigestEssay[] = [];

  for (const essay of essays) {
    const professorId = profByKey.get(`${essay.userId}|${essay.courseId}`);
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

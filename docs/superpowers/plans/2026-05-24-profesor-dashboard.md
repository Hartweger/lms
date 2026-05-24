# Profesor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profesorke vide svoje dodeljene studente sa progresom i pregledaju/ocenjuju eseje — admin ih dodeljuje ručno ili automatski iz WC varijacije.

**Architecture:** Nova `professor_students` tabela povezuje profesorku sa studentom za konkretan kurs. Middleware proverava role i štiti `/profesor` rutu. Admin stranica za dodelu, profesor dashboard sa dva taba (Studenti + Eseji).

**Tech Stack:** Next.js 16, Supabase (RLS + migrations), Tailwind CSS 4, TypeScript

---

### Task 1: Database migration — `professor_students` tabela

**Files:**
- Create: `supabase/migrations/014_professor_students.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Professor-student assignments

CREATE TABLE public.professor_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_via TEXT NOT NULL DEFAULT 'manual' CHECK (assigned_via IN ('manual', 'wc_variation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professor_id, student_id, course_id)
);

-- Indexes
CREATE INDEX idx_professor_students_professor ON public.professor_students(professor_id);
CREATE INDEX idx_professor_students_student ON public.professor_students(student_id);

-- RLS
ALTER TABLE public.professor_students ENABLE ROW LEVEL SECURITY;

-- Professors can read their own assignments
CREATE POLICY "Professors can read own assignments" ON public.professor_students
  FOR SELECT USING (professor_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all assignments" ON public.professor_students
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );
```

- [ ] **Step 2: Run the migration against Supabase**

Run: `npx supabase db push` or apply manually via Supabase dashboard SQL editor.

Copy the SQL content and execute it in the Supabase SQL editor at the project dashboard. Verify the table appears in Table Editor.

- [ ] **Step 3: Add TypeScript type**

Add to `src/lib/types.ts` after the `EssaySubmission` interface:

```typescript
export interface ProfessorStudent {
  id: string;
  professor_id: string;
  student_id: string;
  course_id: string;
  assigned_via: "manual" | "wc_variation";
  created_at: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/014_professor_students.sql src/lib/types.ts
git commit -m "feat: add professor_students table and type"
```

---

### Task 2: Middleware — protect `/profesor` route and add redirect logic

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update middleware to handle professor routes**

Replace the entire content of `src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/profil"];
const adminRoutes = ["/admin"];
const professorRoutes = ["/profesor"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirect to login if accessing protected route without auth
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/prijava", request.url));
  }

  // Check admin access
  const isAdmin = adminRoutes.some((route) => path.startsWith(route));
  if (isAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL("/prijava", request.url));
    }
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Check professor access
  const isProfessorRoute = professorRoutes.some((route) => path.startsWith(route));
  if (isProfessorRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/prijava", request.url));
    }
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "professor" && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect professors from /dashboard to /profesor
  if (path.startsWith("/dashboard") && user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "professor") {
      return NextResponse.redirect(new URL("/profesor", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profil/:path*", "/admin/:path*", "/profesor/:path*"],
};
```

- [ ] **Step 2: Verify locally**

Run: `npm run dev`

Visit `/profesor` while logged out — should redirect to `/prijava`.
Visit `/profesor` as a student — should redirect to `/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add professor route protection and dashboard redirect"
```

---

### Task 3: Profesor layout

**Files:**
- Create: `src/app/profesor/layout.tsx`

- [ ] **Step 1: Create the professor layout**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/prijava");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professor" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Zdravo, {profile?.full_name || "profesore"}!
          </h1>
          <p className="text-sm text-gray-400">Profesor panel</p>
        </div>
      </div>
      <nav className="flex gap-2 mb-8 border-b border-gray-100 pb-3">
        <NavLink href="/profesor">Studenti</NavLink>
        <NavLink href="/profesor/eseji">Eseji</NavLink>
      </nav>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {children}
    </Link>
  );
}
```

Note: The NavLink doesn't have active state detection because this is a server component. We'll add active state styling in Task 4 by making the nav a client component.

- [ ] **Step 2: Commit**

```bash
git add src/app/profesor/layout.tsx
git commit -m "feat: add professor layout with tab navigation"
```

---

### Task 4: Profesor nav — active tab styling (client component)

**Files:**
- Create: `src/components/ProfesorNav.tsx`
- Modify: `src/app/profesor/layout.tsx`

- [ ] **Step 1: Create ProfesorNav client component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/profesor", label: "Studenti", exact: true },
  { href: "/profesor/eseji", label: "Eseji", exact: false },
];

export default function ProfesorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 mb-8 border-b border-gray-100 pb-3">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-plava-light text-plava font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Update layout to use ProfesorNav**

Replace `src/app/profesor/layout.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfesorNav from "@/components/ProfesorNav";

export const dynamic = "force-dynamic";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/prijava");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professor" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Zdravo, {profile?.full_name || "profesore"}!
        </h1>
        <p className="text-sm text-gray-400">Profesor panel</p>
      </div>
      <ProfesorNav />
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfesorNav.tsx src/app/profesor/layout.tsx
git commit -m "feat: add active tab styling for professor nav"
```

---

### Task 5: Profesor dashboard — Studenti tab

**Files:**
- Create: `src/app/profesor/page.tsx`

- [ ] **Step 1: Create the students page**

```tsx
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface StudentWithProgress {
  id: string;
  full_name: string;
  email: string;
  course_title: string;
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
  last_activity: string | null;
}

export default async function ProfesorStudenti() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all students assigned to this professor
  const { data: assignments } = await supabase
    .from("professor_students")
    .select("student_id, course_id")
    .eq("professor_id", user.id);

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Nemaš dodeljene studente.</p>
        <p className="text-sm text-gray-300 mt-2">Admin će ti dodeliti studente.</p>
      </div>
    );
  }

  // Get unique student IDs and course IDs
  const studentIds = [...new Set(assignments.map((a) => a.student_id))];
  const courseIds = [...new Set(assignments.map((a) => a.course_id))];

  // Fetch student profiles
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  // Fetch course info
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds);

  const courseMap = new Map(courses?.map((c) => [c.id, c]) ?? []);

  // For each assignment, compute progress
  const students: StudentWithProgress[] = [];

  for (const assignment of assignments) {
    const profile = profileMap.get(assignment.student_id);
    const course = courseMap.get(assignment.course_id);
    if (!profile || !course) continue;

    // Get lesson count for this course
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", assignment.course_id);

    const lessonIds = lessons?.map((l) => l.id) ?? [];
    let completedLessons = 0;
    let lastActivity: string | null = null;

    if (lessonIds.length > 0) {
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", assignment.student_id)
        .eq("completed", true)
        .in("lesson_id", lessonIds);

      completedLessons = progress?.length ?? 0;

      if (progress && progress.length > 0) {
        lastActivity = progress.reduce((latest, p) =>
          p.completed_at && (!latest || p.completed_at > latest)
            ? p.completed_at
            : latest,
          null as string | null
        );
      }
    }

    const totalLessons = lessonIds.length;
    const progressPercent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    students.push({
      id: assignment.student_id,
      full_name: profile.full_name ?? "",
      email: profile.email,
      course_title: course.title,
      course_id: assignment.course_id,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress: progressPercent,
      last_activity: lastActivity,
    });
  }

  // Sort: most recent activity first
  students.sort((a, b) => {
    if (!a.last_activity && !b.last_activity) return 0;
    if (!a.last_activity) return 1;
    if (!b.last_activity) return -1;
    return b.last_activity.localeCompare(a.last_activity);
  });

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">{students.length} studenata</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Ime</th>
              <th className="text-left px-6 py-3">Kurs</th>
              <th className="text-left px-6 py-3">Progres</th>
              <th className="text-left px-6 py-3">Poslednja aktivnost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s, i) => (
              <tr key={`${s.id}-${s.course_id}-${i}`} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{s.full_name || "—"}</div>
                  <div className="text-xs text-gray-400">{s.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{s.course_title}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-plava h-2 rounded-full transition-all"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {s.completed_lessons}/{s.total_lessons}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {s.last_activity
                    ? new Date(s.last_activity).toLocaleDateString("sr-Latn")
                    : "Nema aktivnosti"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify locally**

Run: `npm run dev`

Visit `/profesor` as a professor user. Should show the students table (empty if no assignments yet).

- [ ] **Step 3: Commit**

```bash
git add src/app/profesor/page.tsx
git commit -m "feat: add professor students tab with progress display"
```

---

### Task 6: Profesor dashboard — Eseji tab

**Files:**
- Create: `src/app/profesor/eseji/page.tsx`

- [ ] **Step 1: Create the essays page**

This reuses the same UX as `/admin/eseji` but filters by the professor's assigned students.

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EssayRow {
  id: string;
  user_id: string;
  exercise_id: string;
  lesson_id: string;
  text: string;
  ai_feedback: string | null;
  ai_corrections: { original: string; corrected: string; explanation: string }[] | null;
  ai_score: number | null;
  professor_feedback: string | null;
  professor_score: number | null;
  status: "pending" | "reviewed" | "published";
  submitted_at: string;
  reviewed_at: string | null;
  user_profiles?: { full_name: string; email: string };
  lessons?: { title: string };
  exercises?: { title: string };
}

export default function ProfesorEseji() {
  const supabase = createClient();
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "published" | "all">("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profFeedback, setProfFeedback] = useState("");
  const [profScore, setProfScore] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get assigned student IDs
      const { data: assignments } = await supabase
        .from("professor_students")
        .select("student_id")
        .eq("professor_id", user.id);

      const studentIds = [...new Set(assignments?.map((a) => a.student_id) ?? [])];

      if (studentIds.length === 0) {
        setEssays([]);
        setLoading(false);
        return;
      }

      // Fetch essays only from assigned students
      let query = supabase
        .from("essay_submissions")
        .select("*, user_profiles(full_name, email), lessons(title), exercises(title)")
        .in("user_id", studentIds)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      setEssays((data as EssayRow[]) || []);
      setLoading(false);
    };
    load();
  }, [filter, supabase]);

  const startReview = (essay: EssayRow) => {
    setEditingId(essay.id);
    setProfFeedback(essay.professor_feedback || essay.ai_feedback || "");
    setProfScore(essay.professor_score || essay.ai_score || 3);
  };

  const publishEssay = async (essayId: string) => {
    setSaving(true);
    const { error } = await supabase.from("essay_submissions").update({
      professor_feedback: profFeedback,
      professor_score: profScore,
      status: "published",
      reviewed_at: new Date().toISOString(),
    }).eq("id", essayId);

    if (error) {
      alert("Greška pri čuvanju: " + error.message);
      setSaving(false);
      return;
    }

    setEssays(essays.map(e =>
      e.id === essayId
        ? { ...e, professor_feedback: profFeedback, professor_score: profScore, status: "published" as const, reviewed_at: new Date().toISOString() }
        : e
    ));
    setEditingId(null);
    setSaving(false);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    reviewed: "bg-blue-100 text-blue-700",
    published: "bg-green-100 text-green-700",
  };

  const statusLabels = {
    pending: "Čeka pregled",
    reviewed: "Pregledano",
    published: "Objavljeno",
  };

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(["pending", "reviewed", "published", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === f
                ? "bg-plava text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "pending" ? "Čekaju pregled" : f === "reviewed" ? "Pregledano" : f === "published" ? "Objavljeno" : "Svi"}
          </button>
        ))}
      </div>

      {essays.length === 0 && (
        <p className="text-gray-400 text-center py-12">Nema eseja u ovoj kategoriji.</p>
      )}

      <div className="space-y-4">
        {essays.map((essay) => (
          <div key={essay.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">
                  {essay.user_profiles?.full_name || essay.user_profiles?.email || "Nepoznat"}
                </span>
                <span className="text-gray-400 text-sm ml-3">
                  {new Date(essay.submitted_at).toLocaleDateString("sr-Latn")}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[essay.status]}`}>
                {statusLabels[essay.status]}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              {essay.lessons?.title} — {essay.exercises?.title}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Tekst studenta:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{essay.text}</p>
            </div>

            {essay.ai_feedback && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">
                  AI sugestija (ocena: {essay.ai_score}/5):
                </p>
                <p className="text-sm text-gray-700">{essay.ai_feedback}</p>
                {essay.ai_corrections && essay.ai_corrections.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {essay.ai_corrections.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-koral line-through">{c.original}</span>
                        {" → "}
                        <span className="text-green-600 font-medium">{c.corrected}</span>
                        {c.explanation && <span className="text-gray-400"> — {c.explanation}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {editingId === essay.id ? (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Tvoj komentar:</label>
                  <textarea
                    value={profFeedback}
                    onChange={(e) => setProfFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Ocena:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setProfScore(s)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold ${
                          profScore === s
                            ? "bg-plava text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => publishEssay(essay.id)}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Čuvam..." : "Objavi studentu"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            ) : (
              essay.status !== "published" && (
                <button
                  onClick={() => startReview(essay)}
                  className="bg-plava text-white px-4 py-2 rounded-lg text-sm hover:bg-plava-dark"
                >
                  Pregledaj i oceni
                </button>
              )
            )}

            {essay.status === "published" && essay.professor_feedback && (
              <div className="bg-green-50 rounded-lg p-4 mt-4">
                <p className="text-xs font-semibold text-green-600 mb-1">
                  Profesor (ocena: {essay.professor_score}/5):
                </p>
                <p className="text-sm text-gray-700">{essay.professor_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify locally**

Run: `npm run dev`

Visit `/profesor/eseji` — should show the filtered essay view.

- [ ] **Step 3: Commit**

```bash
git add src/app/profesor/eseji/page.tsx
git commit -m "feat: add professor essays tab with student filtering"
```

---

### Task 7: Admin — Profesori management page

**Files:**
- Create: `src/app/admin/profesori/page.tsx`
- Modify: `src/components/AdminSidebar.tsx`

- [ ] **Step 1: Create the admin professors page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfessorRow {
  id: string;
  full_name: string;
  email: string;
  studentCount: number;
}

interface AssignmentRow {
  id: string;
  student_id: string;
  course_id: string;
  assigned_via: "manual" | "wc_variation";
  student_name: string;
  student_email: string;
  course_title: string;
}

interface StudentOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function AdminProfesori() {
  const supabase = createClient();
  const [professors, setProfessors] = useState<ProfessorRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selectedProf, setSelectedProf] = useState<ProfessorRow | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: profData } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .eq("role", "professor")
        .order("full_name");

      const { data: assignData } = await supabase
        .from("professor_students")
        .select("professor_id");

      // Count students per professor
      const countMap = new Map<string, number>();
      for (const a of assignData ?? []) {
        countMap.set(a.professor_id, (countMap.get(a.professor_id) ?? 0) + 1);
      }

      const rows: ProfessorRow[] = (profData ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name ?? "",
        email: p.email,
        studentCount: countMap.get(p.id) ?? 0,
      }));

      setProfessors(rows);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const openDetail = async (prof: ProfessorRow) => {
    setSelectedProf(prof);
    setLoadingDetail(true);

    const [assignRes, studentRes, courseRes] = await Promise.all([
      supabase
        .from("professor_students")
        .select("id, student_id, course_id, assigned_via")
        .eq("professor_id", prof.id),
      supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .eq("role", "student")
        .order("full_name"),
      supabase
        .from("courses")
        .select("id, title"),
    ]);

    const studentMap = new Map(
      (studentRes.data ?? []).map((s) => [s.id, s])
    );
    const courseMap = new Map(
      (courseRes.data ?? []).map((c) => [c.id, c])
    );

    const rows: AssignmentRow[] = (assignRes.data ?? []).map((a) => {
      const student = studentMap.get(a.student_id);
      const course = courseMap.get(a.course_id);
      return {
        id: a.id,
        student_id: a.student_id,
        course_id: a.course_id,
        assigned_via: a.assigned_via,
        student_name: student?.full_name ?? "",
        student_email: student?.email ?? "",
        course_title: course?.title ?? "Nepoznat kurs",
      };
    });

    setAssignments(rows);
    setAllStudents((studentRes.data ?? []) as StudentOption[]);
    setAllCourses((courseRes.data ?? []) as CourseOption[]);
    setLoadingDetail(false);
  };

  const addAssignment = async () => {
    if (!selectedProf || !selectedStudentId || !selectedCourseId) return;

    const { data, error } = await supabase
      .from("professor_students")
      .insert({
        professor_id: selectedProf.id,
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        assigned_via: "manual",
      })
      .select("id, student_id, course_id, assigned_via")
      .single();

    if (error) {
      if (error.code === "23505") {
        alert("Ovaj student je već dodeljen za ovaj kurs.");
      } else {
        alert("Greška: " + error.message);
      }
      return;
    }

    if (data) {
      const student = allStudents.find((s) => s.id === data.student_id);
      const course = allCourses.find((c) => c.id === data.course_id);
      setAssignments([
        ...assignments,
        {
          id: data.id,
          student_id: data.student_id,
          course_id: data.course_id,
          assigned_via: data.assigned_via,
          student_name: student?.full_name ?? "",
          student_email: student?.email ?? "",
          course_title: course?.title ?? "",
        },
      ]);
      setSelectedStudentId("");
      setSelectedCourseId("");

      // Update count
      setProfessors(professors.map((p) =>
        p.id === selectedProf.id ? { ...p, studentCount: p.studentCount + 1 } : p
      ));
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    await supabase.from("professor_students").delete().eq("id", assignmentId);
    setAssignments(assignments.filter((a) => a.id !== assignmentId));
    setConfirmDeleteId(null);

    if (selectedProf) {
      setProfessors(professors.map((p) =>
        p.id === selectedProf.id ? { ...p, studentCount: Math.max(0, p.studentCount - 1) } : p
      ));
    }
  };

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;

  // Detail view
  if (selectedProf) {
    return (
      <div>
        <button
          onClick={() => { setSelectedProf(null); setAssignments([]); }}
          className="text-sm text-plava hover:underline mb-4 inline-block"
        >
          ← Nazad na listu
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedProf.full_name}</h1>
        <p className="text-gray-500 mb-6">{selectedProf.email}</p>

        {/* Add assignment form */}
        <div className="bg-plava-light rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Izaberi studenta...</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.email} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Kurs</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Izaberi kurs...</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addAssignment}
            disabled={!selectedStudentId || !selectedCourseId}
            className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
          >
            Dodeli
          </button>
        </div>

        {/* Current assignments */}
        {loadingDetail ? (
          <div className="text-gray-400">Učitavanje...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            Nema dodeljenih studenata.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-6 py-3">Student</th>
                  <th className="text-left px-6 py-3">Kurs</th>
                  <th className="text-left px-6 py-3">Dodeljeno</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{a.student_name || "—"}</div>
                      <div className="text-xs text-gray-400">{a.student_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{a.course_title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        a.assigned_via === "wc_variation"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.assigned_via === "wc_variation" ? "WC automatski" : "Ručno"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmDeleteId === a.id ? (
                        <span className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-500">Sigurno?</span>
                          <button
                            onClick={() => removeAssignment(a.id)}
                            className="text-xs text-koral font-medium hover:underline"
                          >
                            Da
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            Ne
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="text-xs text-koral hover:underline"
                        >
                          Ukloni
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profesori</h1>

      {professors.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema profesora. Kreiraj nalog u Supabase sa role=professor.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">Ime</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Studenata</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {professors.map((prof) => (
                <tr key={prof.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{prof.full_name || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{prof.email}</td>
                  <td className="px-6 py-4 text-gray-500">{prof.studentCount}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openDetail(prof)}
                      className="text-plava hover:underline text-sm"
                    >
                      Upravljaj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add "Profesori" link to AdminSidebar**

In `src/components/AdminSidebar.tsx`, add to the `links` array after the "Eseji" entry:

```typescript
{ href: "/admin/profesori", label: "Profesori" },
```

The full array becomes:

```typescript
const links = [
  { href: "/admin", label: "Pregled" },
  { href: "/admin/kursevi", label: "Kursevi" },
  { href: "/admin/studenti", label: "Studenti" },
  { href: "/admin/kupovine", label: "Kupovine" },
  { href: "/admin/test-nivoa", label: "Test nivoa" },
  { href: "/admin/eseji", label: "Eseji" },
  { href: "/admin/profesori", label: "Profesori" },
  { href: "/admin/pristup", label: "Pristup" },
];
```

- [ ] **Step 3: Verify locally**

Run: `npm run dev`

Visit `/admin/profesori` — should show the professor list (empty until professors are created).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/profesori/page.tsx src/components/AdminSidebar.tsx
git commit -m "feat: add admin professor management page"
```

---

### Task 8: WC webhook — auto-assign professor from variation

**Files:**
- Modify: `src/lib/wc-sync.ts`
- Modify: `src/app/api/wc-webhook/route.ts`

- [ ] **Step 1: Add professor assignment to wc-sync.ts**

Add the following function at the end of `src/lib/wc-sync.ts`, before the closing of the file:

```typescript
export async function assignProfessor(
  userId: string,
  courseIds: string[],
  professorName: string
) {
  if (!professorName) return;

  const supabase = createAdminClient();
  const nameLower = professorName.toLowerCase().trim();

  // Find professor by partial name match
  const { data: professors } = await supabase
    .from("user_profiles")
    .select("id, full_name")
    .eq("role", "professor");

  const professor = professors?.find((p) =>
    p.full_name?.toLowerCase().includes(nameLower)
  );

  if (!professor) {
    console.log(`[wc-sync] Professor not found: "${professorName}"`);
    return;
  }

  for (const courseId of courseIds) {
    const { error } = await supabase
      .from("professor_students")
      .upsert(
        {
          professor_id: professor.id,
          student_id: userId,
          course_id: courseId,
          assigned_via: "wc_variation",
        },
        { onConflict: "professor_id,student_id,course_id" }
      );

    if (error) {
      console.log(`[wc-sync] Failed to assign professor: ${error.message}`);
    } else {
      console.log(`[wc-sync] Assigned professor ${professor.full_name} for course ${courseId}`);
    }
  }
}
```

- [ ] **Step 2: Update webhook route to extract professor name and pass it**

In `src/app/api/wc-webhook/route.ts`, update the section that processes line items. Replace lines 44-58 with:

```typescript
    const email = order.billing?.email;
    const firstName = order.billing?.first_name || "";
    const lastName = order.billing?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    // Extract product IDs and professor name from variations
    let professorName = "";
    const productIds: number[] = [];

    for (const item of order.line_items || []) {
      productIds.push(item.product_id);

      // Check meta_data for professor variation
      for (const meta of item.meta_data || []) {
        const key = (meta.key || "").toLowerCase();
        if (key.includes("profesor") || key.includes("teacher") || key.includes("nastavnik")) {
          professorName = meta.value || "";
        }
      }
    }

    if (!email) {
      console.log(`[wc-webhook] No email in order ${order.id}`);
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    console.log(
      `[wc-webhook] Processing order ${order.id}: ${email}, products: ${productIds}${professorName ? `, professor: ${professorName}` : ""}`
    );

    const result = await grantAccess(email, fullName, productIds);

    // Auto-assign professor if variation specified
    if (professorName && result.userId && result.coursesGranted.length > 0) {
      const { assignProfessor } = await import("@/lib/wc-sync");

      // Get course IDs for granted slugs
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const courseIdsForAssign: string[] = [];

      for (const slug of result.coursesGranted) {
        const { data: course } = await adminSupabase
          .from("courses")
          .select("id")
          .eq("slug", slug)
          .single();
        if (course) courseIdsForAssign.push(course.id);
      }

      await assignProfessor(result.userId, courseIdsForAssign, professorName);
    }

    console.log(`[wc-webhook] Result for ${email}:`, result);

    return NextResponse.json({ ok: true });
```

- [ ] **Step 3: Verify the webhook route compiles**

Run: `npm run build` (or `npx next build`)

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/wc-sync.ts src/app/api/wc-webhook/route.ts
git commit -m "feat: auto-assign professor from WC variation on webhook"
```

---

### Task 9: Final verification and deploy

- [ ] **Step 1: Run the full build**

Run: `npm run build`

Expected: No errors, all pages compile.

- [ ] **Step 2: Test the full flow locally**

1. Run `npm run dev`
2. Log in as admin → visit `/admin/profesori` → verify empty state
3. Create a test professor in Supabase (set role=professor)
4. Refresh `/admin/profesori` → professor appears
5. Visit `/profesor` as admin → should work (admins have access)
6. Visit `/dashboard` — if role is professor, should redirect to `/profesor`

- [ ] **Step 3: Deploy**

Run: `git push`

Vercel auto-deploys from main branch.

- [ ] **Step 4: Run migration on production**

Execute the SQL from `014_professor_students.sql` in the Supabase production SQL editor.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final adjustments for professor dashboard"
```

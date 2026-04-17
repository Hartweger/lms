# Admin Dashboard Redesign

## Overview

Replace the current minimal admin dashboard (3 static stat cards) with an actionable dashboard that tells the admin what needs attention, what happened recently, and where students struggle.

## Current State

- `src/app/admin/page.tsx` — shows 3 cards: total students, total courses, total purchases
- No activity feed, no alerts, no engagement data
- Admin must navigate to sub-pages to understand what's happening

## Design

### 1. Statistika (Top Row) — 4 Cards

| Card | Source | Query |
|------|--------|-------|
| Ukupno studenata | `user_profiles` where role = 'student' | count |
| Ukupno kurseva | `courses` | count |
| Kupovine (ovaj mesec) | `purchases` where status = 'completed' AND created_at >= start of month | count |
| Aktivni studenti (7d) | `auth.users` where last_sign_in_at >= 7 days ago | count |

Each card: large number, label below, same style as current but 4 columns on desktop, 2 on mobile.

### 2. Zahteva paznju (Attention Required)

Two sub-sections in a single card/panel:

**Ističe pristup (narednih 30 dana):**
- Query: `course_access` where `expires_at` is NOT NULL and `expires_at` BETWEEN now AND now + 30 days
- Join with `user_profiles` (name, email) and `courses` (title)
- Display: table with columns: Student, Kurs, Ističe, Akcija (dugme "Produži")
- "Produži" calls existing extend logic (adds 1 year to expires_at)
- If empty: show "Nema studenata kojima uskoro ističe pristup"

**Neaktivni studenti (14+ dana):**
- Query: `auth.users` where `last_sign_in_at` < now - 14 days, joined with `user_profiles` where role = 'student'
- Display: table with columns: Student, Email, Poslednji login
- Sorted by last_sign_in_at ascending (longest inactive first)
- Limit to 10, with link "Prikaži sve" → `/admin/studenti`
- If empty: show "Svi studenti su aktivni"

Note: accessing `auth.users` requires a server component with service role or a database view/function. We will create a Supabase SQL function `get_inactive_students(days INT)` that returns the needed data.

### 3. Skorašnje aktivnosti (This Week)

Three sub-sections in a feed-style list, combined and sorted by date:

**Nove registracije:**
- Query: `user_profiles` where `created_at` >= start of this week (Monday)
- Display: name, email, date

**Nove kupovine:**
- Query: `purchases` where `created_at` >= start of this week AND status = 'completed'
- Join with `user_profiles` and `courses`
- Display: student name, course title, date

**Dostignuća:**
- Query: `lesson_progress` — students who completed all lessons in a course this week
- A student "completed a course" when their completed lesson count = total lessons in that course
- Display: student name, course title, "Završio kurs", date

Combined into one chronological feed. Each item has an icon to distinguish type (registration, purchase, achievement). Limited to 15 items. If empty: "Nema aktivnosti ove nedelje."

### 4. Gde studenti odustaju (Drop-off Analysis)

Per course: identify the lesson where the most students stopped progressing.

**Logic:**
- For each course, find each student's last completed lesson (by lesson order)
- The lesson where the most students stopped = drop-off point
- Only count students who started but didn't finish the course

**Query approach:** Create a Supabase SQL function `get_course_dropoff()` that returns:
- course_id, course_title, lesson_id, lesson_title, lesson_order, stopped_count, total_started

**Display:**
- One row per course
- Columns: Kurs, Lekcija (drop-off point), Broj studenata koji su stali, % od ukupno započetih
- Only show courses with at least 5 students who started (to avoid noise)
- If no data: "Nedovoljno podataka za analizu"

### 5. Brze prečice (Quick Actions)

Row of 3 buttons at the bottom:
- "Dodaj studenta" → `/admin/studenti` (existing page)
- "Dodaj kurs" → `/admin/kursevi/novi` (existing page)
- "Pregledaj kupovine" → `/admin/kupovine` (existing page)

Styled as outlined buttons with icons.

## Database Changes

Two new SQL functions needed (no table changes):

```sql
-- 1. Get inactive students
CREATE OR REPLACE FUNCTION get_inactive_students(inactive_days INT DEFAULT 14)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  last_sign_in_at TIMESTAMPTZ
) AS $$
  SELECT 
    up.id,
    up.email,
    up.full_name,
    au.last_sign_in_at
  FROM auth.users au
  JOIN public.user_profiles up ON up.id = au.id
  WHERE up.role = 'student'
    AND au.last_sign_in_at < NOW() - (inactive_days || ' days')::INTERVAL
  ORDER BY au.last_sign_in_at ASC
  LIMIT 10;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Get course drop-off points
CREATE OR REPLACE FUNCTION get_course_dropoff()
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  dropoff_lesson_id UUID,
  dropoff_lesson_title TEXT,
  dropoff_lesson_order INT,
  stopped_count BIGINT,
  total_started BIGINT
) AS $$
  WITH student_last_lesson AS (
    SELECT 
      l.course_id,
      lp.user_id,
      MAX(l."order") AS last_completed_order
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    WHERE lp.completed = true
    GROUP BY l.course_id, lp.user_id
  ),
  course_max AS (
    SELECT course_id, MAX("order") AS max_order
    FROM lessons
    GROUP BY course_id
  ),
  incomplete_students AS (
    SELECT 
      sll.course_id,
      sll.last_completed_order
    FROM student_last_lesson sll
    JOIN course_max cm ON cm.course_id = sll.course_id
    WHERE sll.last_completed_order < cm.max_order
  ),
  dropoff AS (
    SELECT 
      course_id,
      last_completed_order,
      COUNT(*) AS stopped_count
    FROM incomplete_students
    GROUP BY course_id, last_completed_order
  ),
  ranked AS (
    SELECT 
      d.*,
      ROW_NUMBER() OVER (PARTITION BY d.course_id ORDER BY d.stopped_count DESC) AS rn
    FROM dropoff d
  ),
  started_counts AS (
    SELECT course_id, COUNT(DISTINCT user_id) AS total_started
    FROM student_last_lesson
    GROUP BY course_id
  )
  SELECT 
    r.course_id,
    c.title AS course_title,
    l.id AS dropoff_lesson_id,
    l.title AS dropoff_lesson_title,
    r.last_completed_order AS dropoff_lesson_order,
    r.stopped_count,
    sc.total_started
  FROM ranked r
  JOIN courses c ON c.id = r.course_id
  JOIN lessons l ON l.course_id = r.course_id AND l."order" = r.last_completed_order
  JOIN started_counts sc ON sc.course_id = r.course_id
  WHERE r.rn = 1 AND sc.total_started >= 5;
$$ LANGUAGE sql SECURITY DEFINER;
```

## File Changes

- `src/app/admin/page.tsx` — complete rewrite with all 5 sections
- No new files needed, everything in the single admin page

## Active students count

For "Aktivni studenti (7d)" stat card, we need another SQL function since `auth.users` is not directly queryable:

```sql
CREATE OR REPLACE FUNCTION get_active_student_count(days INT DEFAULT 7)
RETURNS BIGINT AS $$
  SELECT COUNT(*)
  FROM auth.users au
  JOIN public.user_profiles up ON up.id = au.id
  WHERE up.role = 'student'
    AND au.last_sign_in_at >= NOW() - (days || ' days')::INTERVAL;
$$ LANGUAGE sql SECURITY DEFINER;
```

## Mobile Layout

- Stat cards: 2x2 grid on mobile, 4 columns on desktop
- Tables: horizontal scroll on mobile
- Activity feed: full width, stacked
- Quick actions: stacked vertically on mobile

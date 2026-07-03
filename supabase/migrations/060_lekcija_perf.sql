-- Perf: stranica lekcije je povlačila sections (pun jsonb, ~814 kB ukupno) za SVE
-- lekcije kursa samo da izvuče ime modula za bedž u draweru.
-- module_name je GENERATED kolona - Postgres je sam održava pri svakom update-u
-- lekcije, bez ikakve sync logike u aplikaciji.
-- Izraz je 1:1 ekvivalent JS ekstrakcije: sections.find(s => s.type === "badge")?.module
-- (provereno na svih 410 lekcija pre migracije - 0 razlika).
alter table lessons add column if not exists module_name text
  generated always as (
    jsonb_path_query_first(sections, '$[*] ? (@.type == "badge").module') #>> '{}'
  ) stored;

-- FK indeksi sa audita (jul 2026): mala baza sad, ali besplatni i direktno
-- pokrivaju upite stranice lekcije, dashboarda i email-throttle na orders.
create index if not exists idx_lessons_course_id on lessons (course_id);
create index if not exists idx_exercises_lesson_id on exercises (lesson_id);
create index if not exists idx_exercise_questions_exercise_id on exercise_questions (exercise_id);
create index if not exists idx_lesson_progress_lesson_id on lesson_progress (lesson_id);
create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_payment_status on orders (payment_status);
create index if not exists idx_blog_posts_slug_published on blog_posts (slug, is_published);

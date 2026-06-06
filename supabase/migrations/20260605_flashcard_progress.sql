create table if not exists public.flashcard_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  set_key text not null,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  status text not null default 'new' check (status in ('new','learning','mastered')),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.flashcard_progress enable row level security;

create policy "own_select" on public.flashcard_progress
  for select using (auth.uid() = user_id);
create policy "own_upsert" on public.flashcard_progress
  for insert with check (auth.uid() = user_id);
create policy "own_update" on public.flashcard_progress
  for update using (auth.uid() = user_id);

create index if not exists flashcard_progress_set_idx
  on public.flashcard_progress (user_id, set_key);

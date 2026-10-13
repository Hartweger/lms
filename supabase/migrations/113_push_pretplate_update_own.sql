-- PushPrijava radi upsert po endpoint-u: kad isti uređaj ponovo uključi
-- obaveštenja, upsert postaje UPDATE, a bez ove polise RLS ga odbija.
create policy push_pretplate_update_own
  on public.push_pretplate for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

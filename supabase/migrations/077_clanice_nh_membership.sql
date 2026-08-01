-- Veza javnog imenika (clanice) sa NH Membership: plaćena članica može da
-- istakne svoju karticu. Isticanje važi samo dok je pretplata aktivna -
-- view javne_clanice to računa kroz je_aktivna_clanica(), pa se oznaka
-- gasi sama sa pretplatom (isti princip kao lekcije/chat). Kartica sama
-- ostaje - javni imenik je besplatan i nezavisan od članstva.
-- NAPOMENA: tabela clanice postoji u bazi bez migracionog fajla (prijave sa
-- natasahartweger.rs, service-role only, bez RLS polisa) - ovo je prva
-- migracija koja je dira.

alter table public.clanice
  add column if not exists nh_membership boolean not null default false,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists clanice_user_idx on public.clanice (user_id) where user_id is not null;

-- View za javni sajt: odobrene kartice + izračunato da li nosi NH oznaku.
-- Čita se isključivo service-role ključem sa natasahartweger.rs (tabela
-- ionako nema polise za authenticated).
create or replace view public.javne_clanice as
select
  c.id, c.ime, c.brend, c.opis, c.usluge, c.email, c.telefon,
  c.instagram, c.linkedin, c.web, c.foto_url, c.sort_order, c.created_at,
  (c.nh_membership and c.user_id is not null and public.je_aktivna_clanica(c.user_id)) as nh_aktivna
from public.clanice c
where c.status = 'approved';

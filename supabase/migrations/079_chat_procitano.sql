-- Nepročitane poruke u chatu + higijena EXECUTE grantova (advisor 0028/0029).
--
-- chat_procitano: poslednje čitanje po (članica, kanal) - klijent ga upsert-uje
-- pri ulasku u kanal i dok gleda pristigle poruke. RLS: samo svoj red.
--
-- chat_neprocitano(): broj tuđih poruka novijih od poslednjeg čitanja, po
-- kanalu. SECURITY INVOKER - RLS na chat_kanali/chat_poruke važi za pozivaoca,
-- pa funkcija ne otkriva ništa što članica ionako ne vidi (ne-članici vraća
-- prazan skup jer ne vidi nijedan kanal).

create table public.chat_procitano (
  user_id uuid not null references auth.users(id) on delete cascade,
  kanal_id uuid not null references public.chat_kanali(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, kanal_id)
);

alter table public.chat_procitano enable row level security;

create policy chat_procitano_select_own
  on public.chat_procitano for select
  using (auth.uid() = user_id);

-- Upis vezan i za vidljivost kanala (067 obrazac - subquery radi pod RLS-om).
create policy chat_procitano_insert_own
  on public.chat_procitano for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.chat_kanali k where k.id = chat_procitano.kanal_id)
  );

create policy chat_procitano_update_own
  on public.chat_procitano for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.chat_neprocitano()
returns table (kanal_id uuid, broj bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select k.id, count(p.id)
  from public.chat_kanali k
  left join public.chat_poruke p
    on p.kanal_id = k.id
   and p.user_id <> auth.uid()          -- sopstvene poruke nisu "nepročitane"
   and p.created_at > coalesce(
     (select c.last_read_at
        from public.chat_procitano c
       where c.user_id = auth.uid() and c.kanal_id = k.id),
     'epoch'::timestamptz
   )
  group by k.id;
$$;

-- Higijena grantova (Supabase advisor 0028/0029): SECURITY DEFINER funkcije ne
-- smeju biti pozivne kroz /rest/v1/rpc bez potrebe.
-- - je_aktivna_clanica: RLS polise je izvršavaju kao upitivač, pa authenticated
--   MORA zadržati EXECUTE; anon-u ne treba (mogao je da proverava tuđe UUID-e).
-- - chat_poruke_postavi_ime: trigger funkcija - EXECUTE se proverava samo pri
--   CREATE TRIGGER, ne pri okidanju, pa ga niko ne mora imati.
revoke execute on function public.je_aktivna_clanica(uuid) from public, anon;
grant execute on function public.je_aktivna_clanica(uuid) to authenticated, service_role;
revoke execute on function public.chat_poruke_postavi_ime() from public, anon, authenticated;
revoke execute on function public.chat_neprocitano() from public, anon;
grant execute on function public.chat_neprocitano() to authenticated, service_role;

-- Ime u chat porukama se ne veruje klijentu: before insert trigger ga
-- prepisuje iz user_profiles (sprečava lažno predstavljanje kroz konzolu).
-- Fallback na poslato ime samo ako profil ne postoji (ne bi smelo).
create or replace function public.chat_poruke_postavi_ime()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.ime := coalesce(
    nullif((select full_name from public.user_profiles where id = new.user_id), ''),
    new.ime
  );
  return new;
end;
$$;

create trigger chat_poruke_ime
  before insert on public.chat_poruke
  for each row execute function public.chat_poruke_postavi_ime();

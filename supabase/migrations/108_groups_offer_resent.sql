-- Ponovna ponuda nastavka: kad se POSLE prve ponude otvori nova grupa sledećeg nivoa
-- sa istom profesorkom, cron grupe-podsetnik šalje ponudu još jednom (tačno jednom).
alter table groups
  add column if not exists offer_resent_at timestamptz,
  add column if not exists offer_resent_group_id uuid references groups(id);

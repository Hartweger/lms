-- 069: Podsetnik profesorki pred kraj ciklusa grupe.
-- Odluka 21.07.2026: pozive u sledeći nivo šalju profesorke (znaju ko od polaznika
-- planira dalje), a ne admin iz /admin/grupe. Isti obrazac idempotencije kao
-- reminder_sent_at / offer_sent_at (migracija 039): flag se postavlja i kad nema
-- šta da se pošalje, da se grupa ne proverava svaki dan.
alter table public.groups add column if not exists prof_reminder_sent_at timestamptz;

comment on column public.groups.prof_reminder_sent_at is
  'Kada je profesorki poslat podsetnik da pozove svoju grupu u sledeći nivo (cron grupe-podsetnik, 14 dana pre end_date).';

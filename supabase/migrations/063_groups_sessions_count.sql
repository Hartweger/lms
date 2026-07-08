-- 063: tačan broj časova grupe. NULL = default (duration_weeks × broj dana).
-- B2.1/B2.2: 8 nedelja ali 15 časova (poslednja nedelja samo 1 čas) → sessions_count = 15.
-- Poštuju ga computeSessionDates/computeEndDate (LMS) i openTerm/moveTerm/beleške (GAS, polje "sessions").
alter table groups add column if not exists sessions_count integer;
comment on column groups.sessions_count is 'Ukupan broj časova; NULL = duration_weeks × broj dana. B2 nivoi = 15.';

-- 036: Ručni broj zauzetih mesta (prikaz na sajtu) — parity sa starim Google Sheet-om.
-- Kad je postavljen, javni raspored koristi ovaj broj umesto izvedenog iz group_enrollments.
-- NULL = koristi se stvarni broj upisanih (group_enrollments).
ALTER TABLE public.groups ADD COLUMN manual_enrolled INT;

-- Seed: brojevi iz Raspored dashboard-a (06.06.2026) za trenutno otvorene grupe.
UPDATE public.groups SET manual_enrolled = 3 WHERE level = 'A1.1' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 1 WHERE level = 'A1.2' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 0 WHERE level = 'A2.1' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 1 WHERE level = 'A2.2' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 2 WHERE level = 'B1.1' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 4 WHERE level = 'B1.2' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 3 WHERE level = 'B2.1' AND source = 'rucni-unos-2026-06';
UPDATE public.groups SET manual_enrolled = 1 WHERE level = 'B2.2' AND source = 'rucni-unos-2026-06';

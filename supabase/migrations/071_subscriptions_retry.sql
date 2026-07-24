-- 071: ponovno iniciranje pale recurring naplate (potvrda banke 22.07.2026:
-- RECURRINGOPERATION=Update sa STARTDATE, najviše 1x dnevno, ukupno do 30 puta).
-- Brojač važi po naplati: kad padne druga naplata, kreće od nule.
alter table subscriptions add column if not exists retry_oid text;
alter table subscriptions add column if not exists retry_count int not null default 0;
alter table subscriptions add column if not exists last_retry_at timestamptz;
-- Datum (Beograd) za koji je pokušaj zakazan; pre nego što prođe ne šalje se novi
-- Update - ne znamo da li banka posle Update-a odmah vrati TRANS_STAT na PN.
alter table subscriptions add column if not exists retry_planned_for date;

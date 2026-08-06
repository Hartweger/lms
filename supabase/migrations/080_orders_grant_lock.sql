-- 080: Lock protiv duplog granta (dupli klik na „Potvrdi uplatu" poslao welcome mejlove 2x,
-- order 2026-268, 06.08.2026). grantAccessForOrder radi atomični claim preko ove kolone;
-- bajat lock (>10 min, crash usred granta) sme da se preuzme, pa cron ne ostaje blokiran.
alter table orders add column if not exists grant_lock_at timestamptz;

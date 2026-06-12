-- new_customers_only → kupon važi samo za mejlove koji još NEMAJU nijedan video kurs
-- (za NAKI10: postojeći video kupci ne dobijaju i ne mogu da iskoriste kod).
alter table coupons add column if not exists new_customers_only boolean not null default false;

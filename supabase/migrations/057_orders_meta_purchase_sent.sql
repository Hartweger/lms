-- Evidencija da li je Meta Purchase (CAPI) uspešno poslat za porudžbinu.
-- Pre ovoga nije postojao trajan trag o slanju Meta događaja (samo efemerni console.error),
-- pa se nije moglo proveriti poklapanje porudžbina ↔ poslati Purchase. Sada se slanje radi iz
-- jedne tačke (grantAccessForOrder) i rezultat se pamti ovde. false = poslato nije uspelo
-- (ili još nije pokušano) → osnova za budući retry i reviziju.
alter table orders add column if not exists meta_purchase_sent boolean not null default false;

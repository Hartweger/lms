-- 083_orders_storno.sql
-- Storno (refundacioni fiskalni račun) za već fiskalizovanu narudžbinu.
-- Original ostaje u fiscal_* poljima i nikad se ne prepisuje - PURS drži oba dokumenta,
-- prodaju i protivračun, pa ih i mi čuvamo odvojeno.
alter table orders
  add column if not exists refund_referent_number text,
  add column if not exists refund_journal text,
  add column if not exists refund_verification_url text,
  add column if not exists refund_pdf_url text,
  add column if not exists refund_response jsonb,
  add column if not exists refunded_at timestamptz;

comment on column orders.refund_referent_number is 'PFR broj storno računa (Fiscomm /invoices/normal/refund)';
comment on column orders.refunded_at is 'Kad je izdat storno račun. Ne znači da je novac vraćen - povraćaj ide kroz banku.';

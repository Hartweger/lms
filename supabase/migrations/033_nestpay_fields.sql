-- 033_nestpay_fields.sql — NestPay kartično plaćanje
alter table orders
  add column if not exists nestpay_trans_id text,
  add column if not exists nestpay_status text,          -- 'charged' | 'failed' | 'reserved'
  add column if not exists nestpay_response jsonb;

-- index za reconciliation (pending kartične narudžbine)
create index if not exists idx_orders_pending_card
  on orders (payment_status, created_at)
  where payment_method in ('kartica', 'kartica_rate');

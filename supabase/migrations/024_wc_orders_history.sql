-- WooCommerce historical orders for revenue dashboard
create table if not exists wc_orders (
  id serial primary key,
  wc_order_id int not null unique,
  status text not null,
  currency text not null default 'RSD',
  total numeric(10,2) not null,
  discount_total numeric(10,2) not null default 0,
  payment_method text,
  payment_method_title text,
  customer_email text,
  customer_name text,
  country text,
  items jsonb,
  date_created timestamptz not null,
  date_completed timestamptz
);

create index idx_wc_orders_date on wc_orders(date_created);
create index idx_wc_orders_status on wc_orders(status);

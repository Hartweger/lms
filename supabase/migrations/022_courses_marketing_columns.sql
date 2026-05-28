-- Add marketing-related columns to courses table
alter table courses
  add column marketing_description text,
  add column features jsonb,
  add column category text,
  add column is_purchasable boolean not null default false,
  add column paypal_price_eur int,
  add column old_wc_product_id int;

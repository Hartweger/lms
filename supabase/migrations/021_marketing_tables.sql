-- FAQ items for marketing pages
create table faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'opsti',
  order_index int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table faq_items enable row level security;

create policy "Anyone can read published FAQ items"
  on faq_items for select
  using (is_published = true);

create policy "Admins can do anything with FAQ items"
  on faq_items for all
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

-- Blog posts
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  excerpt text,
  thumbnail_url text,
  meta_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_posts enable row level security;

create policy "Anyone can read published blog posts"
  on blog_posts for select
  using (is_published = true);

create policy "Admins can do anything with blog posts"
  on blog_posts for all
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  email text not null,
  full_name text not null,
  phone text,
  country text not null default 'RS',
  items jsonb not null,
  subtotal int not null,
  discount int not null default 0,
  total int not null,
  coupon_code text,
  payment_method text not null,
  payment_status text not null default 'pending',
  nestpay_transaction_id text,
  paypal_note text,
  fiscomm_invoice_id text,
  granted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

create policy "Users can read own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Admins can do anything with orders"
  on orders for all
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

-- Coupons
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null,
  amount numeric not null,
  min_order int,
  max_uses int,
  usage_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

create policy "Anyone can read active coupons"
  on coupons for select
  using (is_active = true);

create policy "Admins can do anything with coupons"
  on coupons for all
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

-- Product variants (course pricing options)
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  professor_id uuid references user_profiles(id),
  package_type text,
  price int not null,
  paypal_price_eur int,
  is_active boolean not null default true
);

alter table product_variants enable row level security;

create policy "Anyone can read active product variants"
  on product_variants for select
  using (is_active = true);

create policy "Admins can do anything with product variants"
  on product_variants for all
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

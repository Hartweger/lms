-- 065: Deljeni rate limiter u bazi (audit jul 2026).
-- In-memory Map u src/lib/rate-limit.ts se resetuje na svaki cold start i ne
-- deli se između lambdi, pa je limit bio lako zaobilaziv. Ova tabela + RPC su
-- autoritativni brojač; JS pada nazad na Map samo ako RPC zakaže.
-- Fiksni prozor: prvi pogodak postavlja reset_at, pogoci posle max se i dalje
-- broje ali ne produžavaju prozor.

create table if not exists rate_limits (
  key text primary key,
  count int not null default 1,
  reset_at timestamptz not null
);

-- ensure_rls trigger ionako uključuje RLS na nove tabele; eksplicitno radi jasnoće.
alter table rate_limits enable row level security;
-- Bez ijedne politike: samo service_role (zaobilazi RLS) sme da čita/piše.

create index if not exists rate_limits_reset_at_idx on rate_limits (reset_at);

create or replace function rate_limit_hit(p_key text, p_max int, p_window_ms int)
returns table (allowed boolean, remaining int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count int;
begin
  -- Povremeno počisti davno istekle ključeve (tabela ostaje mala).
  if random() < 0.01 then
    delete from rate_limits rl where rl.reset_at < v_now - interval '1 day';
  end if;

  insert into rate_limits as rl (key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  on conflict (key) do update
    set count = case when rl.reset_at <= v_now then 1 else rl.count + 1 end,
        reset_at = case when rl.reset_at <= v_now
                        then v_now + make_interval(secs => p_window_ms / 1000.0)
                        else rl.reset_at end
  returning rl.count into v_count;

  return query select v_count <= p_max, greatest(p_max - v_count, 0);
end;
$$;

-- Samo backend sme da zove (isti princip kao revoke iz jula za get_course_dropoff itd.)
revoke execute on function rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function rate_limit_hit(text, int, int) to service_role;

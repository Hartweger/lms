-- 106: povraćaj preplate profesorke se vodi kao NEGATIVNA isplata u professor_payments
-- (npr. Suzana vratila 100.000 u avgustu 2026). Ranije CHECK (amount > 0). Nula ostaje zabranjena.
-- Primenjeno na produkciju 04.09.2026 kroz Supabase MCP (apply_migration professor_payments_allow_refund).
alter table public.professor_payments drop constraint professor_payments_amount_check;
alter table public.professor_payments add constraint professor_payments_amount_check check (amount <> 0);

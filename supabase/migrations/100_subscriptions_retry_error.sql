-- 100_subscriptions_retry_error.sql
-- Razlog zbog kog banka nije prihvatila ponovno iniciranje pale naplate.
--
-- Do 25.08.2026. taj odgovor je išao SAMO u Sentry, pa je pala naplata Sonje
-- Kricak (serija 26205TpyJ29844, rata 2 odbijena 24.08) bila potpuno nevidljiva:
-- jutarnji pregled prijavljuje pale naplate po `retry_oid`, a on se upisivao tek
-- kad banka prihvati pomeranje. Sad se upisuje uvek, a ovde stoji zašto je odbijeno.
alter table subscriptions add column if not exists last_retry_error text;

comment on column subscriptions.last_retry_error is
  'Sirov odgovor banke na odbijen RECURRINGOPERATION=Update (skraćen). NULL kad je poslednji pokušaj prihvaćen.';

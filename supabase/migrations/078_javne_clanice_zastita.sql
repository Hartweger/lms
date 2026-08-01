-- BEZBEDNOSNA ISPRAVKA (nalaz finalne revizije faze 2, 1.8.2026):
-- javne_clanice je prost view nad jednom tabelom pa je auto-updatable, radi
-- sa pravima vlasnika (bez security_invoker) i podrazumevano je dobio pun
-- DML grant za anon/authenticated - anon ključ iz frontenda je mogao da
-- menja i briše kartice, zaobilazeći činjenicu da clanice nema RLS polisa.
-- View čita isključivo sajt sa service_role ključem, pa se svi grantovi
-- za anon/authenticated ukidaju.
revoke all on public.javne_clanice from anon, authenticated;

-- Uz to: jedinstvenost user_id na clanice (duplo slanje opt-in zahteva ne
-- sme da napravi dve kartice iste članice; organske kartice imaju NULL).
create unique index if not exists clanice_user_unique
  on public.clanice (user_id) where user_id is not null;

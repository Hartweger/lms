-- Bezbednost (audit jul 2026): anon je mogao da izlista SVE aktivne kupon kodove
-- (GET /rest/v1/coupons sa anon ključem) i iskoristi popuste koje ne bi smeo da vidi.
-- Validacija i primena kupona idu isključivo server-side preko service_role
-- (api/coupons/validate, api/orders, api/admin/coupons, admin/kuponi) - provereno
-- da NIJEDAN klijentski kod ne čita coupons direktno. Admin policy ostaje.
drop policy if exists "Anyone can read active coupons" on coupons;

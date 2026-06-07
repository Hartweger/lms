# Plan slanja notifikacije migriranim korisnicima (bez duplikata)

**Datum:** 2026-06-07
**Cilj:** Obavestiti migrirane korisnike (aktivan pristup, ~594) da im je kurs sada na kurs.hartweger.rs i da je platforma bolja — **bez ponavljanja onima kojima smo već poslali** „selidba" mejl.

**Mehanizam (već napravljen):** `scripts/send-platform-notification.ts` + kolona `migration_notified_at` (migracija `036_migration_notified.sql`). Šablon mejla odobren (logo, plavo dugme, „kurs je postao bolji"). Magic-link login radi i brendiran je.

## Garancija „ne dupliraj"
Tri sloja:
1. **Kolona `migration_notified_at`** na `user_profiles` — ko je obavešten ima datum; šalje se samo `WHERE migration_notified_at IS NULL`.
2. **Backfill iz Resend loga** — pre prvog slanja, `--backfill` povuče istoriju i markira sve koji su već dobili „selidba/nova platforma" mejl (A1 batch 27.05 ~103 + poznati setovi) kao obaveštene → preskaču se.
3. **Markiranje u hodu** — svaki poslat se odmah obeleži; prekid/restart ne pravi duplikate (resumable).

## Šta računamo kao „već poslato" (odluka)
- ✅ **Računa se** (preskoči): mejlovi o SELIDBI / novoj platformi — subject sadrži „na novoj platformi", „preselila", „kurs je postao bolji". To je 27.05 A1 batch.
- ❌ **NE računa se** (ti ljudi DOBIJAJU novu najavu): „Podsetnik: tvoj Gramatika kurs te čeka" (engagement, ne selidba), „Dobrodošli", magic-link, plan učenja. Oni nisu dobili „preselili smo se" poruku.
- (Ako želiš drugačije — npr. da i Gramatika-podsetnik ljudi budu preskočeni — menja se jedna regex linija `MIGRATION_SUBJECTS` u skripti.)

## Runbook (koraci)
1. **Primeni SQL** `036_migration_notified.sql` u Supabase SQL Editoru (kolona). *(jednom)*
2. **Backfill — DRY:** `npx tsx scripts/send-platform-notification.ts --backfill`
   → ispiše koliko je „selidba" primalaca našao u Resend logu. **Proveri da broj ima smisla (~103+).**
3. **Backfill — WRITE:** `... --backfill --write` → markira ih kao obaveštene.
4. **Pregled publike — DRY:** `npx tsx scripts/send-platform-notification.ts`
   → „Publika (aktivan pristup, NIJE obavešten): N" + uzorak. Ovo je ko će dobiti.
5. **Slanje — po grupi:** `... --send` → pošalje sledećih do **100** (besplatni Resend limit/dan), markira svakog. Ponavljaj **dnevno** dok N ne padne na 0 (~594 − već poslati → ~5–6 dana).
   - Brže: nadogradi Resend plan (više od 100/dan), pa pusti više puta.

## Bezbednost / provere
- **Dry-run je podrazumevan** — ništa se ne šalje bez `--send`.
- **Port-later** (Deklinacija 64 + Gramatika 23) su automatski izostavljeni (nemaju aktivan `course_access`).
- Posle backfill-a, pre prvog `--send`, spot-proveri par „već poslatih" da imaju `migration_notified_at` postavljen.
- Resend ima rate-limit — backfill povlači log sa pauzama/retry; ako padne, samo ponovi (idempotentno).

## Timing (odluka)
- Plan migracije domena kaže „mejlovi NA KRAJU" (po flip-u). 
- ALI: kurs.hartweger.rs je živ, pristup migriran, pravi kupci se već prijavljuju → mejl je funkcionalan i sad.
- Odluka je tvoja: pokreni runbook kad kažeš „idi" (može i pre flip-a, svesno).

## Otvoreno
- Potvrditi „dedup scope" (gore) — da li i Gramatika-podsetnik ljudi ulaze u slanje (default: DA, dobijaju).
- Potvrditi timing (sad vs po flip-u).

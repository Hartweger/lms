# CRM za lidove i komunikaciju — dizajn (v1)

**Datum:** 2026-06-13
**Status:** odobren dizajn, čeka plan implementacije
**Lokacija:** `hartweger.rs/admin/crm` (ugrađen modul u postojeću platformu, deli Supabase bazu)

## Problem

Upiti i lidovi su rasuti i delom se gube:
- **Kontakt forma** (`api/kontakt`) — samo pošalje mejl na info@, ništa se ne čuva.
- **Smile** (`api/naki/sales/lead`) — lid ide u Resend Audience + welcome mejl, ali se **razgovor ne pamti**.
- **NaKI** — `naki_profiles` (mejl, nivo, slabe/jake oblasti), ali odvojeno.
- **Masterclass** — `masterclass_signups`, odvojeno.
- **Instagram/WhatsApp (ManyChat)** — potpuno spolja.
- **Direktan mejl na info@** — u Gmail inboxu, nije strukturiran.

Nema jednog mesta gde se vidi ko je ko, šta je pitao, dokle se stiglo i kome treba odgovoriti. Posledica: izgubljena prodaja. Glavni cilj v1: **nijedan upit ne propadne i možeš sistematski da ispratiš svakog dok ne kupi ili jasno odustane.**

## Odluka o pristupu

Ugrađen modul na postojećoj platformi (`/admin/crm`), deli istu Supabase bazu sa LMS-om. Ključ: **lid i polaznik su isti zapis** kroz ceo životni ciklus, spojeni preko mejla/`user_id`. Odbačeno: zaseban subdomen (samo duplo održavanje za solo korisnika) i gotov CRM (Zoho/HubSpot — odsečen od LMS-a, duplira podatke). ClickUp odbačen jer je task/projekt menadžment, ne CRM.

UI referenca: HubSpot „contact timeline" — jedan kontakt = vertikalna istorija svih interakcija.

Korisnik: **samo admin (Nataša).** Bez uloga i dozvola.

## Model podataka

Dve nove tabele. Postojeće tabele (`user_profiles`, `course_access`, `individual_enrollments`, `group_enrollments`, finansije) se samo **čitaju**, ne diraju.

### `crm_contacts` — jedan red = jedna osoba (lid ILI polaznik)

| polje | tip | opis |
|---|---|---|
| `id` | uuid pk | |
| `email` | text | ključ za spajanje/dedup (lowercase, normalizovan) |
| `name` | text | |
| `phone` | text | |
| `instagram_handle` | text | rezervni ključ za spajanje |
| `user_id` | uuid → auth.users | popunjeno ako se osoba registrovala; spaja lida i polaznika |
| `stage` | text | `nov` → `kontaktiran` → `zainteresovan` → `ponuda` → `upisan` → `izgubljen` |
| `source` | text | `naki`, `smile`, `kontakt-forma`, `masterclass`, `manychat`, `instagram`, `whatsapp`, `rucno` |
| `level` | text | A1/A2/B1… (ako poznat) |
| `tags` | text[] | |
| `note` | text | slobodna beleška |
| `owner` | text | uvek Nataša u v1, ostaje polje za budućnost |
| `next_action` | text | sledeći korak, npr. „poslati ponudu za B1" |
| `next_action_at` | timestamptz | datum podsetnika — gura panel „Za danas" |
| `last_interaction_at` | timestamptz | |
| `created_at` | timestamptz | |

- `email` ima unique indeks (case-insensitive) radi deduplikacije.
- `stage`, `source`, `next_action_at` indeksirani (filteri + panel „Za danas").

### `crm_interactions` — timeline, jedan red = jedan događaj

| polje | tip | opis |
|---|---|---|
| `id` | uuid pk | |
| `contact_id` | uuid → crm_contacts (on delete cascade) | |
| `channel` | text | `mejl`, `naki`, `smile`, `manychat`, `instagram`, `whatsapp`, `beleska`, `sistem` |
| `direction` | text | `dolazna`, `odlazna`, `interna` |
| `summary` | text | kratak opis za listu |
| `body` | text | puna poruka/prepiska |
| `occurred_at` | timestamptz | |
| `meta` | jsonb | npr. `session_id`, detektovan nivo, message id |
| `created_at` | timestamptz | |

- Indeks na `(contact_id, occurred_at desc)`.

### RLS

Kao kod `naki`/`masterclass`: tabele sa `enable row level security`, **bez anon/authenticated policy** — sav upis ide preko service-role iz API ruta; čitanje u adminu ide kroz admin auth (service-role ili admin-only SELECT policy po uzoru na postojeći obrazac „Admins can read all").

## Ulaz podataka (ingest)

Centralna logika: helper `upsertContact({email, name, phone, instagram, source, level})` koji radi **dedup** (spoji po `email`, pa po `instagram_handle`; ako nema mejla, kreira nov) + `logInteraction({contact_id, channel, direction, summary, body, meta})`. Svaki ulaz ažurira `last_interaction_at`; novi kontakt dobija `stage='nov'`.

### Automatski (već prolaze kroz naš API)
- **Kontakt forma** — `api/kontakt`: pored slanja mejla, `upsertContact` (source `kontakt-forma`) + `logInteraction` (channel `mejl`, dolazna, body = poruka iz forme).
- **Smile** — `api/naki/sales/lead`: `upsertContact` (source `smile`) + upiši razgovor u timeline.
- **NaKI** — kači se na postojeći `naki_profiles`/`naki_messages` (mejl-capture → kontakt; razgovor → interakcije). Po potrebi backfill postojećih profila.
- **Masterclass** — `masterclass_signups` → kontakt (source `masterclass`).

### ManyChat (Instagram/WhatsApp)
- Nova ruta `api/crm/ingest` (POST, zaštićena deljenim tajnim tokenom u headeru).
- U ManyChat-u dodati korak u flow-u (External Request) koji šalje: `name`, `instagram_handle`/telefon, `email` (ako je dat), `message`, `tag`, `channel` (`instagram`/`whatsapp`).
- Ruta poziva `upsertContact` + `logInteraction`.

### Direktan mejl na info@ (Gmail)
- **v1: ručno** — dugme „Novi kontakt" u adminu (zalepi mejl/poruku) ILI lagani Resend-inbound webhook ka `api/crm/ingest` ako se postavi prosleđivanje.
- Gmail auto-sync (cron koji čita info@) = **v2**, ako se pokaže da puno upita ide direktno.

## UI

### `/admin/crm` — glavni ekran
- Uklapa se u postojeći `/admin` layout i auth.
- Panel **„Za danas"** na vrhu: kontakti kojima je `next_action_at <= danas` + novi lidovi (`stage='nov'`) bez odgovora. Radni spisak za jutro.
- **Tabela kontakata** sa brzim filterima: faza, izvor, nivo; pretraga po imenu/mejlu. Faza se menja inline iz tabele.
- Dugme **„Novi kontakt"** (ručni unos).
- Kanban tabla — **van opsega v1** (filtrirana tabela je dovoljna za solo rad).

### `/admin/crm/[id]` — profil kontakta (HubSpot timeline)
- Zaglavlje: ime, mejl, telefon, IG, **faza** (menja se), izvor, nivo, tagovi.
- **„Sledeći korak"**: `next_action` + `next_action_at` (editabilno).
- **Timeline**: sve `crm_interactions` hronološki.
- **Akcije v1**: „Pošalji mejl" (Resend, slobodan tekst + potpis „Hartweger tim"; poslati mejl se upisuje kao odlazna interakcija), „Dodaj belešku", promena faze.
- **Panel „Kao polaznik"**: ako postoji `user_id` — kursevi, pristup, datum isteka, šta je platio (čita iz postojećih tabela, ništa se ne duplira).

## Van opsega v1 (YAGNI) → v2

- Šabloni ponude + automatsko kačenje kupona (postoji kupon sistem).
- Razlog gubitka (padajući meni „zašto" na `izgubljen`).
- Gmail auto-sync (cron čita info@).
- Kanban tabla.
- Uloge/dozvole, interni zadaci/tim, automatske mejl-sekvence (drip) — namerno nikad ovde (MailerLite/Resend pokrivaju masovno).

## Koristimo postojeće

- Admin layout + auth (`app/admin/layout.tsx`).
- Supabase service-role obrazac iz `api` ruta; RLS po uzoru na `naki`/`masterclass`.
- Resend za slanje mejla (`kurs@`/`natasa@`, potpis „Hartweger tim").
- Migracije: sledeći broj u nizu (poslednja `054`/`20260605_*`) — npr. `055_crm.sql`.

## Testovi (vitest, već postoji)

- `upsertContact` dedup: isti mejl → jedan kontakt; spajanje po `instagram_handle`; bez mejla → nov kontakt.
- `logInteraction` ažurira `last_interaction_at`.
- Ingest rute: validacija payload-a, token zaštita za `api/crm/ingest`.
- RLS: anon/authenticated ne mogu da čitaju `crm_contacts`/`crm_interactions`.

## Rizik

Najveći rizik nije tehnički nego navika korišćenja. Zato je v1 namerno mali i centriran oko panela „Za danas" — najmanja verzija koju će Nataša otvarati svaki dan. Ostalo (v2) tek kad se navika dokaže.

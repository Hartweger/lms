# Schreiben pregled + obaveštavanje — dizajn

**Datum:** 2026-06-13
**Status:** Odobravanje dizajna

## Problem

Sistem za pregled Schreiben (pismenih vežbi) je strukturno kompletan, ali deluje
„mrtvo" jer nijedan korak ne šalje obaveštenje. Konkretno:

1. Kad učenik pošalje Schreiben, profesor ne dobija nikakav mejl — esej samo stoji
   u statusu `pending` dok prof ručno ne otvori `/profesor/eseji`.
2. Kad profesor objavi feedback, učenik ne dobija mejl — mora sam da se vrati u
   lekciju da bi video da je gotovo.
3. **Najveća rupa:** eseji iz video/samostalnih kurseva koji **nemaju dodeljenog
   profesora** ne ulaze ni u čiji rezime — ne postoji red u `professor_students`,
   pa se grupišu „ni pod koga" i potpuno propadnu.

Željeni tok je: učenik pošalje → **AI prvo pregleda** (već radi) → **profesor dobije
mejl i pregleda još jednom** → **feedback ode učeniku mejlom**.

## Trenutno stanje (šta već radi)

- **Učenik pošalje** ([EssayExercise.tsx]): poziva `/api/check-essay`, AI (Claude
  Haiku) odmah upiše `ai_feedback`, `ai_corrections`, `ai_score`; upis u
  `essay_submissions` sa `status='pending'`.
- **AI pregled** ([api/check-essay/route.ts]): radi, nivo-svestan, max 3 ispravke.
- **Profesor pregleda** ([profesor/eseji/page.tsx]): vidi samo svoje učenike (join
  preko `professor_students`), doda komentar + ocenu, „Objavi studentu".
- **Admin pregleda** ([admin/eseji/page.tsx]): vidi sve eseje.
- **Učenik vidi feedback** kad `status='published'` (ali bez obaveštenja).

## Šema baze (relevantno)

- `essay_submissions`: `user_id` (učenik, FK auth.users), `lesson_id` (FK lessons),
  `ai_feedback/ai_corrections/ai_score`, `professor_feedback`, `professor_score`,
  `status` (`pending|reviewed|published`), `submitted_at`. **Nema direktnog
  `course_id`** — kurs se izvodi iz `lesson_id → lessons → (modul) → course`.
- `professor_students`: `professor_id`, `student_id`, `course_id`, `assigned_via`.
  „Bez profa" = ne postoji red za (student_id, course_id).

## Odluke (potvrđene sa korisnikom)

- Profesor se obaveštava **dnevnim rezimeom** (ne odmah po svakom eseju).
- Eseji **bez dodeljenog profa** idu **adminu (Nataši)** kao zaseban dnevni rezime;
  ona je fallback recenzent, pregleda ih na `/admin/eseji`.
- **Osigurač:** eseji koji čekaju **3+ dana** ističu se adminu u postojećem
  `jutarnji-pregled` mejlu.
- Mejl učeniku ide preko **API rute** (opcija A), tako da upis statusa i slanje
  mejla idu zajedno.

## Arhitektura

Tri celine, sve oslonjene na postojeću infrastrukturu (Resend, cron, `email.ts`).

### Deo 1 — Dnevni rezime za pregled (novi cron)

**Ruta:** `/api/cron/eseji-pregled` (obrazac kao postojeći `/api/cron/review-request`).

Logika:
1. Učitaj sve `essay_submissions` sa `status='pending'`, sa pratećim podacima:
   učenik (ime, mejl), nivo/lekcija, `submitted_at`.
2. Za svaki esej odredi kurs preko `lesson_id` i potraži red u
   `professor_students(student_id, course_id)`.
3. Podeli u dve grupe:
   - **Ima profa** → grupiši po `professor_id`. Svakom profu sa ≥1 pending eseja
     pošalji `sendPendingEssaysDigest(professor, essays[])` — mejl „Imaš N
     Schreiben-a za pregled" + spisak (učenik, nivo, kad poslat) + dugme ka
     `/profesor/eseji`.
   - **Nema profa** → jedan zbirni mejl adminu (Nataša): „N Schreiben-a bez
     profesora čeka pregled" + spisak + dugme ka `/admin/eseji`.
4. Ko nema nijedan pending esej — ne dobija mejl.

**Učestalost:** jednom dnevno. (Napomena: Vercel Hobby plan = cron 1x dnevno —
vidi memoriju o kartica-recovery; ovo se uklapa.)

### Deo 2 — Mejl učeniku kad se objavi feedback (nova API ruta)

**Ruta:** `POST /api/essays/publish` (server-side, ima pristup Resend ključu).

Telo: `{ essayId, professorFeedback, professorScore }`.

Logika:
1. Autorizacija: pozivalac mora biti `admin` ili `professor` (kao postojeće RLS
   pravilo na update-u).
2. Upiši `professor_feedback`, `professor_score`, `status='published'`,
   `reviewed_at=now()`.
3. Učitaj učenikov mejl + ime + naslov lekcije.
4. Pošalji `sendEssayFeedbackEmail(student, essay)` — „Profesor je pregledao tvoj
   Schreiben" + ocena (1–5 sa opisom) + komentar + dugme ka lekciji.
5. Vrati uspeh; ako mejl padne, upis je već prošao — logujemo grešku ali ne rušimo
   objavu (mejl je „best effort", esej je objavljen).

**Izmena klijenta:** `profesor/eseji/page.tsx` i `admin/eseji/page.tsx` — funkcija
`publishEssay` umesto direktnog `supabase.from(...).update(...)` zove novu rutu.

### Deo 3 — Osigurač u jutarnjem pregledu

**Izmena:** `/api/cron/jutarnji-pregled` (postojeći dnevni admin mejl).

Dodaj sekciju **„Schreiben-i koji čekaju 3+ dana"**: svi `pending` eseji gde je
`submitted_at < now() - 3 dana`, sa: učenik, profesor (ili „bez profa"), koliko
dugo stoji. Ako nema takvih — sekcija se ne prikazuje.

## Nove/izmenjene funkcije

| Funkcija / fajl | Tip | Opis |
|---|---|---|
| `sendPendingEssaysDigest(recipient, essays[])` u [email.ts] | nova | Dnevni rezime profu ili adminu |
| `sendEssayFeedbackEmail(student, essay)` u [email.ts] | nova | Učeniku kad se objavi feedback |
| `/api/cron/eseji-pregled` | nova ruta | Deo 1 |
| `/api/essays/publish` | nova ruta | Deo 2 |
| `publishEssay` u `profesor/eseji` i `admin/eseji` | izmena | Zove novu rutu |
| `/api/cron/jutarnji-pregled` | izmena | Deo 3 sekcija |
| `vercel.json` crons | izmena | Dodaj `eseji-pregled` raspored |

## Tok podataka (end-to-end, posle izmene)

```
Učenik pošalje Schreiben
   → /api/check-essay (AI pregled)            [već radi]
   → upis essay_submissions, status=pending   [već radi]

[dnevno] /api/cron/eseji-pregled
   → ima profa?  → mejl profu (digest)
   → nema profa? → mejl adminu (digest)

Profesor/Admin otvori /profesor/eseji ili /admin/eseji
   → pregleda, klikne „Objavi studentu"
   → POST /api/essays/publish
        → status=published + mejl učeniku

[dnevno] /api/cron/jutarnji-pregled
   → sekcija: eseji 3+ dana nepregledani → adminu
```

## Obrada grešaka

- **Mejl padne u cron-u:** loguj i nastavi sa sledećim primaocem; jedan pad ne ruši
  ceo cron.
- **Mejl padne u `/api/essays/publish`:** upis je prioritet — objava prolazi, mejl
  je best-effort, greška se loguje (Sentry).
- **Esej bez kursa/lekcije (orphan):** ako se kurs ne može odrediti, tretira se kao
  „bez profa" → ide adminu (da ne propadne).
- **Resend kvota (100/dan besplatno):** digest grupiše po primaocu (1 mejl po profu,
  ne po eseju), pa je broj mejlova mali; svejedno logovati ako Resend vrati limit.

## Testiranje

- Dnevni rezime: seed pending eseja sa profom / bez profa → proveri da prof dobije
  samo svoje, admin dobije „bez profa", a prof bez eseja ne dobije ništa.
- Publish ruta: poziv kao prof/admin → status=published + mejl; poziv kao učenik →
  403.
- Osigurač: esej star 3+ dana → pojavi se u jutarnjem pregledu; mlađi → ne.
- Smoke test posle deploya (obavezno, po pravilu projekta): gađa relevantne rute.

## Van obima (YAGNI za sad)

- Honorar za pregled eseja (prof plaćanje po eseju) — nije traženo.
- Realtime osvežavanje profesorske stranice.
- Trenutni (per-esej) mejl profu — odlučeno za dnevni rezime.
- Auto-objava AI feedbacka bez ljudske provere — odbijeno (kontrola kvaliteta).

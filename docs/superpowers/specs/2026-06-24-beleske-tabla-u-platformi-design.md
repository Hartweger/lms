# Beleške sa časa u platformi (live tekstualna tabla) — dizajn

**Datum:** 2026-06-24
**Status:** Predlog, čeka pregled

## Problem

Beleške sa časova su trenutno Google Docs koje se dele po mejlu polaznika (domen `hartweger.rs` blokira „svako sa linkom", pa se deli `addViewer(email)` preko Apps Script-a). Posledica: polaznici stalno dobijaju „traži pristup" petlju, profesor mora ručno da deli, sve je van platforme.

Dodatno: profesor tokom **Meet časa** koristi beleške kao **belu tablu uživo** — piše dok predaje, a polaznici gledaju kako tekst nastaje.

Cilj: beleške žive u samoj platformi. Profesor piše (uživo tokom časa), polaznik vidi odmah (već je ulogovan), uz automatski datum časa i ime profesora. Polaznik može da skine beleške kao PDF. Google Docs se gasi za ovu svrhu.

## Odluke (potvrđene sa korisnikom)

- **Struktura:** zasebna beleška po času; polaznik može da vidi i sve zajedno na jednoj stranici.
- **Ko piše:** samo profesor piše, polaznik čita (read-only). Lične beleške polaznika su faza 2.
- **Uživo:** da — live tekstualna tabla tokom časa (profesor kuca, polaznici gledaju u realnom vremenu). Ovo je srž, ne ukras.
- **Tip table:** tekstualna (reči, rečenice, konjugacije, liste, markiranje u boji). Bez crtanja/dijagrama (faza 2 ako zatreba).
- **Format:** rich text — bold, kurziv, liste (tačke/brojevi), mali naslovi, linkovi, marker u boji (highlight). Bez slika i tabela.
- **Obuhvat:** i individualni (1:1) i grupni časovi odmah.
- **Skidanje:** PDF — i po jednom času i „ceo kurs" (sve spojeno u jedan fajl, zaglavlje sa datumom i imenom profesora).
- **Trajnost / brisanje:** beleška se **automatski briše 6 meseci posle datuma svog časa** (potpuno iz baze). Do tada je dostupna i posle isteka pristupa kursu (gledanje + skidanje). Polaznik dobija **mejl upozorenje ~15 dana pre brisanja** sa pozivom da skine PDF.
- **Migracija:** krećemo „od danas". Stari Google Docs ostaju netaknuti i dalje deljeni po mejlu; uvoz starih je faza 2.
- **Obaveštenja:** bez mejla po objavi beleške (faza 2 ako zatreba).

## Arhitektura

### Model podataka — nova tabela `class_notes`

Jedna beleška = jedan čas. Vezuje se ili za individualni čas ili za grupnu sesiju (tačno jedno).

```sql
class_notes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_lesson_id UUID NULL REFERENCES individual_lessons(id) ON DELETE CASCADE,
  group_session_id     UUID NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  professor_id         UUID NOT NULL REFERENCES user_profiles(id),
  content              JSONB NOT NULL DEFAULT '{}'::jsonb,  -- struktura iz Tiptap editora
  content_text         TEXT,                                -- plain-text ogledalo (za PDF fallback / kasniju pretragu)
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_target CHECK (
    (individual_lesson_id IS NOT NULL) <> (group_session_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX class_notes_individual_uq ON class_notes(individual_lesson_id)
  WHERE individual_lesson_id IS NOT NULL;
CREATE UNIQUE INDEX class_notes_group_uq ON class_notes(group_session_id)
  WHERE group_session_id IS NOT NULL;
```

- Datum i ime profesora se ne kucaju — čitaju se iz vezanog časa (`individual_lessons.lesson_date`) odn. sesije (`group_sessions.session_date`) i `user_profiles.full_name`.
- Jedna beleška po času (jedinstveni indeksi).

### Tok — profesor

- Na `/profesor/individualni` (po upisu) i `/profesor/sesije` (po grupi): dugme „Beleške za današnji čas".
- Klik → ako za danas ne postoji zapis održanog časa (`individual_lessons` / `group_sessions`), automatski se kreira, pa se kreira/otvara `class_notes` i pokreće editor. Time se datum i brojač časova/honorar sami poklapaju sa postojećom logikom.
- **Datum:** podrazumevano današnji (ne kuca se ručno; dolazi iz zapisa časa). Profesor može da ga promeni ako piše belešku naknadno ili je čas bio drugog dana — izmena datuma pomera/povezuje belešku sa odgovarajućim zapisom časa.
- **Ime profesora** se ne kuca — čita se iz njegovog naloga.
- Editor: **Tiptap** sa ekstenzijama za bold, italic, bullet/ordered list, heading (mali nivoi), link, highlight (boja markera). Responsivan toolbar (telefon/tablet).
- **Snimanje + live:**
  - Dok profesor kuca, promene se emituju preko **Supabase Realtime broadcast** kanala `class-notes:<noteId>` (niska latencija, glatko kao tabla).
  - Paralelno, debounce ~2s → `PATCH /api/profesor/class-notes` upisuje `content` (+ `content_text`) u bazu (trajnost + PDF).
- **Jedan aktivni editor po času:** soft-lock preko heartbeat-a (`updated_at` / presence na kanalu). Ako profesor otvori isti čas na drugom uređaju/kartici → upozorenje da ne pregazi tekst.
- **Otpornost:** lokalni nacrt u `localStorage` po `noteId`; ako veza padne, autosave se ponavlja po povratku.

### Tok — polaznik (read-only)

- Nov tab „Beleške" na kursu/dashboardu.
  - Individualni: liste beleški za njegov `individual_enrollment`.
  - Grupni: liste beleški za njegovu grupu (uklj. onog ko se upiše kasnije — vidi i ranije beleške).
- Lista: „19.06. — <prvih par reči/naslov>", ime profesora; klik otvara belešku. Gore dugme „prikaži sve" → ceo kurs na jednoj stranici (scroll).
- **Uživo:** dok je beleška otvorena, polaznik je pretplaćen na `class-notes:<noteId>` broadcast i vidi promene kako profesor kuca. Render je miran (bez skoka scroll-a).
- **Reconnect / kasni dolazak:** prvo se povuče poslednje stanje iz baze (`GET`), pa se nastavi praćenje broadcast-a.

### Skidanje (PDF)

- „Skini ovaj čas" na svakoj belešci + „Skini ceo kurs" (sve beleške spojene, hronološki, sa zaglavljem datum + profesor).
- `GET /api/notes/export?scope=individual|group&id=<enrollmentId|groupId>&note=<noteId?>` → renderuje JSON → HTML → PDF.
- Render „JSON → prikaz" je zajednička komponenta (koristi se i za viewer i za PDF) da prikaz bude identičan.
- Beleške su dostupne i posle isteka pristupa kursu (gledanje + skidanje), sve do automatskog brisanja 6 meseci posle datuma časa (vidi „Brisanje / čišćenje").

### Brisanje / čišćenje (retencija 6 meseci)

- Dnevni cron briše `class_notes` čiji je datum vezanog časa (`individual_lessons.lesson_date` / `group_sessions.session_date`) stariji od 6 meseci — **potpuno brisanje iz baze** (i za polaznika i za profesora/admina).
- Dnevni cron šalje **mejl upozorenje ~15 dana pre brisanja** polazniku(ima) na koje se beleška odnosi: „beleške sa časa <datum> se brišu uskoro — skini PDF". Reuse postojeće cron + Resend infrastrukture (kao istek pristupa / schreiben / review-request). Idempotentno (ne šalje dvaput za istu belešku).

### Bezbednost (RLS)

- `class_notes` SELECT:
  - profesor/admin: sve (ili svoje).
  - student: belešku sme da čita ako pripada njegovom individualnom upisu, **ili** grupi u kojoj je (ili je bio) upisan. Politika proverava postojanje upisa, **ne** istek pristupa → beleška ostaje dostupna i posle isteka, sve do automatskog brisanja (6 meseci).
- `class_notes` INSERT/UPDATE/DELETE: samo profesor/admin.
- Sadržaj se renderuje iz strukturisanog JSON-a u React čvorove (kao postojeći `render-rich`), bez `dangerouslySetInnerHTML` → nema XSS.
- Realtime broadcast kanal: pisanje na kanal samo profesor; polaznici samo slušaju (autorizacija kanala preko RLS-a / tokena).

### Komponente i rute

- **Nove komponente:**
  - `NotesEditor` (profesor; Tiptap, autosave, broadcast, soft-lock)
  - `NotesViewer` (polaznik; read-only render + realtime pretplata)
  - `NotesRenderer` (zajednički „JSON → prikaz", za viewer i PDF)
- **Nove API rute:**
  - `/api/profesor/class-notes` — GET (učitaj), POST/PATCH (kreiraj/snimi). Auth: `requireStaff()`.
  - `/api/notes/export` — PDF (po času i ceo kurs).
- **Izmene postojećih:**
  - `/src/app/profesor/individualni/IndividualniClient.tsx` — zameni „prompt za Google Doc link" dugmetom „Beleške za današnji čas" koje otvara `NotesEditor`.
  - `/src/app/profesor/sesije/SesijeClient.tsx` — isto za grupne sesije.
  - Studentski dashboard / stranica kursa — dodaj tab „Beleške" (`NotesViewer`).
- **Migracija:** nova `class_notes` tabela + RLS + indeksi (sledeći broj u `supabase/migrations/`).

## Van obima (faza 2 ako zatreba)

- Lične beleške polaznika (privatno polje ispod profesorove beleške).
- Crtanje / dijagrami (Excalidraw stil).
- Obaveštenja mejlom po objavi beleške.
- Pretraga kroz beleške.
- Uvoz postojećih Google Docs beleški.

## Testiranje

- **Unit:** `NotesRenderer` (JSON → prikaz), generisanje PDF-a, RLS politike (polaznik ne sme da pročita tuđe beleške; istekao pristup i dalje čita svoje).
- **Integracija/smoke:** autosave upsert, broadcast propagacija profesor→polaznik, auto-kreiranje zapisa časa pri otvaranju beleške.

## Rizici

- **Latencija/glatkoća live table** — rešava se broadcast kanalom (ne `postgres_changes`, da DB ne pišemo po tipki); DB upis je debounce ~2s.
- **Dva uređaja kod profesora** — soft-lock + upozorenje (samo jedan pisac, nema spajanja konflikata jer polaznici ne pišu).
- **Skok scroll-a kod polaznika** — inkrementalni render uz čuvanje pozicije.
- **Realtime konekcije po grupi** (10–15 polaznika) — u granicama Supabase plana; pratiti.

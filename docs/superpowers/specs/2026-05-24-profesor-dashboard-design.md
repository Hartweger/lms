# Profesor Dashboard — Design Spec

**Datum:** 2026-05-24  
**Status:** Draft

## Cilj

Profesorke vide svoje polaznike i njihov progres, i pregledaju/ocenjuju eseje — samo za studente koji su im dodeljeni. Admin dodeljuje studente profesorkama (ručno za grupne, automatski za IND preko WC varijacije).

## Korisnici

- 6 profesorki (role: `professor`)
- Neke rade i IND i grupne kurseve
- Još nemaju naloge — Nataša će ih kreirati kad sve proradi

---

## 1. Baza podataka

### Nova tabela: `professor_students`

```sql
CREATE TABLE public.professor_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_via TEXT NOT NULL DEFAULT 'manual' CHECK (assigned_via IN ('manual', 'wc_variation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professor_id, student_id, course_id)
);
```

**RLS politike:**
- Profesorke čitaju samo svoje redove (`professor_id = auth.uid()`)
- Admin čita/piše sve
- Studenti nemaju pristup

**Indeksi:**
- `professor_id` (glavna pretraga za dashboard)
- `student_id` (za reverse lookup)

---

## 2. WC Webhook — automatska dodela (IND)

Kad webhook primi narudžbinu za IND proizvod (35766, 35767, 46494):

1. Iz `order.line_items[].meta_data` izvući varijaciju koja sadrži ime profesorke
2. Pronaći profesorku u `user_profiles` po imenu (partial match na `full_name`, role=professor)
3. Upisati red u `professor_students` sa `assigned_via: 'wc_variation'`

**Fallback:** Ako se ime profesorke ne pronađe — loguje warning, ne blokira granting pristupa. Admin dodeli ručno.

Dodaje se u postojeću `grantAccess()` funkciju u `src/lib/wc-sync.ts`.

---

## 3. Admin stranica: `/admin/profesori`

### Pregled profesorki
- Lista svih korisnika sa role=professor
- Za svaku: ime, broj studenata, dugme "Upravljaj"

### Dodela studenata
- Klik na profesorku → lista studenata sa checkbox-om
- Filter po kursu (dropdown)
- Dugme "Dodaj izabrane" → insert u `professor_students`
- Prikaz već dodeljenih studenata sa mogućnošću uklanjanja
- Kolona "Dodeljeno preko" (manual / wc_variation)

---

## 4. Profesor ruta: `/profesor`

### Layout
- Jednostavan header sa imenom profesorke i logout
- Dva taba: **Studenti** | **Eseji**
- Nema sidebar kao admin — čistiji mobilni UX

### Tab: Studenti
- Tabela/lista studenata dodeljenih toj profesorki
- Kolone: Ime, Kurs, Progres (% lekcija), Poslednja aktivnost
- Sortiranje po kursu ili progresu
- Klik na studenta → detalji (sve lekcije, koje su završene)

### Tab: Eseji
- Isti UX kao postojeća `/admin/eseji` stranica
- Ali filtriran: prikazuje SAMO eseje od studenata dodeljenih toj profesorki
- Filter po statusu: Čekaju pregled | Pregledano | Objavljeno | Svi
- Profesorka može: pregledati, napisati komentar, dati ocenu 1-5, objaviti studentu

---

## 5. Routing i autorizacija

### Middleware/redirect logika
- Kad korisnik sa role=professor otvori `/dashboard` → redirect na `/profesor`
- Kad korisnik sa role=student otvori `/profesor` → redirect na `/dashboard`
- `/profesor` layout proverava role i vraća 403 ako nije professor/admin
- Admin može pristupiti i `/profesor` i `/admin`

### Profesor NEMA pristup admin rutama
- `/admin/*` ostaje samo za admina

---

## 6. Kreiranje profesor naloga

Admin kreira profesorke kroz Supabase dashboard ili buduću admin stranicu:
1. Kreira korisnika u Supabase Auth
2. Postavlja role=professor u user_profiles
3. Profesorka se loguje Google login-om (isti flow kao studenti)

Za sada: Nataša kreira ručno u Supabase. Opciono: dodati "Dodaj profesorku" dugme na `/admin/profesori`.

---

## Šta NIJE u scope-u

- Poruke/chat između profesorke i studenta
- Notifikacije (email kad stigne novi esej)
- Google Sheets integracija za raspored (može kasnije)
- AI vežbe (poseban spec)

---

## Fajlovi koji se menjaju/kreiraju

| Fajl | Akcija |
|------|--------|
| `supabase/migrations/014_professor_students.sql` | Nova migracija |
| `src/lib/types.ts` | Dodati `ProfessorStudent` interface |
| `src/lib/wc-sync.ts` | Dodati auto-dodelu profesorki za IND |
| `src/app/api/wc-webhook/route.ts` | Proslediti varijaciju u grantAccess |
| `src/app/profesor/layout.tsx` | Novi layout sa auth check |
| `src/app/profesor/page.tsx` | Profesor dashboard (studenti tab) |
| `src/app/profesor/eseji/page.tsx` | Eseji tab |
| `src/app/admin/profesori/page.tsx` | Admin upravljanje profesorkama |
| `src/app/dashboard/page.tsx` | Redirect za profesorke |
| `src/components/AdminSidebar.tsx` | Dodati link "Profesori" |

# Srca + maskota (meda) — gamifikacija LMS-a

**Datum:** 2026-06-06
**Projekat:** kurs.hartweger.rs (LMS, `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms`)
**Status:** Dizajn odobren, čeka plan implementacije

## Problem

Na platformi se već prikupljaju poeni ("XP"), ali:
1. Nigde nije objašnjeno šta su, ni po kom principu rade.
2. Poeni se trenutno **ne pamte** — `ExerciseRunner.tsx` ih računa samo tokom jedne vežbe i nestaju (nema baze, nema ukupnog zbira, nema nivoa).
3. Nema emotivne, motivacione komponente (kao kod Duolinga).

## Cilj

Uvesti trajan, razumljiv sistem poena sa maskotom koja emotivno reaguje na ponašanje učenika, po Duolingo *principu* (emocija nosi motivaciju), ali sa originalnim, brendiranim identitetom.

## Ključne odluke

| Tema | Odluka |
|---|---|
| Valuta poena | **Srca ❤️** (ne "XP", ne med, ne bombone) |
| Maskota | **Plišani meda (teddy)** — klasičan stil, krupne sjajne oči, plava leptir-mašna (brend boja `#0AB3D7`) |
| Prikaz maskote | **Ceo lik**; glava se "izrezuje" iz istog crteža za sitna mesta |
| Posuda napretka | **Veliko srce koje se puni** ka sledećem nivou |
| Osnova za poene | **Aktivnost** (ne kupljeni sadržaj) |
| Nivoi | **Lični** napredak, **bez** javne rang-liste / poređenja |
| Gubljenje poena | **Nikad** — srca se samo skupljaju |

### Zašto srca, a ne "XP"/med

"XP" je žargon iz igrica koji odraslim polaznicima ništa ne znači. Srca su izabrana kao topla, univerzalno razumljiva valuta. Jedini realan rizik (srca = "životi" u kontekstu učenja) gasi se eksplicitnom rečenicom u objašnjenju: *"srca se samo skupljaju, nikad ih ne gubiš"*.

### Zašto aktivnost kao osnova

Polaznici imaju različit pristup: neko kupi jedan pola-nivo, neko sve. Da poeni nisu vezani za aktivnost nego za "pređeni sadržaj", onaj sa svime bi uvek imao više i sistem bi bio nepravedan. Pošto poeni nagrađuju aktivnost (vežbe, kvizovi, dnevni dolazak, niz), i pošto su nivoi lični (bez poređenja sa drugima), svi imaju isti teren.

## Mehanika — koliko srca donosi koja akcija

| Akcija | Srca |
|---|---|
| Tačan odgovor u vežbi | +10 (+5 za niz tačnih ≥3) — *logika već postoji* |
| Završena lekcija | +20 |
| Položen kviz / test | +50 (+25 dodatno ako je rezultat ≥90%) |
| Dnevni dolazak (login + bar nešto urađeno) | +10 |
| Ispunjen dnevni cilj (50 srca u danu) | +20 |

Sve vrednosti su podesive (konstante na jednom mestu).

Dnevni dolazak i dnevni cilj su "izjednačivači" — i polaznik sa malo sadržaja skuplja srca redovnošću i ponavljanjem.

## Nivoi (lični)

Kumulativni pragovi (podesivi):

| Nivo | Ukupno srca |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 450 |
| 5 | 700 |
| 6 | 1000 |
| 7+ | +350 po nivou |

Nivo se računa iz ukupnog broja srca. Na prelasku nivoa → maskota "oduševljena" + proslava (konfete već postoje u kodu, `ExerciseRunner.tsx`).

## Maskota — stanja, poze i okidači

Pošto je izabran **ceo lik**, svako stanje je **cela poza tela** (ruke, držanje, dodaci), ne samo zamena izraza lica. Govor tela nosi emociju jače od lica — to je suština Duolingo principa.

| Stanje | Poza (govor tela) | Okidač |
|---|---|---|
| 😊 Srećan | uspravan, blagi osmeh, maše rukom | podrazumevano, normalna aktivnost |
| 🤩 Oduševljen | **ruke raširene/dignute uvis, poskok**, sjajne oči | odmah posle odličnog testa (≥90%) ili prelaska nivoa |
| 😉 Ponosan | **palac gore / ruke na bokovima**, namiguje | niz ≥3 dana ili ispunjen dnevni cilj |
| 🤔 Zamišljen | **ruka na bradi**, neutralan | poziv na akciju / nova lekcija čeka |
| 😴 Pospan | **klonuo, glava pada**, Zzz | 3–6 dana neaktivan → "nedostaje mi…" |
| 😢 Tužan | **pogrbljen, briše suzu / plače**, obešene ruke | 7+ dana neaktivan → "vrati se, čeka te srce" |

Stanje se izvodi iz statistike (`daysSinceActive` iz poslednjeg aktivnog dana, niz, skorašnji događaj kao položen test/prelazak nivoa).

### Animacija (lagana, u v1)

Pošto su poze mali SVG-ovi, dodaju se jeftine CSS animacije koje "ožive" lik:
- **idle:** lagano ljuljanje/disanje (transform sway) dok miruje
- **slavi (oduševljen):** poskok (bounce) + srca koja izleću
- **pospan:** blago "klaćenje" glave + Zzz koji pluta
- **tužan:** suza koja klizi

Animacije poštuju `prefers-reduced-motion` (ko isključi animacije — vidi statičnu pozu).

## Objašnjenje koje korisnik vidi

Iskače na klik "?" pored brojača srca:

> **❤️ Šta su srca?**
> Srca su poeni koje skupljaš dok učiš nemački. Svaki tačan odgovor, lekcija i test pune tvoje srce. Što redovnije vežbaš — više srca i viši nivo. *I ne brini — srca se samo skupljaju, nikad ih ne gubiš!* Tvoj meda se raduje svakom srcu 🐻

Ispod: mala lista "kako se skuplja" (vrednosti iz tabele mehanike).

## Gde se prikazuje

1. **Dashboard — glavni widget:** ceo meda + srce-posuda (popunjenost = napredak ka nivou) + brojač srca + nivo + niz (🔥) + "?" za objašnjenje.
2. **Brojač u vežbi / header:** kompaktno (glava mede + broj srca) + "?".
3. **Posle pauze (povratak):** maskota u stanju pospan/tužan sa porukom ("Nedostajao si mi! Tvoje srce te čeka…").

## Tehnička arhitektura

> Napomena: ovaj projekat koristi modifikovan Next.js. Pre pisanja koda obavezno pročitati relevantan vodič u `node_modules/next/dist/docs/` (videti `AGENTS.md`).

### Baza

Nova migracija `supabase/migrations/0XX_user_progress.sql`:

Tabela `user_progress`:
- `user_id` (PK, FK → profiles/auth.users)
- `total_hearts` int default 0
- `level` int default 1 (može se i računati, ali keširamo radi prikaza/sortiranja)
- `current_streak` int default 0
- `longest_streak` int default 0
- `last_active_date` date
- `hearts_today` int default 0 (resetuje se kad se promeni datum — za dnevni cilj)
- `updated_at` timestamptz

RLS: korisnik **čita** samo svoj red. **Pisanje** ide isključivo kroz server akciju (service role), nikad direktno sa klijenta — sprečava varanje.

(Opciono, kasnije: append-only log `hearts_events` za istoriju "kako si zaradio". YAGNI za v1.)

### Server logika

- `lib/hearts/award.ts` — `awardHearts(userId, reason)`:
  - mapira `reason` → broj srca (server-side, klijent ne šalje iznos)
  - dodaje srca, recomputed `level` iz `total_hearts`
  - streak: ako je `last_active_date == danas` → bez promene niza; `== juče` → niz+1; inače → niz=1; ažurira `last_active_date`
  - `hearts_today`: reset ako je nov dan, pa dodaj
  - vraća novo stanje + flag-ove (`leveledUp`, `dailyGoalMet`) za UI/animacije
- `lib/hearts/levels.ts` — pragovi + `levelFromHearts()`, `heartsToNextLevel()`
- `lib/hearts/mascot.ts` — `getMascotState(stats, context)` → jedno od 6 stanja

### Pozivna mesta

- `ExerciseRunner.tsx`: preimenovati prikaz "XP" → "srca"; na kraju vežbe pozvati `awardHearts` (server-side validacija na osnovu stvarno tačnih odgovora, ne klijentskog zbira)
- završetak lekcije → `awardHearts(..., 'lesson_complete')`
- položen test → `awardHearts(..., 'test_pass' / 'test_pass_high')`
- dashboard load → dnevni "check-in" (`daily_login`, eventualno `daily_goal`)

### Komponente (React/SVG)

- `components/mascot/MascotBear.tsx` — `state` (6 izraza) × `size` ("full" | "head"); SVG portovan iz mockapa (`.superpowers/brainstorm/.../teddy.html`, `expressions.html`)
- `components/hearts/HeartVessel.tsx` — srce koje se puni (`fillPercent`)
- `components/hearts/HeartsWidget.tsx` — dashboard kartica
- `components/hearts/HeartsCounter.tsx` — kompaktni brojač + "?" popover
- `components/hearts/HeartsInfoPopover.tsx` — objašnjenje

## Šta NAMERNO ne radimo (YAGNI / v1 granice)

- ❌ Javna rang-lista / poređenje sa drugima
- ❌ Gubljenje srca
- ❌ Razdvajanje srca po kupljenim kursevima
- ❌ `hearts_events` log istorije (kasnije, ako zatreba)
- ❌ Složeni prelazi/morfovanje između poza (v1: 6 zasebnih poza + lagane CSS animacije po pozi)

## Otvorena pitanja za fazu plana

- Tačan način server-side validacije srca iz vežbe (da li `ExerciseRunner` šalje rezultate koje server reproverava, ili postoji već poverljiv izvor tačnosti).
- Da li dashboard već ima mesto/grid gde widget prirodno staje.
- Migracija prikaza postojećeg "XP" u `ExerciseRunner` da ne zbuni korisnike u prelaznom periodu.

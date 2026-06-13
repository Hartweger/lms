# Obaveze prema profesorkama (Accounts Payable) — dizajn

Datum: 2026-06-13
Projekat: LMS (hartweger.rs)

## Cilj

Voditi pun saldo prema svakoj profesorki: koliko je zaradila, koliko joj je
isplaćeno, koliko se još duguje. Pokriti tri stvari koje sadašnji sistem ne
hvata:

1. **Dodatne aktivnosti** koje se plaćaju mimo redovnih časova (priprema
   materijala, ispravljanje testova, vanredni rad…) — iznos se dogovara.
2. **Zamene** — kad jedna profesorka odradi čas druge, novac mora da ide pravoj
   osobi (bez duplog plaćanja).
3. **Beleženje isplata** — datum + iznos isplate, uz kratak mejl profesorki.

## Šta već postoji (ne menja se)

- Svaka profesorka ima svoju ratu na profilu: `user_profiles.honorar_ind`,
  `user_profiles.honorar_grp`. Različite rate po profesorki već rade.
- Honorar se računa iz održanih časova: `individual_lessons` (po `professor_id`,
  `lesson_date`) i `group_sessions` (po `professor_id`, `session_date`,
  `cancelled = false`).
- Mesečni cron (`/api/cron/honorari`) 1. u mesecu obračuna prošli mesec i
  pošalje mejl svakoj profesorki + zbirni mejl adminu. **Ostaje kako jeste**,
  samo se na dnu mejla doda preostali saldo.
- Čiste funkcije obračuna su u `src/lib/honorar.ts`.

## Ključna odluka: saldo se računa UŽIVO

Saldo se ne snima u mesečne snapshotove. Računa se na zahtev:

```
Zarađeno (sve vreme) = Σ(individual_lessons × honorar_ind)
                     + Σ(group_sessions[neotkazane] × honorar_grp)
                     + Σ(odobrene dodatne aktivnosti)

Isplaćeno (sve vreme) = Σ(professor_payments)

Saldo = Zarađeno − Isplaćeno
```

Prednost: nikad ne zaostaje, ako se čas doda naknadno saldo se sam ispravi.
Svesni kompromis: ako se rata profesorke promeni, retroaktivno se promeni i
prošli saldo. Za ovaj obim (≈7 profesorki) to je prihvatljivo; ne uvodimo
zaključavanje perioda (YAGNI).

Poreski deo (neto/doprinosi) NE vodi sistem — radi knjigovođa. Vodimo bruto.

## Tri toka — kako rade u praksi

### 1. Dodatne aktivnosti — self-service + odobravanje

- **Profesorka** (`/profesor/honorar`): dugme „Prijavi aktivnost" → forma
  `opis + iznos (din) + datum`. Šalje → status `na_cekanju`.
- **Admin** (`/admin/finansije`): inbox sa stavkama na čekanju. Po stavci
  `Odobri` / `Odbij` (sa opcionim razlogom).
  - `Odobri` → status `odobreno`, iznos ulazi u „Zarađeno".
  - `Odbij` → status `odbijeno`, profesorka vidi razlog, ne ulazi u saldo.
- Trag: `submitted_by`, `approved_by`, vremena.

### 2. Zamene — admin menja izvođača na času (bez forme, bez inbox-a)

Zamene su retke i admin za njih sazna usmeno (profesorka javi). Zato NEMA
self-service prijave za zamenu — radi se na izvoru:

- **Admin** u pregledu časova/sesija promeni `professor_id` te jedne sesije sa
  originalne profesorke na onu koja je zaista odradila.
- Obračun se sam ispravi: originalnoj se sesija skida, zameni se dodaje, po
  **rati one koja je odradila**. Jedan čas = jedna isplata, pravoj osobi.
- Rub: ako sesija za taj datum još ne postoji u bazi, admin je kreira pod
  zamenom (isti rezultat).

Mehanizam: nova admin akcija koja postavlja `professor_id` na konkretnom redu
`group_sessions` (i analogno `individual_lessons`). Trenutno se sesija uvek
beleži pod profesorku grupe (`group_sessions.professor_id = groups.professor_id`),
pa endpoint za promenu izvođača treba dodati — ne postoji.

Da originalnoj profesorki mesec ne „splasne" bez objašnjenja, u njenom pregledu
honorara kod prebačene sesije stoji oznaka „menjala <ime>".

### 3. Isplata + mejl

- **Admin** na prikazu profesorke u Finansijama: dugme „Zabeleži isplatu" →
  `datum + iznos (+ opciona napomena/način)`. Snima se u `professor_payments`,
  saldo se umanji.
- Po snimanju isplate, profesorka dobije kratak mejl (Resend, kao postojeći
  honorar mejlovi): isplaćeno X din (datum), preostali saldo Y din.

## Podaci (nove tabele)

```
professor_payments
  id            uuid pk
  professor_id  uuid  -> user_profiles.id
  payment_date  date
  amount        integer        -- bruto din
  note          text null      -- napomena/način
  created_by    uuid  -> user_profiles.id (admin)
  created_at    timestamptz default now()

professor_activities          -- SAMO dodatne aktivnosti (ne zamene)
  id            uuid pk
  professor_id  uuid  -> user_profiles.id
  description   text
  amount        integer        -- bruto din
  activity_date date
  status        text           -- 'na_cekanju' | 'odobreno' | 'odbijeno'
  reject_reason text null
  submitted_by  uuid  -> user_profiles.id
  approved_by   uuid null -> user_profiles.id
  created_at    timestamptz default now()
  decided_at    timestamptz null
```

Zamene ne dobijaju tabelu — to je izmena `professor_id` na postojećoj sesiji.

## Komponente (granice)

- `src/lib/honorar.ts` — proširiti čistim funkcijama: `computeBalance(earned,
  paid)` i agregacija aktivnosti. Bez I/O, testirano (`honorar.test.ts`).
- `src/lib/professor-payable.ts` (novo) — I/O sloj: učitaj zarađeno (časovi +
  aktivnosti) + isplate za profesorku/sve, vrati saldo. Jedno mesto za upite.
- API:
  - `POST /api/profesor/aktivnost` — profesorka prijavi aktivnost.
  - `POST/PATCH /api/admin/profesori/[id]/aktivnost` — odobri/odbij.
  - `POST /api/admin/profesori/[id]/isplata` — zabeleži isplatu + pošalji mejl.
  - `PATCH /api/admin/sesija-izvodjac` — promeni `professor_id` na
    group_session/individual_lesson (zamena).
- UI:
  - `/profesor/honorar` — saldo profesorke + „Prijavi aktivnost" + lista njenih
    aktivnosti sa statusom.
  - `/admin/finansije` — po profesorki: Zarađeno / Isplaćeno / Saldo, inbox
    aktivnosti, „Zabeleži isplatu"; akcija za promenu izvođača sesije.
- Mejl: `src/lib/email.ts` — `sendPaymentEmail(to, name, { amount, date,
  balance })`, u stilu postojećih `sendHonorar*` funkcija.

## Obrada grešaka

- Iznosi: ceo broj > 0; odbij prazno/negativno.
- Odobravanje/odbijanje samo iz statusa `na_cekanju` (idempotentno; ne menjaj
  već odlučeno).
- Promena izvođača: dozvoljena samo adminu; validiraj da sesija postoji ili je
  kreiraj pod novom profesorkom.
- Isplata > 0; dozvoljeno i kad saldo ode u minus (preplata se vidi kao
  negativan saldo, ne blokira se).
- Sve admin akcije su admin-only (provera role kao u postojećim rutama).

## Testiranje

- Unit (`honorar.test.ts` + novi): obračun salda sa časovima + aktivnostima −
  isplate; rub sa 0; preplata (negativan saldo).
- Integracija (ručno na produkciji po obrascu „deploy → smoke test"): prijava
  aktivnosti → odobravanje → saldo; isplata → mejl stigao; zamena → sesija
  prešla, obe strane vide tačno.

## Van opsega (YAGNI)

- Zaključavanje perioda / nepromenljive knjižene stavke.
- Poreski obračun (neto, doprinosi, PPP-PD) — radi knjigovođa.
- Rekonsilijacija sa izvodom banke (ionako odloženo).
- Self-service prijava zamena, rotacije/raspored zamena.
- Rate po kursu/nivou — jedna rata po profesorki je dovoljna.

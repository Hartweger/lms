# Privatni kanal „Gen II" + push obaveštenja

Rok: 30.9.2026. (početak NH Academy Generacije II)

## Zašto

Gen II je ostao bez WhatsApp grupe. Bez zamene, polaznica koja postavi pitanje
ne sazna da joj je neko odgovorio — mora sama da svrati na platformu i proveri.
Uz to, jedini postojeći chat je zajednički za sve članice NH Membershipa, pa bi
polaznice pisale pred publikom koja nije u njihovoj generaciji.

Dakle dve stvari, i jedna bez druge ne vredi: **privatan prostor** i **poziv da
se u njega vrati**.

## Zatečeno stanje

- `075_chat.sql` — `chat_kanali` + `chat_poruke`, 4 javna kanala, Realtime kroz
  `postgres_changes`. Vidljivost svega visi na `je_aktivna_clanica()` (074).
- `079_chat_procitano.sql` — `chat_procitano` (poslednje čitanje po kanalu) i
  RPC `chat_neprocitano()`. `ChatKlijent.tsx` upsertuje `last_read_at` uživo dok
  je kanal otvoren.
- `081`/`082` — proizvod `nh-academy-gen2`, **namerno bez `course_unlocks`**.
- `/clanstvo` ima PWA manifest (`clanstvo.webmanifest`, scope `/clanstvo`,
  `display: standalone`, ikone 192/512 + apple-touch 180).
- Push infrastrukture nema: nijedan service worker, nema VAPID-a.
- CSP u `next.config.ts` već dozvoljava `worker-src 'self' blob:`.

### Zatečena prepreka

`/clanstvo/layout.tsx` propušta unutra samo `jeAktivnaClanica()`. Pošto `081`
nema `course_unlocks`, kupac Gen II dobija `course_access` isključivo na sam
proizvod — i **ne može da uđe** u sekciju u kojoj bi privatni kanal živeo, iako
mu je Membership obećan uz program. Ovo se rešava pre kanala.

## Odluke

| Pitanje | Odluka | Zašto |
|---|---|---|
| Pristup zajednici | `course_unlocks`: gen2 → `nh-clanstvo-sadrzaj` | Ispunjava obećani „Membership gratis", bez izmene u `grant-access.ts` |
| Trajanje tog pristupa | Godinu dana (podrazumevano ponašanje) | Kraće bi puklo usred decembarskog okupljanja; duže radi u korist naplate članarine u januaru |
| Mehanizam | Web Push + mejl kao rezerva | Na iPhone-u push radi samo iz instalirane PWA; mejl pokriva ostale |
| Okidač | Svaka tuđa poruka, sa sažimanjem | 15 polaznica — količina je podnošljiva, a ništa se ne propušta. Nema izmene modela poruka |
| Obim | Samo Gen II kanal | Tu zamenjuje WhatsApp. Infrastruktura ne zna za kanal, pa se kasnije uključi bilo gde |
| Isporuka | Cron koji češlja, svaki minut | Uklapa se u 20 postojećih crona i `cron-health` nadzor; preživljava padove |
| Tiha zona | 22–07 po beogradskom vremenu | Noćna prepiska ne budi generaciju |

### Odbačeno

- **Okidač u bazi + `pg_net`.** Trenutna isporuka, ali sažimanje ionako traži
  prozor čekanja — pa se prednost u brzini pojede. Ostaje nova zavisnost, obrada
  grešaka unutar Postgresa i slanje koje se ne može ponoviti kad padne.
- **Klijent šalje posle inserta.** Zavisi od tuđeg taba: zatvori li ga
  pošiljalac, obaveštenje ne ode. Sažimanja nema jer nema ko da broji.
- **Odgovori (`reply_to`) i @pominjanja.** Tačnije poklapaju „kad im neko
  odgovori", ali traže izmenu šeme, RLS-a i chat UI-ja. Za generaciju od 15
  ljudi, obaveštenje o svakoj poruci daje isti ishod uz mnogo manje posla.
- **Keširanje u service worker-u.** SW služi isključivo za push. Offline režim
  nosi svoje rizike od zastarelog sadržaja i zaslužuje zaseban posao.
- **`next-pwa`.** Cela biblioteka i build korak zbog jednog statičkog fajla.

## Šema

### `083_chat_kanal_gen2.sql`

Vidljivost kanala prestaje da bude „je li članica" i postaje „ima li važeći
`course_access` na kurs iz `pristup_slug`".

```
alter table public.chat_kanali
  add column pristup_slug text not null default 'nh-clanstvo-sadrzaj';
```

Postojeća 4 kanala zadržavaju ponašanje kroz podrazumevanu vrednost. Novi red:
`('gen2', 'Gen II', 'Naša generacija — pitanja, domaći i sve između. Vidi ga samo Generacija II.', false, -1, 'nh-academy-gen2')` —
`sort = -1` da stoji prvi, jer je za polaznicu to glavni kanal.

Nova funkcija `public.ima_pristup_kanalu(uid uuid, kanal uuid)` — `security
definer`, `stable`, `set search_path = public` — vraća tačno kad korisnik ima
`course_access` na kurs iz `pristup_slug` datog kanala koji nije istekao
(`expires_at is null or expires_at > now()`), ili kad je admin. Ista struktura kao `je_aktivna_clanica()`, samo parametrizovana
slugom.

Polisa `chat_kanali_select_clanice` se zamenjuje polisom nad
`ima_pristup_kanalu(auth.uid(), id)`.

**Polise na `chat_poruke` i `chat_procitano` se ne diraju.** One već nasleđuju
vidljivost kroz podupit na `chat_kanali` (obrazac iz 067), pa je promena na
jednom mestu dovoljna — to je i razlog zašto se ide ovim putem umesto zasebne
polise za Gen II.

Grantovi po ugledu na 079: `revoke execute … from public, anon`, `grant … to
authenticated, service_role`.

**Provera koja mora da prođe pre svega ostalog:** polaznica Gen II bez
Membershipa (ako takva postoji) ne sme da vidi nijedan od 4 stara kanala, a
članica bez Gen II ne sme da vidi Gen II.

### `084_gen2_membership_unlock.sql`

Jedan red u `course_unlocks` (`purchasable` = `nh-academy-gen2`, `content` =
`nh-clanstvo-sadrzaj`). Time `grant-access.ts` prestaje da pada na granu sa
`console.warn` i upisuje pristup članstvu.

Migracija ne prepravlja unazad već obrađene narudžbine. Provereno 8.8.2026:
kupovina Gen II još nema, pa nema ni koga da se dodeljuje ručno. Ako se do
primene migracije pojavi prva, njoj se pristup članstvu upisuje ručno.

### `085_push_pretplate.sql`

```
push_pretplate (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  poslednja_greska text
)
```

`endpoint` je primarni ključ jer isti korisnik ima više uređaja, a isti uređaj
ne sme da se upiše dvaput. RLS: `select`/`insert`/`delete` samo svoji redovi
(`auth.uid() = user_id`); cron čita `service_role` ključem, koji RLS zaobilazi.

```
chat_obavestenja (
  kanal_id uuid references chat_kanali(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  push_do timestamptz not null default now(),
  mejl_do timestamptz not null default now(),
  primary key (kanal_id, user_id)
)
```

Dva odvojena vodostaja jer push i mejl imaju različit tempo (vidi Isporuku).
Bez RLS polisa za `authenticated` — tabelu dira isključivo cron.

## Service worker

`public/clanstvo-sw.js`, običan JS bez build koraka. Registruje se sa
`{ scope: "/clanstvo/" }`; pošto skript stoji u korenu, njegov najširi mogući
doseg je `/`, pa je uži doseg dozvoljen i `Service-Worker-Allowed` zaglavlje ne
treba. Školski deo sajta ostaje van dosega.

Dva rukovaoca:

- `push` — `showNotification` sa `tag: "gen2"`, pa se više obaveštenja sklapa u
  jedno umesto da se ređaju u nizu.
- `notificationclick` — kroz `clients.matchAll` traži otvoren tab na
  `/clanstvo/zajednica` i fokusira ga; ako ga nema, `clients.openWindow`.

Ništa drugo. Bez `fetch` rukovaoca, bez keširanja.

## Klijent

`src/components/clanstvo/PushPrijava.tsx`, prikazan samo kad je aktivan kanal
Gen II.

Tri stanja:

1. **iOS u običnom tabu** (`navigator.standalone !== true` uz iOS user agent) —
   `Notification` tu uopšte ne postoji, pa se umesto dugmeta prikazuje uputstvo
   „Podeli → Dodaj na početni ekran". Posle instalacije dugme se pojavi.
2. **Dozvola nije tražena** — dugme „Uključi obaveštenja". Zahtev ide isključivo
   iz `onClick`; browseri odbijaju `requestPermission()` van korisničkog gesta.
3. **Pretplaćena** — kratka potvrda i mogućnost isključivanja (briše red iz
   `push_pretplate` i zove `subscription.unsubscribe()`).

Pretplata se pravi sa `applicationServerKey` iz
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` i upisuje direktnim insertom pod RLS-om, kao što
`ChatKlijent` već radi za poruke.

## Isporuka

`/api/cron/gen2-push`, raspored `* * * * *` u `vercel.json`. Obrazac rute:
`withCronLog` + `must` + `Bearer CRON_SECRET`, isto kao `grupe-podsetnik`.

Za svakog primaoca sa pristupom kanalu (bez pošiljaoca):

1. Vodostaj iz `chat_obavestenja`; ako reda nema, upisuje se sa `now()` — prva
   obrada nikad ne šalje istoriju unazad.
2. Kandidati = tuđe poruke novije od `push_do`, koje `chat_procitano.last_read_at`
   još nije pokrio. Ko trenutno gleda kanal ne dobija ništa, jer `ChatKlijent`
   pomera `last_read_at` uživo.
3. Ako je tiha zona (22–07, Europe/Belgrade): preskoči **i ne pomeraj nijedan
   vodostaj** — ni `push_do` ni `mejl_do`, pa ni mejl ne stiže noću. U 7 ujutru
   ide jedno obaveštenje sa svime propuštenim.
4. Jedan push po osobi na sve njene pretplate: naslov „Gen II", telo
   „N novih poruka — <poslednja, skraćena>". `push_do` na najnoviju obrađenu.
5. **Mejl kao rezerva** ide samo onome ko nema nijednu pretplatu u
   `push_pretplate`, i tek za poruke starije od 10 minuta koje su i dalje
   nepročitane — inače bi Resend slao mejl za nešto pročitano dva minuta
   kasnije. Zaseban vodostaj `mejl_do`.
6. Odgovor 404/410 sa push servisa (obrisan browser, deinstalirana PWA) briše
   red iz `push_pretplate`. Ostale greške idu u `poslednja_greska` i Sentry.

### Okruženje

`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_SUBJECT` (`mailto:info@hartweger.rs`). Ključevi se generišu jednom
(`web-push generate-vapid-keys`) i **ne menjaju** — promena poništava sve
postojeće pretplate.

Nova zavisnost: `web-push`. Ruta mora ostati na Node runtime-u (podrazumevano),
ne Edge.

## Podela odgovornosti

- `src/lib/gen2-push.ts` — čiste funkcije, bez baze i mreže:
  `grupisiPoPrimaocu()`, `uTihimSatima(datum)`, `tekstObavestenja(poruke)`,
  `trebaMejl(poruke, sada)`. Ovde je sva logika.
- `src/app/api/cron/gen2-push/route.ts` — čita bazu, zove funkcije iznad, šalje.
  Tanak omotač.
- `src/lib/push.ts` — omotač oko `web-push` (slanje + tumačenje 404/410).
- `public/clanstvo-sw.js` — prikaz i klik.
- `src/components/clanstvo/PushPrijava.tsx` — dozvola i pretplata.

## Provera

Vitest nad `gen2-push.ts`:

- grupisanje: tri poruke od dvoje ljudi → jedno obaveštenje po primaocu
- pošiljalac ne dobija svoju poruku
- pročitano pre prolaza se izostavlja
- tiha zona: 21:59 šalje, 22:01 ne; 06:59 ne, 07:01 šalje
- tiha zona preko ponoći i preko prelaza na zimsko vreme (25.10.2026.)
- `trebaMejl`: 9 minuta ne, 11 minuta da; pročitano u međuvremenu — ne

Ručna matrica pred 30.9. (ovo testovi ne pokrivaju):

- Android Chrome u browseru — dozvola i push bez instalacije
- iPhone sa instaliranom PWA — dozvola i push
- iPhone Safari u tabu — mora da pokaže uputstvo, ne pokvareno dugme
- Desktop Chrome — push i klik koji fokusira postojeći tab
- Postojeća 4 kanala nepromenjena posle prelaska na `pristup_slug`

## Redosled

1. Commit-ovati `081`/`082` (sada stoje kao untracked) i primeniti ih.
2. `083`, `084`, `085`.
3. VAPID ključevi u Vercel okruženje.
4. `web-push` + `src/lib/push.ts` + `src/lib/gen2-push.ts` sa testovima.
5. `clanstvo-sw.js` + `PushPrijava.tsx`.
6. Cron ruta + red u `vercel.json`.
7. Ručna matrica.
8. Uputstvo za instalaciju PWA na iPhone-u — u welcome mejl Gen II i u prvi
   susret 30.9. Bez toga polaznice na iPhone-u ostaju samo na mejlu, što je
   tačno rupa zbog koje je WhatsApp bio potreban.

## Van obima

Odgovori i pominjanja u chatu. Push za ostala 4 kanala. Podešavanja obaveštenja
po kanalu. Offline režim. Obaveštenja o bilo čemu osim poruka (nove lekcije,
podsetnici za susrete).

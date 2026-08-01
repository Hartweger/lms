# NH Membership — uputstvo za vođenje

Kratko uputstvo za svakodnevni rad sa članstvom. Tehnička pozadina:
`docs/plans/2026-08-01-nh-clanstvo.md` (plan izgradnje) i
`/Users/natasahartweger/Documents/Claude/NH/membership-koncept.md` (koncept).

## Kako radi naplata (ukratko)

- Kupovina na `hartweger.rs/kupovina/nh-clanstvo` — samo mesečna pretplata
  (2.290 RSD founding). Banka svakog meseca naplaćuje sama; dnevni cron
  (`subscriptions-poll`, 05:00) upisuje naplate i produžava pristup.
- Pristup važi do **sledeće naplate + 7 dana**. Ako naplata ne prođe ili
  članica otkaže, pristup se gasi SAM — ništa ne moraš da radiš, niti ikoga
  izbacuješ. Chat, imenik i lekcije nestaju automatski.
- Otkazivanje: članica sama na stranici **Moj nalog**.
- Founding članice zauvek zadržavaju svoju cenu: banka zaključava iznos
  serije pri prijavi, kasnija poskupljenja važe samo za nove.

## Mesečna lekcija (jednom mesečno)

1. Admin panel → Kursevi → **NH Membership - biblioteka** (`nh-clanstvo-sadrzaj`)
2. Nova lekcija: naslov + video (Vimeo ID) + sadržaj kroz blokove
3. **Badge blok određuje modul** u biblioteci (npr. "Modul 1: Ko si ti") —
   lekcije sa istim badge-om se grupišu zajedno
4. Posle objave, najavi lekciju u chat kanalu **Novosti**

## Novosti + AI promptovi (kanal u chatu)

U kanalu **Novosti** pišeš samo ti (članice mogu samo da čitaju).
Tu objavljuješ: nove lekcije, mesečne AI promptove, najave. Ostali kanali
(Pitanja, AI alati, Pohvale i uspesi) su otvoreni za sve članice.

## Prelazak sa founding na punu cenu (kad se popuni 50 mesta)

1. Broj aktivnih članica proveri u Supabase (SQL ispod)
2. U bazi: `update courses set price = 3490 where slug = 'nh-clanstvo';`
3. U kodu: `src/lib/subscription-plans.ts` → `monthlyRsd: 3490` za
   `nh-clanstvo` → commit + deploy
4. Postojeće pretplate automatski ostaju na 2.290 — ništa dodatno

## Praćenje broja članica

```sql
select count(*) from subscriptions s
join courses c on c.id = s.course_id
where c.slug = 'nh-clanstvo' and s.status = 'active';
```

(Supabase dashboard → SQL editor, projekat Hartweger's LMS)

## Moderacija chata

Neprimerenu poruku možeš obrisati direktno u Supabase (tabela `chat_poruke`)
— admin ima i RLS pravo brisanja. Za sada nema dugmeta u interfejsu (backlog).

## Šta je ostalo ručno / backlog

- **Banka:** potvrditi da je tekst na checkoutu prihvatljiv za novi proizvod
  i dopuniti `/uslovi` stranicu uslovima članstva (PRE lansiranja)
- **Prodajna stranica** na natasahartweger.rs/membership (poseban posao)
- **Test kupovina** kroz NestPay TEST okruženje pre lansiranja
  (admin → nestpay-recurring-test)
- Backlog za kasnije: godišnja opcija (190€, poseban jednokratni proizvod),
  fotografije na profilima (Storage), NH omot za stranicu lekcije,
  povratak na /clanstvo posle prijave (?next=), mejl notifikacije za
  nove poruke, dugme za brisanje poruka u interfejsu

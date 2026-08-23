# Prvi nemački - predlog

Datum: 22.08.2026, opseg promenjen 23.08. Status: nacrt. Ništa nije napisano u
kodu.

**PROMENA OPSEGA 23.08 (Nataša):** proizvod se **ne vezuje za prvi razred**.
Namenjen je deci od 6-7 godina koja još ne čitaju, **bez obzira na to da li
nemački uče u školi.** Radna oznaka i dalje „zack! mali".

Klikabilan prototip lekcije:
https://claude.ai/code/artifact/da355755-aa7a-43eb-8a57-fb7150e4b18f

## Šta pravimo

Režim zack!-a **bez ijednog slova**, za decu od 6-7 godina koja još ne čitaju.
Isti repo, iste tabele, ista naplata, ista roditeljska strana. Menja se samo
ono što dete vidi i čuje.

Dete ne mora da uči nemački u školi. Većina i ne uči - nemački je u prvom
razredu redak kao prvi strani jezik. **Ovo je detetov prvi susret sa jezikom,
ne pomoć oko školskog gradiva.**

## Zašto bez slova

- Dete tog uzrasta uči **ćirilicu**, latinica dolazi kasnije. Nemački se piše
  latinicom, pa ne može da pročita ni nemačku reč ni srpski prevod.
- Predškolac uopšte ne čita.

Odsustvo teksta nije zaobilaženje problema nego jedini pošten oblik za taj
uzrast, i ujedno ono što nas razlikuje od svega ostalog na tržištu.

## Šta je promena opsega donela

Vezivanje za prvi razred bi nas koštalo više nego što bi dalo:

1. **Publika je znatno veća.** Nemački se u prvom razredu retko uči kao prvi
   strani jezik, pa bi „za prvake koji uče nemački u školi" bio sasvim uzak
   krug. Ovako ulaze i predškolci i prvaci i deca koja nemački uče samo kod
   kuće.
2. **Rečnik pišemo sami** - i to je najveća praktična razlika. Ranije je
   početak čekao izvlačenje spiska iz Pravilnika; sada ne čeka ništa.
3. **Reči biramo tako da se lako crtaju.** Kad spisak diktira Pravilnik, dobiju
   se i apstraktne reči bez moguće slike. Sada svaka reč može da ima jasan
   crtež - a ilustracija je najveći trošak u projektu.
4. **Pitanje „der Bär" nestaje.** Medveda prosto ne stavljamo u rečnik, pa se
   maskota i gradivo ne sudaraju.

**Šta gubimo, pošteno:** argument „isto što uči u školi", koji je za peti
razred bio najjači. Zamenjuju ga dva druga: *radi sam, bez tvoje pomoći* i
*krene spreman, umesto od nule*.

## Odluke koje su već pale

| Pitanje | Odluka |
|---|---|
| Pristup | Isti kod, novi režim (ne zasebna aplikacija) |
| Landing | Zaseban, naslov „radi sam", podnaslov „pet minuta igre" |
| Glas | Sintetički za nemačke reči, **Natašin glas za medu** (Nataša, 23.08) |
| Slike | Generisane u jednom stilu za predmete, ilustrator za maskotu |
| Nemačka reč | Uvek sa članom: `der Hund`. Član se ne boji. |
| Kada | Tek posle pilota petog razreda (Nataša, 22.08) |
| Maskota | Postojeći meda sa platforme, uz dodat obris (Nataša, 22.08) |
| Cena | Predlog 990 promo / 1.990 puna, plus drugo dete -40% |

## Dečja strana

### Ostaje netaknuto

Album i sličice, kesice, srca, papirna podloga, kod + PIN, i sva vrhovna
pravila: detetu se nikad ne oduzima zarađeno, nema prekora nigde, obraćanje bez
roda, dečja strana bez Hartweger znaka.

### Otpada

Diktat (kucanje), brzo biranje sa ispisanim rečima, rod i boje der/die/das,
množina, slagalica, dopuna, Milioner, ceo rečenični blok. Sve to traži čitanje
ili gramatiku, a prvom razredu ne pripada ni jedno ni drugo.

### Dodaje se

- **„Slušaj i pokaži"** - dete čuje nemačku reč i bira između **tri slike**.
- **„Šta je ovo"** - dete vidi sliku, čuje tri reči, bira tačnu.
- **„Parovi"** - igra već postoji, ali je par ovde **slika + zvuk**, ne slika +
  ispisana reč.
- **Meda** sa platforme daje zadatak, čeka i raduje se (vidi niže).
- **Scena umesto mreže albuma.**

Tri odgovora, ne četiri. Jedan zadatak po ekranu, slika oko trećine ekrana.

### Struktura lekcije

**Slušaj → Igraj.** Dva bloka, ne tri.

- Slušanje: grupe od 4 do 6 reči (petak ima 6), posle svake grupe tri pitanja.
  Bez srca, greške se ne upisuju, tačan odgovor zarađuje sličicu - isto pravilo
  kao kod petaka.
- Jedan katanac: slušanje otključava igre. Kvar čitanja podataka = otključano.

### Nemačka reč uvek ide sa članom

Na sličici stoji **`der Hund`**, i tako se izgovara. Odluka Natašina, 22.08.

Rod se pri tom **ne uči i član se ne boji** - dete ga čuje kao deo reči, ne kao
gramatiku koju treba da provali. Boje der/die/das ostaju izbačene, kao što
stoji niže.

Posledice koje treba upisati u kod:
- `zack_reci.de` sadrži reč sa članom, ili se član sastavlja iz
  postojeće kolone `rod` pri prikazu. **Drugo je bolje** - `rod` već postoji, a
  pretraga i poređenje reči tako ostaju neizmenjeni.
- Snimak reči sadrži i član (`der Hund`, ne `Hund`), pa se snima jednom, kao
  celina.
- Množina se ovde ne pominje nigde, pa `mnozina` ostaje prazna.

### Scena

Isti podaci (`zack_slicice`), drugi prikaz. Svaka reč ima svoje mesto u sceni;
kad je dete zaradi, predmet se pojavi. Tap na predmet izgovori reč.

Pošto je to prikaz nad postojećim podacima, a ne novi sistem nagrađivanja,
jeftinije je nego što zvuči. Sve što album danas garantuje i dalje važi.

### Font i pismo

- **Andika** za sve što dete vidi. Pravljena je za početno opismenjavanje:
  jednospratno „a" i „g", razdvojeni I/l/1.
- Znak „zack!" ostaje **Archivo Black**, da brend ostane isti.
- Sve na našem jeziku ide detetu **ćirilicom**. Latinica samo za nemačku reč na
  sličici.
- PROVERITI pre zaključavanja: da li Andika pokriva i ćirilicu i nemačke
  umlaute u istom rezu.

### Boje

Boje roda se izbacuju - prvom razredu gramatika ne postoji, a njihovo
izbacivanje samo po sebi skida dosta „školskog" sa ekrana. Žuta ostaje boja
nagrade. Papirna podloga ostaje.

### Prijava bez čitanja

Prvi ulaz radi roditelj: kod `ZK-XXXX` + PIN, kao i sad. Uređaj zapamti dete.
Posle toga dete tapne **svoju sliku** i ukuca četiri cifre - cifre prvak zna.
Postojeći sistem koda i PIN-a se ne dira.

Napomena iz prve večeri poklona: curenje je bilo u PIN-u, ne u sadržaju. Isti
mejl prvog dana važi i ovde.

## Zvuk - tehnički

**Ovo je najvažnija tehnička stavka.** Postojeći `lib/zack/glas.ts` koristi glas
telefona (Web Speech) i namerno se tiho gasi kad telefon nema nemački glas. Za
petaka je to ispravno - izgovor je dodatak. **Za prvaka nije** - bez zvuka
aplikacija ne radi uopšte.

Zato: **unapred napravljeni MP3 fajlovi** u Supabase storage. Nova kolona
`zack_reci.glas_url`, bucket `zack-glas`. Web Speech ostaje kao rezerva, ne kao
osnova.

## Slike - tehnički

Nova kolona `zack_reci.slika_url` i bucket `zack-slike`. Postojeća `ikonica`
(Twemoji) ostaje netaknuta za pete razrede.

Oko 80 slika, jedan stil, providna pozadina.

**Pravilo „slika samo na sličici, nikad u pitanju" ovde traži zapis.** U igri
„slušaj i pokaži" slika **jeste** odgovor. To nije kršenje pravila nego druga
igra: dete ne prevodi ispisanu reč uz pomoć crteža, nego prepoznaje zvuk. Staro
pravilo i dalje važi svuda gde u pitanju stoji tekst.

## Sadržaj

**Rečnik pišemo mi, po temama, ne po Pravilniku.** Osam do deset tematskih
celina, oko deset reči po celini - ukupno **80 do 100 reči**.

Prirodne teme za taj uzrast: pozdravi, boje, brojevi do deset, porodica,
životinje, telo, hrana, igračke, odeća.

Dva pravila pri izboru reči:

- **Svaka reč mora da ima jasan crtež.** Reč koju sedmogodišnjak ne prepoznaje
  na slici u ovaj proizvod ne ulazi, koliko god bila česta.
- **Bez medveda** (`der Bär`), da se ne sudari sa maskotom.

Zapis u `zack_udzbenici`: slug `prvi-nemacki`, izdavac `Prvi nemački`,
`razred` = NULL, naziv „6-7 godina".

**MIGRACIJA JE OBAVEZNA.** `zack_udzbenici.razred` je danas
`SMALLINT NOT NULL CHECK (razred BETWEEN 5 AND 8)`. Ovaj proizvod nije razred,
pa kolona mora da dozvoli NULL:

```sql
ALTER TABLE public.zack_udzbenici ALTER COLUMN razred DROP NOT NULL;
ALTER TABLE public.zack_udzbenici DROP CONSTRAINT zack_udzbenici_razred_check;
ALTER TABLE public.zack_udzbenici ADD CONSTRAINT zack_udzbenici_razred_check
  CHECK (razred IS NULL OR razred BETWEEN 1 AND 8);
```

(Tačno ime ograničenja proveriti u bazi pre pisanja migracije.)

## Roditeljska strana

Skoro se ne menja, ali **jedna izmena je obavezna**: panel danas filtrira po
`izdavac='Po planu i programu'` i polje zove „Razred". Ovaj proizvod nije
razred i nije po programu, pa bi uz taj filter bio nevidljiv.

Rešenje: polje se zove **„Šta uči"**, a bira se između dva zapisa - „Peti
razred (po školskom programu)" i „Prvi nemački (6-7 godina)". Kad `razred`
bude NULL, prikazuje se `naziv`.

Izveštaj roditelju ostaje isti, samo bez rečenica.

## Prodaja

Zasebna stranica `/prvi-nemacki`. `/nemacki-za-decu` ostaje petom razredu
netaknuta - tek je doterana pred oglase.

Vrh stranice:

> **Nemački za decu koja još ne čitaju**
> Ne treba mu ni jedno slovo. Sluša, gleda slike i bira - i radi sam.
> Za uzrast od šest do sedam godina, bez obzira na to da li nemački uče u
> školi.

Naslov namerno govori o **sposobnosti, ne o godinama**: roditelj odmah zna da
li je to njegovo dete, bio ono predškolac ili prvak. Uzrast stoji u trećem redu
kao putokaz, ne kao uslov.

Niže: blok „krene spreman, umesto od nule" kao razuman razlog da se plati.

Čega se klonimo:

- **znački „po školskom programu"** - ona pripada petom razredu i ovde bi bila
  neistina;
- obećanja o oceni i kontrolnom;
- svakog tona koji roditelju sugeriše da nešto propušta.

### Cena

Peti razred: 348 reči, 12 lekcija, 120 rečenica, osam igara i Milioner, za
1.200 promo i 2.399 punu cenu.
Prvi nemački: 80-100 reči, osam do deset celina, bez rečenica, tri igre.

Odnos sadržaja je oko 20%, ali **cena se po tome ne računa**, iz tri razloga:

1. Članstvo je vremensko, ne po rečima - malo dete plaća isti broj meseci kao
   petak.
2. Naš trošak po reči je ovde **veći**, ne manji: svaka reč traži i ilustraciju
   i snimak, a kod petaka nova reč ne košta ništa dodatno.
3. Plaća isti roditelj, sa istom platežnom moći.

Zato ne 20% cene (oko 480 dinara, što i podcenjuje i zvuči neozbiljno), nego
prag niže od petog razreda:

| | Peti razred | Prvi nemački (predlog) |
|---|---|---|
| Promo | 1.200 | **990** |
| Puna | 2.399 | **1.990** |

Oba iznosa prelaze prag naniže (ispod hiljadu, ispod dve hiljade), pa se čitaju
kao jasno jeftinije, a proizvod ne ispada bezvredan.

**Drugo dete iz iste kuće -40%.** Ovo vredi više od svakog obaranja osnovne
cene: roditelj sa malim detetom i petakom je najverovatniji kupac drugog
članstva, a naš granični trošak za to dete je nula. Popust se vezuje za roditeljski nalog,
ne za kupon.

**Bez poklon akcije na startu.** Peti razred je dobio poklon zato što je
trebalo dokazati proizvod i napuniti levak. Ako i ovaj krene besplatno,
tržište nauči da svaki novi proizvod sačeka.

## Šta namerno NE radimo

Milioner, rečenice, gramatiku i rod, duel, test pred kontrolni, bilo kakvo
kucanje, i snimanje detetovog izgovora. Poslednje je moguća druga faza, ne ovo.

## Redosled

1. Migracija: razred 1-8, `glas_url`, `slika_url`, dva bucketa.
2. Rečnik (80-100 reči po temama) napisati i uneti u bazu.
3. **Nabavka zvuka i slika** - najduže traje, zato kreće prva.
4. Dečji ekran: slušaj i pokaži, šta je ovo, parovi sa zvukom.
5. Scena.
6. Meda: obris + dva nova stanja.
7. Landing.
8. Pilot sa pravim prvakom.

## Vreme - odlučeno

**Prvi razred kreće tek posle pilota petog** (Nataša, 22.08). Peti još nije
prošao nijedno pravo dete, poklon traje do 15.9. i oglasi ciljaju peti razred.

Jedina stvar koja sme da počne ranije je **nabavka zvuka i slika** - to je
jedini deo koji se ne može ubrzati kodom, pa može da teče paralelno sa
pilotom.

## Maskota - postojeći meda

**ODLUKA (Nataša, 22.08): koristi se meda koji već skuplja srca na platformi.**

Poređenje u zack! svetu:
https://claude.ai/code/artifact/78d89b38-9468-4fa5-a75d-c574d747b86c
Tri odbačene skice (Cak, Uško, Nalepnica):
https://claude.ai/code/artifact/be60026b-69ae-4aa3-9ecd-15327612f5c4

Meda je `src/components/mascot/MascotBear.tsx` + `MascotBear.css`, stanje se
bira u `src/lib/hearts/mascot.ts`. Već ume:

- šest stanja: `happy`, `celebrate`, `proud`, `thinking`, `sleepy`, `sad`
- dve veličine: `full` i `head` (različit viewBox)
- prekidač `animated`, animacije u sopstvenom CSS-u
- testove (`mascot.test.ts`)

To je najskuplji deo maskote i već je napisan. Nijedna nova skica to ne
nadmašuje time što je nova.

### Šta treba doraditi

1. **Obris.** Ceo zack! je crtan debelim crnim obrisom - sličice, dugmad,
   kartice. Meda je jedini bez njega i vizuelno visi iznad papira umesto da
   bude u njemu. Rešenje je `stroke="#16161A"` na siluetnim oblicima (uši,
   glava, telo, noge, ruke, njuška), **ne** na licu. Crtež se ne dira.
   Praktično: `MascotBear` dobija prop `obris?: boolean`, podrazumevano
   `false`, pa se platforma ne menja ni za piksel.
2. **Dva nova stanja:** `pita` (dok postavlja zadatak) i `slusa`
   (dok reč svira). To je po jedno lice u `FACES`, ne nov lik.
3. **`der Bär` ne ulazi u rečnik.** Pošto spisak reči sada pišemo mi, ovo više
   nije provera nego pravilo: medveda nema u gradivu, pa se maskota i odgovor u
   igri ne sudaraju.

### Glas medveda - Natašin

**ODLUKA (Nataša, 23.08): medu govori Nataša.**

Meda ne izgovara reči iz lekcija - on govori uputstva, a ona se ponavljaju
kroz ceo proizvod: „Слушај", „Покажи мачку", „Браво", „Пробај поново",
„Двориште ти се пуни". Procena je **30 do 50 kratkih replika, snimljenih
jednom**, koje onda važe za sve lekcije i sve razrede.

Razlog zašto baš živi glas: meda je jedini topao element u dečjem delu. Dete
ne čita, nema teksta, nema Natašinog imena ni Hartweger znaka. Da mu glas bude
aparat, ostalo bi nula topline.

Nemačke reči i dalje idu sintetički - njih ima mnogo, menjaće se sa svakim
novim razredom, i pojedinačna reč se ionako ne razlikuje od živog govornika.

Praktično, pre snimanja:
- spisak replika se piše i zaključa PRE odlaska u snimanje, jer svaka naknadna
  izmena znači novo snimanje;
- ime deteta se u repliku NE ubacuje (isto pravilo kao u mejlovima - padeži se
  ne pogađaju, a ovde bi tražili i poseban snimak po detetu);
- fajlovi idu u isti bucket kao i reči, ali u svoju fasciklu, da se ne mešaju
  sa sintetičkim snimcima.

### Dva pitanja koja su se sama rešila

- **Pravilo „dečja strana bez Hartwegera" nije prekršeno.** Pravilo govori o
  Natašinom imenu i logotipu (vidi komentar u `app/zack/layout.tsx`), ne o
  liku. Meda na sebi nema ni ime ni znak. Odvojen manifest, ikonica i naslov
  ostaju kakvi jesu.
- **Mašnica je cijan `#0AB3D7`**, boja koje u zack!-u nema. Pošto su ovde
  boje roda ionako izbačene, plava je slobodna i ne sudara se ni sa čim.
  Ostaje.

## Otvorena pitanja za Natašu

1. **Spisak reči po temama** - ko ga piše. Više ne čeka Pravilnik, pa može da
   krene odmah. Sve ostalo (slike, snimci) visi na njemu.
2. Potvrda cene 990 / 1.990 i popusta za drugo dete.
3. Potvrda imena i adrese: „Prvi nemački", `/prvi-nemacki`.

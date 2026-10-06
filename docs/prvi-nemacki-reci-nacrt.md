# Prvi nemački - nacrt rečnika po temama

Datum: 06.10.2026. Status: **nacrt, čeka Natašino oko.** 85 reči u 10 tematskih celina.

Prati predlog `docs/superpowers/specs/2026-08-22-zack-prvaci-design.md`.

## Format

Kolone razdvojene tabulatorom, spremno za lepljenje u admin
(`/admin/zack`, parser u `ZackClient.tsx`):

```
nemačka reč → naš prevod → rod → množina → izuzetak
```

- **Član NE ide u kolonu reči.** U bazi stoji `Hund`, a `der` je u koloni roda -
  tako sastavljamo „der Hund" pri prikazu, a poređenje reči ostaje neizmenjeno.
- **Množina je svuda prazna.** Igra Množina ne postoji u ovom proizvodu, a
  upisati crticu značilo bi tvrditi da reč nema množinu, što nije tačno.
- **Izuzetak je svuda prazan.**
- Kod boja i brojeva je **kolona roda prazna** (treći tabulator stoji, polje je
  prazno) - to admin prihvata.

## Pravila po kojima je pisano

1. **Svaka reč mora da ima jasan crtež.** Reč koju sedmogodišnjak ne prepozna
   na slici nije ušla, koliko god bila česta. Zato ovde nema ni jednog
   apstraktnog pojma.
2. **Unutar jedne lekcije reči moraju da se razlikuju NA SLICI.** Ponuđena tri
   odgovora u igri dolaze iz iste lekcije - ako su dve slike slične, dete
   pogađa umesto da zna. Mesta gde je to tesno su popisana na dnu.
3. **Bez medveda** (`der Bär`) - to je maskota, pa bi se u igri pojavila kao
   ponuđeni odgovor.
4. **Boje i brojevi idu prvi**, jer nemaju član. Dete prvo savlada kako
   aplikacija radi, pa tek u drugoj lekciji sreće „der/die/das".
5. **Životinje su druga lekcija**, ne četvrta - to je najjači mamac koji imamo
   i ne treba ga trošiti kasno.


## Lekcija 1: Boje (8 reči)

Nema roda, nema člana - najblaži mogući start. Dete prvo nauči da aplikacija radi, pa tek onda sreće „der/die/das".

```
rot	crvena	
blau	plava	
gelb	žuta	
grün	zelena	
schwarz	crna	
weiß	bela	
orange	narandžasta	
rosa	roze	
```

## Lekcija 2: Životinje (10 reči)

Druga lekcija namerno - ovo je mamac. Ovde dete prvi put čuje član uz reč.

```
Hund	pas	der
Katze	mačka	die
Vogel	ptica	der
Fisch	riba	der
Pferd	konj	das
Kuh	krava	die
Schwein	svinja	das
Hase	zec	der
Maus	miš	die
Elefant	slon	der
```

## Lekcija 3: Brojevi do deset (10 reči)

Cifra na sličici. Prvak cifre zna i pre nego što nauči slova.

```
eins	jedan	
zwei	dva	
drei	tri	
vier	četiri	
fünf	pet	
sechs	šest	
sieben	sedam	
acht	osam	
neun	devet	
zehn	deset	
```

## Lekcija 4: Porodica (7 reči)

„Mama" i „Papa", ne „Mutter" i „Vater" - to je ono što dete tog uzrasta stvarno govori.

```
Mama	mama	die
Papa	tata	der
Oma	baka	die
Opa	deka	der
Schwester	sestra	die
Bruder	brat	der
Baby	beba	das
```

## Lekcija 5: Telo (8 reči)

```
Kopf	glava	der
Auge	oko	das
Nase	nos	die
Mund	usta	der
Ohr	uvo	das
Hand	ruka	die
Fuß	stopalo	der
Bauch	stomak	der
```

## Lekcija 6: Hrana i piće (10 reči)

```
Brot	hleb	das
Milch	mleko	die
Apfel	jabuka	der
Banane	banana	die
Ei	jaje	das
Käse	sir	der
Saft	sok	der
Wasser	voda	das
Kuchen	kolač	der
Suppe	supa	die
```

## Lekcija 7: Igračke (8 reči)

Bez medvedića - to je maskota, ne gradivo.

```
Ball	lopta	der
Puppe	lutka	die
Auto	auto	das
Buch	knjiga	das
Zug	voz	der
Flugzeug	avion	das
Trommel	bubanj	die
Roller	trotinet	der
```

## Lekcija 8: Odeća (8 reči)

```
Schuh	cipela	der
Hose	pantalone	die
T-Shirt	majica	das
Jacke	jakna	die
Mütze	kapa	die
Kleid	haljina	das
Socke	čarapa	die
Schal	šal	der
```

## Lekcija 9: Kuća (8 reči)

```
Haus	kuća	das
Tür	vrata	die
Fenster	prozor	das
Tisch	sto	der
Stuhl	stolica	der
Bett	krevet	das
Lampe	lampa	die
Uhr	sat	die
```

## Lekcija 10: Napolju (8 reči)

```
Sonne	sunce	die
Mond	mesec	der
Stern	zvezda	der
Baum	drvo	der
Blume	cvet	die
Regen	kiša	der
Schnee	sneg	der
Wolke	oblak	die
```

---

## Gde je crtež tesan (za ilustratora)

Ovo nisu greške u spisku nego mesta gde loša ilustracija obara igru. Na svakom
od njih tri ponuđena odgovora mogu da se slijú u jedno:

- **Porodica:** `Mama`/`Oma` i `Papa`/`Opa` razlikuju se samo po godinama, a
  `Schwester`/`Bruder` samo po polu. Razlika mora da se vidi iz prve, bez
  gledanja u detalje.
- **Napolju:** `Regen`, `Schnee` i `Wolke` su sve tri oblak sa nečim. Ovo je
  najtesnije mesto u celom spisku.
- **Hrana:** `Milch`, `Wasser` i `Saft` su tri pića. Boja tečnosti mora da nosi
  razliku - belo, providno, narandžasto.
- **Odeća:** `Schuh` i `Socke` idu na isto mesto na telu.

## Šta namerno NIJE ušlo

- **Pozdravi** (`Hallo`, `Tschüss`, `danke`, `bitte`). Ne mogu da se nacrtaju, a
  pravilo je da svaka reč ima sliku. **Predlog: dete ih uči od medveda.** On
  kaže „Hallo" pri svakom otvaranju i „Tschüss" na kraju - to je svakodnevno
  ponavljanje kroz celu godinu, jače od jedne sličice u albumu.
- **Glagoli** (`springen`, `essen`, `schlafen`). Lepo se crtaju, ali se ne mogu
  staviti u scenu - dvorište skuplja stvari, ne radnje. Za drugu fazu, ako
  scena dobije i radnje.
- **Množina.** Ne uči se, pa je kolona svuda prazna.

## Šta ovaj spisak otključava

Rečnik je bio jedina stavka od koje je zavisilo sve ostalo. Sa njim
zaključanim mogu da krenu i **85 ilustracija** i **85 snimaka nemačkih reči**,
paralelno i nezavisno jedno od drugog.

Kod i dalje čeka pilot petog razreda, po odluci od 22.08.

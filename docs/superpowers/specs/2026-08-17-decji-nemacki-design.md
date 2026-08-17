# zack!, aplikacija za učenje nemačkog u osnovnoj školi

Datum: 17.08.2026.
Status: dizajn odobren, čeka plan implementacije

## 1. Šta pravimo i zašto

Gejmifikovana aplikacija za učenje nemačkog za đake 5-8. razreda osnovne škole,
vezana za lekcije udžbenika koji se stvarno koristi u njihovoj školi. Roditelj
plaća mesečnu članarinu i dobija izveštaj o napretku, dete igra.

Ključna prednost nad besplatnom konkurencijom (Duolingo i slično) nije kvalitet
igre nego **poklapanje sa školom**. Dete ne vežba „nemački uopšte" nego baš onu
lekciju koju rade te nedelje, a roditelj kupuje rešenje za konkretan bol, a to je
kontrolni u petak.

Nataša je pisala za udžbenike koji se koriste u osnovnim školama, pa poznaje
redosled gradiva iz prve ruke. To je prednost koju konkurencija ne može da kopira.

### Autorska prava

Redosled tema, vokabular i gramatički progres iz nastavnog plana su činjenice i
slobodno se prate. Tekstovi, zadaci i ilustracije iz udžbenika se **ne prepisuju**,
čak ni oni koje je Nataša pisala, jer prava drži izdavač. Sav sadržaj u aplikaciji
je originalan i samo prati isti redosled.

## 2. Korisnici

**Dete, 11-14 godina.** Čita tečno, kuca, samo koristi telefon. Igra samo ako je
zabavno u prvih 30 sekundi. Odustaje od svega što liči na domaći zadatak.

**Roditelj.** Plaća, ne loguje se često, hoće da zna dve stvari: da li dete radi
nešto i da li će proći kontrolni. Ne čita duge izveštaje.

## 3. Obim prve verzije

Jedan razred (5.), cela školska godina, oko 12 lekcija, sve igre. Jedan izdavač.

Razlog: roditelj koji plati u septembru mora da ima sadržaj do juna, inače
otkazuje. Istovremeno, jedan razred je dovoljno mali da se proveri da li iko
uopšte plaća pre nego što se uloži u preostala tri razreda.

Procena autorskog rada: 45-60 minuta po lekciji, dakle **10-12 sati po razredu**.
Ovo je jedini broj koji odlučuje da li projekat izlazi.

## 4. Platforma

Sajt na telefonu (PWA), isti Next.js i Supabase kao postojeća platforma. Može da
se doda na početni ekran telefona.

Razlozi: ista baza i isti kod, naplata preko postojećeg NestPay-a bez provizije
prodavnice, izmene idu odmah bez čekanja odobrenja. Prava aplikacija za App Store
i Google Play dolazi u obzir tek ako se pokaže da roditelji plaćaju.

## 5. Sadržajni model

Ovo je srce cele stvari. Sve igre se hrane iz jedne strukture, tako da nova
lekcija znači popunjavanje obrasca, bez ijedne linije novog koda.

```
udzbenik
  izdavac, naziv, razred

  lekcija
    broj, naziv, teme

    reci[]        20-30 komada
      de, sr, rod (der/die/das/nema), mnozina, vrsta_reci

    recenice[]    6-8 komada
      de, sr, tip (izjavna / pitanje / odgovor)

    pravilo       1 komad
      naslov, tekst (3 rečenice), primer
```

Mapiranje podataka na igre:

| Igra | Šta koristi |
|---|---|
| Parovi, Brzo biranje, Diktat | `reci.de`, `reci.sr` |
| Der-Die-Das sortiranje i skakač | `reci.rod` |
| Množina | `reci.mnozina` |
| Slaganje rečenice | `recenice.de` |
| Popuni prazninu | `recenice.de` sa označenom prazninom |
| Odgovori u čatu | `recenice` tipa pitanje i odgovor |
| Konjugacija | zajednička tabela glagola, ne po lekciji |
| Milioner, Test pred kontrolni | sve gore, iz obrađenih lekcija |

Konjugacija glagola je jedina igra koja se ne hrani po lekciji nego iz zajedničke
tabele glagola, jer se isti glagoli ponavljaju kroz sve lekcije. Lekcija samo
kaže koji su glagoli aktivni.

## 6. Igre

### Iz spiska reči

**Der-Die-Das sortiranje.** Svlačenje kartice u tri korpe, na vreme. Rod imenica je
ono što našim đacima najteže ulazi, a mehanika je sama po sebi zabavna.

**Parovi.** Reč i prevod, klasična memorija. Dobra za zagrevanje na početku lekcije.

**Brzo biranje.** Četiri ponuđena odgovora, tajmer, kombo množilac za niz tačnih.

**Množina.** Haus pa Häuser. Jednostavno se meri, a đaci se muče.

**Diktat.** Dete vidi prevod ili čuje reč, kuca nemačku reč. Najteže i najbolje
pamti, pa ide poslednje u nizu.

### Iz rečenica

**Slaganje rečenice.** Svlačenje pločica sa rečima u tačan redosled. Glagol na
drugom mestu, razdvojni glagoli. Ovo je najveći problem naših đaka i nijedna
besplatna aplikacija to ne radi kako treba.

**Popuni prazninu.** Nastavci, članovi, oblici glagola. Motor već postoji u
platformi (`fill_blank`, tačno 6 crta kao marker).

**Odgovori u čatu.** Scena izgleda kao poruke na telefonu, dete bira odgovor.
Deci deluje kao igra, a vežba komunikaciju.

### Iz zajedničke tabele glagola

**Konjugacija na vreme.** Popunjavanje ich/du/er tabele protiv sata. Ne hrani se
po lekciji, nego iz zajedničke tabele glagola, a lekcija samo kaže koji su
glagoli aktivni.

### Arkadna igra

**Der-Die-Das skakač.** Lik trči, ispred njega tri platforme obeležene der, die,
das. Imenica stoji na ekranu, dete tapne na tačnu i lik skoči. Pogrešno znači pad
i gubitak srca.

Ovo je jedina igra u kojoj je skakanje sama mehanika, a ne nagrada, i zato deluje
kao prava igrica. Ista mehanika kasnije radi i za množinu i za jak/slab glagol,
bez novog koda.

### Testovi

**Test pred kontrolni.** Na kraju svake lekcije, meša sve tipove zadataka iz te
lekcije. Rezultat je ono što ide roditelju u izveštaj.

**Milioner.** Posle svake celine od 3-4 lekcije. 12-15 pitanja, rastuća težina,
tri pomoći: pola-pola, pitaj profesorku (kratak podsetnik na pravilo), zameni
pitanje. Motor već postoji u platformi.

Milioner i Test pred kontrolni smeju da pitaju **samo obrađeno gradivo**, iz te i
ranijih lekcija. Testiranje neobrađene gramatike demotiviše dete i to je već
utvrđeno pravilo na platformi.

## 7. Gejmifikacija

**Nagradna arkada preko svih igara.** Tačni odgovori se skupljaju u udarce. Posle
pet tačnih dete dobija penal, šut na koš ili skok preko provalije, tri do četiri
sekunde. Pravi se jednom i radi iznad svake igre, i iznad sortiranja i iznad
diktata.

Razlog za ovakvu podelu: ako svaka igra ima svoju arkadu, praviš deset igara.
Ovako se pravi jedna arkadna igra i jedan nagradni sloj, a osećaj igraonice se
dobija u celoj aplikaciji.

**Srca.** Lokalni životi unutar igre, ne dnevni limit koji zaustavlja dete.
Aplikacija je plaćena, pa nema smisla da roditelj plati a dete bude zaustavljeno
posle tri greške. Motor za srca već postoji.

**Niz dana.** Broj dana zaredom sa bar jednom odigranom igrom.

**Duel jedan na jedan.** Dete pozove drugara na kratak dvoboj u nekoj igri.
**Nema rang-liste**, ni razredne ni opšte, jer ista deca uvek završe na dnu i
odustanu.

### Album sa sličicama

Ovo je glavni sistem napredovanja i zamenjuje bodove, novčiće i avatar. Nema
odvojenog sistema nagrada koji treba održavati, jer je nagrada isto što i sadržaj.

**Svaka naučena reč je sličica.** Album ima tačno onoliko mesta koliko lekcija ima
reči. Prazno mesto je isprekidan kvadrat sa brojem i znakom pitanja, i to je ceo
prikaz napretka. Dete pogleda stranicu i vidi šta mu fali, bez ijednog procenta.

**Album ide po lekciji, ne po godini.** Dvadeset četiri mesta se dovršavaju i to
se vidi. Dvesta četrdeset mesta nikad ne deluju blizu kraja i dete odustane.
Godišnji pregled postoji samo kao polica sa dvanaest malih albuma.

**Boja sličice je rod imenice.** Plava za der, crvena za die, žuta za das, mastilo
za glagole i ostale vrste reči. Dete vidi rod pre nego što stigne da pročita reč,
a to su iste tri boje koje se koriste u nemačkim učionicama, pa mu ostaju i kad
promeni školu.

**Kesica.** Odigrana igra otvara kesicu sa tri do pet sličica. Uvek se dobija
nešto, ali se ne zna šta.

**Sjajne sličice su izuzeci.** Nepravilna množina, imenice koje varaju sa rodom,
jaki glagoli. Najteže je najređe i najlepše, pa dete juri baš ono što najviše
treba da nauči. Ovo je jedino mesto u proizvodu gde motivacija i pedagogija guraju
u istom pravcu, i zato se sjaj **nikad** ne koristi ni za šta drugo.

### Lepljenje sličice

Dete lepi sličicu samo, aplikacija je ne ubacuje. Razlog nije ukras: da bi je
zalepilo, dete mora da nađe njeno mesto, a to znači da još jednom pročita reč.
To je dodatno izlaganje reči prerušeno u nagradu.

- **Obična reč:** dete tapne sličicu, ona odleti na mesto uz kratak zvuk. Sekunda.
- **Imenica:** album se skupi na tri polja po bojama (der, die, das) i dete mora
  da spusti sličicu u tačno polje. Pogrešno znači *Ups!* i sličica se vraća u
  ruku. Lepljenje je time postalo vežba roda, bez pravljenja nove igre.
- **Uvek postoji dugme „zalepi sve".** Ono što je zabavno prve nedelje je teret u
  petoj, i dete mora da ima izlaz.

### Bledeće sličice

Album meri šta je dete ikad naučilo, a ne šta još uvek zna. Bez korekcije bi
roditelju slao broj koji preuveličava znanje.

Zato sličica koja se par nedelja ne ponavlja **posivi, ali ne nestaje**. Jedno
tačno odgovaranje je vraća u boju. Time album ostaje iskren, a stare reči dobijaju
razlog da se vrate na ponavljanje.

**Nikad se ne kaže da je dete nešto izgubilo.** Poruka je da album treba osvežiti,
ne da je znanje propalo. Ovo je uslov pod kojim je bledenje uopšte prihvatljivo.

## 8. Roditeljski deo

### Nedeljni izveštaj mejlom

Glavni kanal, nedeljom uveče. Sistem za nedeljne izveštaje već postoji u platformi
i prepakuje se. Sadrži tačno četiri podatka i jednu preporuku:

1. **Koliko je vežbalo.** Broj dana i ukupno minuta.
2. **Koliko je sličica sakupljeno.** „37 od 240."
3. **Gde je u odnosu na školu.** „Lekcija 5 od 12."
4. **Rezultat Testa pred kontrolni**, ako je urađen.
5. **Jedna konkretna preporuka** za sledeću nedelju, izvedena iz najslabije
   oblasti.

Broj sličica je namerno glavni podatak umesto procenta tačnosti. „37 od 240"
razume svako iz prve, a „62% tačnosti" ne razume niko. Roditelj i dete gledaju
isti broj i nema dva sistema merenja.

Procenti po oblasti (reči, rod imenica, red reči, množina) postoje, ali samo na
roditeljskoj stranici u aplikaciji, ne u mejlu.

### Pravilo o neaktivnosti

Ako dete nije vežbalo, **ne šalje se prekor** ni detetu ni roditelju. Šalje se
kratka konstatacija bez podvlačenja i bez uzvičnika. Posle tri prazne nedelje
zaredom izveštaj se gasi i roditelj se pita da li mu uopšte treba. Isto pravilo
već važi za newsletter.

### Stranica u aplikaciji

Roditeljski pregled sa istim podacima, ali detaljnije i razdvojeno po detetu.

## 9. Nalozi

**Roditelj je vlasnik naloga.** Otvara ga svojim mejlom, prihvata uslove, plaća.
Unutar naloga pravi profil za svako dete: ime, razred, udžbenik.

**Dete se prijavljuje korisničkim imenom i PIN-om od četiri cifre.** Bez mejla,
bez lozinke koju bi zaboravilo.

Pravni razlog: kod nas dete mlađe od 15 godina ne može samo da da pristanak za
obradu podataka, potreban je roditelj. Pošto ciljamo 11-14, roditelj mora biti
vlasnik naloga. To se poklapa sa tim ko ionako plaća.

Dete ne vidi račune, naplatu ni otkazivanje.

## 10. Naplata

Jedna mesečna cena, orijentaciono 1.200-1.500 din, pokriva **do troje dece** u
istom nalogu.

Razlog za porodičnu cenu: skraćuje razgovor o ceni, roditelj sa dvoje dece ne
plaća duplo i ne deli nalog, a vrednost deluje veće.

Naplata ide preko postojećeg NestPay-a, istim putem kao članstvo koje već radi
na platformi.

## 11. Šta namerno NIJE u prvoj verziji

- Govor i prepoznavanje izgovora
- Snimljeni audio (koristi se čitanje iz pretraživača, besplatno i dovoljno dobro
  za pojedinačne reči)
- AI sagovornik
- Native aplikacija za App Store i Google Play
- Rang-liste bilo koje vrste
- Deo za nastavnice i školska odeljenja
- Razredi 1-4
- Godišnja pretplata
- Besplatan deo (freemium)
- Menjanje duplikata sličica sa drugarom

Svaka od ovih stavki može doći kasnije, ali nijedna nije uslov da prva verzija
ima smisla.

Menjanje duplikata je najjača stvar iz pravih albuma i savršeno se spaja sa duelom
jedan na jedan, ali je i najveći posao od svega nabrojanog, pa čeka dok se ne vidi
da li deca uopšte ostaju.

## 12. Šta se ponovo koristi iz postojeće platforme

- Motor za vežbe i tipovi zadataka (`exercise-kind`, `fill_blank`)
- Milioner
- Srca i maskota
- Praćenje napretka po lekciji
- Nedeljni izveštaj
- Mejl sistem preko Resend-a
- Mesečna naplata preko NestPay-a
- Supabase autentifikacija i RLS

Napomena o RLS: već je jednom utvrđeno da vežbe nasleđuju vidljivost lekcije i da
mogu biti javno čitljive. Kod dečje aplikacije to mora da se proveri pre puštanja,
jer se ovde radi o maloletnicima.

## 13. Odluke koje se donose pre početka izrade

**Koji izdavač prvi. ODLUČENO 17.08.2026: Maximal.** Nataša je pisala priručnik
za taj komplet, pa poznaje redosled gradiva iz prve ruke. To je prednost koju
konkurencija ne može da kupi i glavni razlog zašto ovaj proizvod ima smisla.

U bazi je zaveden „Maximal 1" za 5. razred. **Podelu na tomove po razredima treba
potvrditi pre unosa druge lekcije** (da li 5. razred stvarno ide uz Maximal 1),
ali to ne blokira ništa, jer se prva verzija ionako radi samo za jedan razred.

**Žig za „Zack". ZATVORENO 17.08.2026: Nataša je proverila, ime je slobodno.**

Napomena o poreklu nalaza: moja pretraga tog dana nije našla nijedan nemački
komplet za decu sa tim imenom, ali nijedan registar žigova mi nije bio dostupan
(TMview blokiran, švajcarski registar vraća 404, naš e-registar ima neispravan
sertifikat), pa je moj deo bio samo odsustvo nalaza. Potvrdu je dala Nataša.

Ranije odbačeno ime Hoppla je palo baš na ovoj proveri, pa je ona i uvedena kao
korak. Vidi odeljak o imenu.

## 14. Ime i identitet

**Ime: zack!** Uvek u paru sa opisom: **zack! nemački za osnovce**, jer roditelj
iz samog imena ne vidi da je reč o nemačkom.

*Zack* na nemačkom znači „u tren", a *zack, zack* znači „brzo, brzo". Razlozi:

1. **To je zvuk sličice koja upada na svoje mesto.** Ime i glavna mehanika su ista
   stvar, a to se retko pogodi.
2. **Jedan slog.** Naša deca ga izgovaraju i kucaju bez greške.
3. **Vezuje se za uspeh, ne za grešku.** Poruka pri tačnom odgovoru je *Zack!*,
   a pri grešci ide neutralno *Ups!*, koje nije ničije ime.

**Poznata mana:** kod nas mnogi čitaju Zack kao englesko muško ime, pa se nemačka
veza delimično gubi. Odluka je doneta uz svest o tome.

**Odbačeno ime: Hoppla.** Provereno 17.08.2026. „Hoppla 1-4" je postojeći nastavni
komplet za nemački kao drugi jezik za vrtić i niže razrede osnovne škole, izdavač
Schulverlag plus AG sa Lehrmittelverlag Zürich, sajt hoppla.ch. Isti predmet, isti
uzrast, ista namena. Odbačeno i zbog pretrage (ko traži „hoppla nemački" nalazi
njih) i zbog nemogućnosti širenja na nemačko govorno područje.

**Pouka za svako sledeće ime:** kratki nemački uzvici su područje koje su nemački
izdavači već pokupili, jer i oni prvo posežu za njima kad prave materijal za decu.
Svako sledeće ime tog tipa nosi isti rizik.

**Domeni.** Provereno 17.08.2026: `zack.rs` slobodan, `nemackizadecu.rs` slobodan.
Preporuka: `zack.rs` kao brend, `nemackizadecu.rs` kao ulaz iz pretrage.
Zauzeti su `zak.rs`, `juhu.rs`, `klik.rs`, `klick.rs`, `hopp.rs`.
`losgehts.rs` je odbačen jer je *Los geht's* ime Cornelsenovog udžbenika, a i zato
što „los" kod nas znači loše.

**Vizuelni pravac: album sa sličicama.** Svetla podloga, papir, bez tamne gejmerske
teme. Znak je sama nalepnica: reč `zack!` na crvenoj podlozi sa belom ivicom,
blago iskošena. Nema crteža, nema maskote, pa ne treba ilustrator i radi na
ikonici od 28 piksela.

**Boje:** crvena `#E5342A` (znak i die), plava `#0B54C9` (der), žuta `#FFC400`
(das), mastilo `#16161A` (glagoli, slova, ivice), papir `#FCFBF7`. Preliv za sjaj
samo na izuzecima.

**Slova:** Archivo Black za naslove, Archivo za tekst. Oba besplatna sa Google
Fonts, sa punim našim i nemačkim znacima, i mnogo ređa od Intera i Poppinsa.

**Glas.** Nikad prekor, ni detetu ni roditelju. Detetu kratko i vedro, roditelju
mirno i činjenično. Greška uvek daje tačan odgovor odmah, bez „pokušaj ponovo".
Ime se koristi samo u trenutku uspeha (*Zack!*), nikad u trenutku greške.

**Šta se ne radi:** plišana maskota, tamna gejmerska tema, zelena boja (svaka
zelena aplikacija za jezike izgleda kao Duolingo), nemačka zastava i pivske krigle,
sjaj na bilo čemu osim izuzetaka, i Hartweger logotip u dečjem delu. Natašino ime
stoji na roditeljskoj strani, gde gradi poverenje, i nigde više.

## 15. Redosled izgradnje

1. Sadržajni model i admin obrazac za unos lekcije
2. Motor za igre koje se hrane samo iz spiska reči (Parovi, Brzo biranje,
   Der-Die-Das sortiranje, Množina, Diktat)
3. Album: sličice, kesica, lepljenje, sjajni izuzeci, staza lekcija, srca, niz dana
4. Nagradna arkada
5. Igre iz rečenica (Slaganje, Popuni prazninu, Čat, Konjugacija)
6. Der-Die-Das skakač
7. Test pred kontrolni i Milioner
8. Roditeljski nalog, profili dece, PIN prijava
9. Nedeljni izveštaj
10. Naplata i porodična pretplata
11. Bledeće sličice i ponavljanje starih reči
12. Duel jedan na jedan

Prva prava provera je posle koraka 3: pokazati nekolicini dece i videti da li
uopšte hoće da igraju drugi put. Ako neće, dalje ulaganje nema smisla.

Ovaj dokument pokriva ceo proizvod, ali se ne sprovodi kroz jedan plan. Prvi plan
implementacije obuhvata korake 1-4, zaključno sa nagradnom arkadom, jer je to
najmanja celina koja se može pokazati detetu. Ostalo dobija svoje planove kad
prva celina prođe proveru.

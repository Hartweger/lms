# zack! - lekcija „učenje pa razrada" + igre iz rečenica - dizajn

Datum: 20.08.2026. Odobrila Nataša u razgovoru, isti dan (uz dve dopune:
faza učenja rečenica, pa faza učenja na početku CELE lekcije).

Prva od tri dogovorene faze širenja zack! sadržaja za 5. razred:
1. **ova specifikacija: struktura lekcije + igre iz rečenica**
2. test pred kontrolni (posebna specifikacija, oslanja se na rečenice)
3. duel (posebna specifikacija, čista mehanika povrh postojećih pitanja)

## Nova struktura lekcije: prvo učenje, pa razrada

Trenutno lekcija baca dete pravo u igre (parovi kao najlakša glume uvod).
Novo: svaka lekcija počinje FAZOM UČENJA, pa tek onda razrada kroz vežbe.

Tok lekcije:

1. **Učenje reči** - reči lekcije dolaze u malim grupama (5-6 kartica:
   nemačka reč, naš prevod, boja roda, množina, oznaka izuzetka), posle
   svake grupe kratka provera dodirom (3-4 brza pitanja o upravo viđenim
   rečima). Bez srca, bez kazne - uči se rukama, u zalogajima.
2. **Vežbe od reči** - postojećih šest igara (parovi, brzo biranje, skakač,
   rod, množina, diktat), netaknute.
3. **Rečenični blok** (samo gde rečenice postoje):
   a. **Učenje rečenica „Pokaži pa složi"** - rečenica se prikaže CELA sa
      prevodom, pa se rasturi u pločice i dete je odmah složi dok je sveža.
      Bez srca, bez kazne - pogrešan potez samo vrati pločicu.
   b. **Slagalica reda reči** - pločice izmešane, BEZ prethodnog prikaza.
      Vežba srž gramatike 5. razreda (glagol na drugom mestu, imperativ).
   c. **Dopuna rečenice** - rečenica sa prazninom + 4 ponuđena oblika,
      ispod prevod kao oslonac. Vežba oblike, članove, determinative.

Otključavanje (namerno samo dva katanca, mirna kao i katanac članstva):
- učenje reči, jednom prođeno, otključava vežbe od reči i učenje rečenica;
- učenje rečenica, jednom prođeno, otključava slagalicu i dopunu.

Obe faze učenja ostaju dostupne UVEK, i posle otključavanja - vraćanje na
njih je poželjno, ne korak unazad. Nestanak ili kvar zapisa o prolasku pada
u korist deteta: vežbe ostaju otključane.

Faza učenja reči ne traži nikakav nov sadržaj (radi iz postojeće tabele
reči), pa automatski važi za SVE lekcije, i prelazne Maximal. Rečenični blok
se pojavljuje samo u lekcijama koje imaju rečenice; lekcija bez rečenica ga
prosto nema.

## Sadržaj: tabela `zack_recenice`

Nova tabela u istom Supabase projektu (rzmyglynjcygsbicssbt), vezana za
lekciju kao i reči. Kolone po rečenici:

| kolona | značenje |
|---|---|
| `lekcija_id` | lekcija kojoj rečenica pripada |
| `redni_broj` | redosled unutar lekcije |
| `de` | cela nemačka rečenica, sa završnim znakom |
| `sr` | naš prevod |
| `praznina` | tačan oblik koji se vadi za dopunu (npr. „isst"); mora se javiti TAČNO JEDNOM u `de` |
| `distraktori` | tačno 3 pogrešna oblika za dopunu, svi različiti od praznine i međusobno |
| `rec_id` | glavna reč - reč IZ TE LEKCIJE na koju se knjiže tačno/greška |
| `samo_dopuna` | da/ne - rečenice sa više ispravnih redosleda ne ulaze u slagalicu ni u učenje rečenica |

Upis ODBIJA zapis koji krši pravila (praznina se ne javlja tačno jednom,
distraktor jednak praznini ili dupliran, glavna reč nije iz te lekcije).
Pokvaren podatak ne sme da stigne do deteta; ako ipak stigne, pada u korist
deteta (vrhovno pravilo).

RLS: ista vidljivost kao reči lekcije (nasleđuje vidljivost lekcije).

## Igre: generisanje pitanja

Nova lib datoteka `lib/zack/recenice.ts` po šablonu `pitanja.ts` (ubrizgan
rng, čiste funkcije, testovi uz svaku), plus proširenje za učenje reči.

Novi tipovi u `Igra`: `"ucenje-reci"`, `"ucenje-recenica"`, `"slagalica"`,
`"dopuna"`.

- „Učenje rečenica" NIJE nova vrsta pitanja nego drugi način prikaza
  slagalice (isti odnos kao skakač prema rodu): isto pitanje, telo igre prvo
  pokaže celu rečenicu sa prevodom, pa je rasturi; greške se ne broje i ne
  troše srce.
- „Učenje reči" koristi postojeće vrste pitanja za mini proveru (brzo
  biranje iz upravo viđene grupe), pa ni ono ne uvodi novu vrstu pitanja -
  uvodi samo grupisanje kartica i blaži režim (bez srca, greške se ne
  knjiže).

Tipovi rečeničnih pitanja:

```
{ igra: "slagalica"; recenicaId; recId; plocice: string[]; tacan: string[]; znak: string; prevod: string }
{ igra: "dopuna"; recenicaId; recId; saPrazninom: string; opcije: string[]; tacan: string; prevod: string }
```

Pravila slagalice (važe i za učenje rečenica):
- Pločice = reči rečenice bez završnog znaka; znak (`!`, `?`, `.`) stoji
  vidljiv sa strane, van pločica - fer nagoveštaj vrste rečenice.
- **Velika slova ne odaju rešenje**: prva reč rečenice se na pločici piše
  malim slovom, OSIM ako je imenica, ime ili Sie (nemačke imenice ionako
  nose veliko slovo). Konačan prikaz složene rečenice aplikacija sama
  ispravi na pravopisno tačan oblik. Bez ovoga bi kod imperativa („Mach das
  Buch auf!") veliko M odalo poentu.
- U slagalicu ulaze samo rečenice sa JEDNIM ispravnim redosledom (kratke,
  3-6 pločica). Dvosmislene („Heute spiele ich..." / „Ich spiele heute...")
  nose `samo_dopuna = da`.
- Provera tačnosti poredi niz pločica sa `de` (bez znaka, bez razlike u
  velikom slovu prve reči).

Pravila dopune:
- `saPrazninom` = `de` sa prazninom umesto oblika iz `praznina`
  (prikaz praznine: tačno 6 crta, postojeća konvencija).
- `opcije` = praznina + 3 distraktora, promešano postojećim `ponudjeni`.

Pogrešan odgovor u VEŽBAMA troši srce kao i u ostalim igrama. U fazama
učenja srca ne postoje. Ništa se nikad ne oduzima.

Za otključavanje se pamti da je faza učenja jednom prošla (po detetu i
lekciji, uz postojeće zapise o igrama).

## Nagrade i ponavljanje: sve preko glavne reči

- Tačan odgovor u SVAKOJ fazi knjiži tačno za svoju reč (`rec_id` kod
  rečenica) → kesica i album rade BEZ IZMENA (kesica već prima „šta je
  tačno odgovoreno, a još nema"). Važi i u fazama učenja: tačan odgovor u
  mini proveri i tačno složena rečenica zarađuju - dete ne sme da radi „za
  džabe" samo zato što je faza nazvana učenjem.
- Greška u VEŽBAMA se knjiži na reč u `zack_greske` → postojeće ponavljanje
  (prioritet: greške > izbledele) samo po sebi bira i te reči; kad izabrana
  stara reč ima rečenice, njene rečenice smeju u tok rečeničnih igara.
  Greške u fazama učenja se NE knjiže i ne troše srce.
- Milioner se NE dira ovom fazom.

## Sadržaj: ~120 rečenica, pregled pre upisa

- ~10 rečenica po lekciji, za svih 12 lekcija 5. razreda.
- Strogo unutar reči i gramatike obrađene DO te lekcije (isto pravilo kao
  Milionerovo `od_lekcije <= lekcija`), oslonjene na doslovne primere iz
  Pravilnika 15/2018 gde god može (nacrt: `sajt/peti-razred-program-nacrt.md`).
- Nataša dobija ceo spisak kao pregledan dokument PRE upisa u bazu; nesigurna
  mesta nose oznaku PROVERITI, kao u nacrtu programa.
- Rečenice ne oslovljavaju dete po rodu (vrhovno pravilo o obraćanju).
- Slika nikad u pitanju - važi i ovde; rečenične igre nemaju slike.

## Admin

Postojeća admin strana za zack dobija upis rečenica u tab-kolonama, po uzoru
na upis reči: `lekcija / de / sr / praznina / distraktori / glavna reč /
samo_dopuna`. Ista provera pravila i pri upisu.

## Redosled izrade (grubo - detalji u planu)

1. SQL: tabela `zack_recenice` + zapis o prolasku učenja + RLS
   (PRVO SQL, PA DEPLOY - naučena lekcija).
2. `lib/zack/recenice.ts` + učenje reči (grupisanje, blaži režim) + testovi.
3. UI: faza učenja reči, učenje rečenica, slagalica i dopuna; novi raspored
   ekrana lekcije (učenje → vežbe → rečenični blok) sa dva katanca.
4. Admin upis rečenica.
5. Nacrt ~120 rečenica → Natašin pregled → upis u bazu.
6. Deploy + smoke test (obavezan), pa proba na ZK-UDAM („Proba 5").

## Van opsega (namerno)

- Test pred kontrolni i duel - sledeće faze.
- Slušne igre - audio se ne uvodi (stojeća odluka).
- Rečenice za prelazni Maximal sadržaj - samo `nemacki-5-razred` (faza
  učenja reči, koja ne traži sadržaj, važi svuda).
- Milioner ostaje kakav jeste.

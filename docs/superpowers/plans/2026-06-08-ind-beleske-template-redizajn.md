# IND beleške (1:1) — redizajn šablona — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. NAPOMENA: GAS funkcije pokreće Nataša iz Apps Script editora (clasp run nije dostupan); verifikacija ide čitanjem dokumenta preko Google Drive konektora.

**Goal:** Individualni (1:1) šablon beleški se generiše čist, sa logom, punim zaglavljem (uklj. kalendar/email profesorke/materijale nivoa) i tačnim brojem numerisanih, klikabilnih termina po paketu.

**Architecture:** Master Google Doc (`IND_BELESKE_TEMPLATE_ID`) sadrži samo logo + zaglavlje sa placeholderima + marker `{{TERMINI}}` + anketu. GAS `kreirajIndBeleske` kopira šablon, popuni placeholdere, i programski ubaci N termin-blokova (Heading 2 + 7 sekcija) na mesto markera, gde N = broj časova paketa (prosleđen sa sajta). Sajt (`grant-access.ts`) prosleđuje broj časova, rok, kalendar i email profesorke — sve već dostupno.

**Tech Stack:** Google Apps Script (DocumentApp, DriveApp, UrlFetchApp), clasp, Next.js/TS (`grant-access.ts`), Supabase.

**Spec:** `docs/superpowers/specs/2026-06-08-ind-beleske-template-redizajn-design.md`

---

## File Structure

- **Modify** `automatizacija/grupni-webapp/Code.gs` — konstante + helperi + nova `kreirajIndBeleske` + proširen `enrollIndividual`.
- **Create** `automatizacija/grupni-webapp/SetupTemplate.gs` — jednokratni `rebuildIndTemplate` (gradi master šablon) + `testIndBeleske` (test harness). Drži setup/test odvojeno od produkcionog `Code.gs`.
- **Modify** `sajt/LMS/lms/src/lib/grant-access.ts` — proslediti `casova`, `rok`, `calendarUrl`, `profEmail` u `callGas("enrollIndividual", …)`.

Posle dovršetka: obrisati privremene `Cleanup.gs`, `DeliPrezentacije.gs` i `executionApi` iz manifesta.

---

## Task 1: GAS konstante i helperi

**Files:**
- Modify: `automatizacija/grupni-webapp/Code.gs` (dodati blok ispod postojećih konstanti, ~posle reda 27)

- [ ] **Step 1: Dodati konstante i helpere u Code.gs**

```javascript
// ───────── IND beleške redizajn ─────────
const LOGO_URL = 'https://kurs.hartweger.rs/logo.jpg';
const ANKETA_URL = 'https://forms.gle/w9PNpTFXe2w4LmPo8';

// nivo → folder materijala (prezentacije); deljeni "svako sa linkom → View"
const MATERIJALI_FOLDERI = {
  'A1.1': '1l9SHwl2kubXOIPVpmb8MCygTSRwP5rBv',
  'A1.2': '1vta6XgeCPAtC-Or-coZnmwUhpvi8bfH6',
  'A2.1': '1-StmUTFmYLnTrCHwHIO4oD37V8TOnMZ-',
  'A2.2': '1oCC0lFLA2_6ucYOOimqzwg1s9SdiTuHe',
  'B1.1': '12PVjryRusOtYg1JCrlynk-ZzYQNYQK8r',
  'B1.2': '1h_dgK2kzxheQj3NciJONVRni1o1LQ8u0',
  'B2.1': '1UPIs9QiCRtl69uEOcItCld-tH9yf5KC9',
  'B2.2': '1UPIs9QiCRtl69uEOcItCld-tH9yf5KC9'
};

// sekcije u svakom terminu: [oznaka, srpski podnaslov]
const IND_SEKCIJE = [
  ['TEMA', 'tema časa'],
  ['WORTSCHATZ', 'novi vokabular sa prevodom'],
  ['REDEMITTEL', 'korisne fraze i izrazi'],
  ['FEHLER', 'greške i ispravke'],
  ['GRAMMATIK', 'gramatika'],
  ['HAUSAUFGABE', 'domaći zadatak'],
  ['LOB', 'pohvala']
];

// fallback broj časova ako sajt ne prosledi (po nivou)
function brojCasovaZaNivo_(nivo) {
  var n = String(nivo || '');
  if (n.indexOf('A1') === 0) return 7;
  if (n.indexOf('FIDE') !== -1 || n.indexOf('FSP') !== -1) return 5;
  return 10;
}

// Ubaci jedan termin-blok (Heading 2 + 7 sekcija) počev od child-indeksa idx. Vraća sledeći idx.
function dodajIndTermin_(body, idx, broj) {
  var naslov = body.insertParagraph(idx++, 'Termin Nr. ' + broj + ' — Datum: ');
  naslov.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  for (var i = 0; i < IND_SEKCIJE.length; i++) {
    var oznaka = IND_SEKCIJE[i][0];
    var p = body.insertParagraph(idx++, oznaka + '   ' + IND_SEKCIJE[i][1]);
    p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    p.editAsText().setBold(0, oznaka.length - 1, true);
    body.insertParagraph(idx++, ''); // prazan prostor za sadržaj
  }
  return idx;
}

// Zameni placeholder klikabilnim linkom (label vodi na url). Ako nema placeholdera → ništa.
function postaviLink_(body, placeholder, label, url) {
  var found = body.findText(placeholder);
  if (!found) return;
  var el = found.getElement().asText();
  var s = found.getStartOffset();
  var e = found.getEndOffsetInclusive();
  el.deleteText(s, e);
  el.insertText(s, label);
  el.setLinkUrl(s, s + label.length - 1, url);
}

// Ukloni ceo red tabele koji sadrži dati placeholder (kad nema vrednosti).
function ukloniRedSaTekstom_(body, placeholder) {
  var found = body.findText(placeholder);
  if (!found) return;
  var el = found.getElement();
  while (el && el.getType() !== DocumentApp.ElementType.TABLE_ROW) { el = el.getParent(); }
  if (el) el.removeFromParent();
}
```

- [ ] **Step 2: clasp push**

```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && clasp push -f
```
Expected: `Pushed N files.` bez grešaka. (Sam push ne menja ponašanje produkcije — samo dodaje funkcije.)

- [ ] **Step 3: Commit (spec/plan repo nije isti kao GAS; GAS nije git) — preskoči commit za GAS, samo zabeleži u todo.**

---

## Task 2: Izgradi master šablon (jednokratno)

**Files:**
- Create: `automatizacija/grupni-webapp/SetupTemplate.gs`

- [ ] **Step 1: Napisati `rebuildIndTemplate` u SetupTemplate.gs**

```javascript
/**
 * JEDNOKRATNO: izgradi čist master šablon individualnih beleški od nule.
 * Logo u page-headeru, zaglavlje sa placeholderima, marker {{TERMINI}}, anketa.
 * Pokrenuti RUČNO iz editora. Ne poziva se iz doPost.
 */
function rebuildIndTemplate() {
  var doc = DocumentApp.openById(IND_BELESKE_TEMPLATE_ID);
  var body = doc.getBody();
  body.clear();

  // Logo u page-header (na svakoj strani)
  var header = doc.getHeader();
  if (!header) { header = doc.addHeader(); }
  header.clear();
  try {
    var blob = UrlFetchApp.fetch(LOGO_URL).getBlob();
    var img = header.appendImage(blob);
    var ratio = img.getHeight() / img.getWidth();
    img.setWidth(150);
    img.setHeight(Math.round(150 * ratio));
    header.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  } catch (e) { /* ako logo ne može da se preuzme, nastavi bez njega */ }

  // Naslov
  var title = body.appendParagraph('BELEŠKE SA ČASOVA');
  title.setHeading(DocumentApp.ParagraphHeading.TITLE);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // Zaglavlje (tabela label/value sa placeholderima)
  var table = body.appendTable([
    ['Polaznik', '{{POLAZNIK}}'],
    ['Email', '{{EMAIL}}'],
    ['Profesorka', '{{PROFESORKA}}'],
    ['Nivo/Kurs', '{{NIVO}}'],
    ['Paket', '{{BROJ_CASOVA}} časova'],
    ['Rok', '{{ROK}}'],
    ['Profesorka (email)', '{{PROF_EMAIL}}'],
    ['Zakaži čas', '{{KALENDAR}}'],
    ['Materijali', '{{MATERIJALI}}']
  ]);
  table.setBorderWidth(1);

  // Podsetnik
  body.appendParagraph('Otkazivanje časa najkasnije 24h ranije.').editAsText().setItalic(true);

  // Marker gde idu termini
  body.appendParagraph('{{TERMINI}}');

  // Anketa na dnu
  var anketa = body.appendParagraph(
    'Tvoj napredak nam je važan. Ako imaš par minuta, podeli svoje utiske — '
    + 'šta ti odgovara, šta bi moglo biti drugačije. ');
  var t = anketa.appendText('Klikni ovde');
  var len = anketa.getText().length;
  anketa.editAsText().setLinkUrl(len - 'Klikni ovde'.length, len - 1, ANKETA_URL);

  doc.saveAndClose();
  Logger.log('Šablon ponovo izgrađen: ' + doc.getUrl());
  return doc.getUrl();
}
```

- [ ] **Step 2: clasp push**

```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && clasp push -f
```
Expected: `Pushed N files.`

- [ ] **Step 3: Nataša pokreće `rebuildIndTemplate` iz editora**

CHECKPOINT (Nataša): Refresh editora → izaberi `rebuildIndTemplate` → Run → odobri dozvole. Pošalji log.

- [ ] **Step 4: Verifikacija — pročitati šablon (Claude, Drive konektor)**

Pročitati `IND_BELESKE_TEMPLATE_ID` (`1e2aP8rWHgS3XtOOblivZua6F8GEmX25R9ZTABH1Bg2g`) preko `read_file_content`.
Expected: zaglavlje sa svih 9 redova placeholdera, „Otkazivanje… 24h", `{{TERMINI}}`, anketa sa linkom; NEMA Tomislavovih podataka ni starih termina.

---

## Task 3: Nova `kreirajIndBeleske` + prošireni `enrollIndividual`

**Files:**
- Modify: `automatizacija/grupni-webapp/Code.gs:208-227` (zameniti `kreirajIndBeleske`) i `:199-206` (`enrollIndividual`)

- [ ] **Step 1: Zameniti `enrollIndividual` (prima nova polja)**

```javascript
function enrollIndividual(p) {
  const prof = nadjiProf(p.prof);
  if (!prof) throw new Error('Nepoznata profesorka: ' + p.prof);
  if (!p.studentEmail) throw new Error('Nema studentEmail');
  const docId = kreirajIndBeleske(p, prof);
  const notesUrl = docId ? ('https://docs.google.com/document/d/' + docId + '/edit') : '';
  return { ok: true, notesUrl: notesUrl, notesDocId: docId };
}
```
(Potpis isti; nova polja `p.casova`, `p.rok`, `p.calendarUrl`, `p.profEmail` koristi `kreirajIndBeleske`.)

- [ ] **Step 2: Zameniti `kreirajIndBeleske`**

```javascript
function kreirajIndBeleske(p, prof) {
  try {
    var template = DriveApp.getFileById(IND_BELESKE_TEMPLATE_ID);
    var folder = DriveApp.getFolderById(prof.folder);
    var ime = p.studentName || p.studentEmail;
    var naziv = 'Beleške — Individualni ' + (p.nivo || '') + ' — ' + ime;
    var kopija = template.makeCopy(naziv, folder);
    var doc = DocumentApp.openById(kopija.getId());
    var body = doc.getBody();

    // Zaglavlje
    body.replaceText('\\{\\{NIVO\\}\\}', p.nivo || '');
    body.replaceText('\\{\\{PROFESORKA\\}\\}', prof.ime);
    body.replaceText('\\{\\{POLAZNIK\\}\\}', ime);
    body.replaceText('\\{\\{EMAIL\\}\\}', p.studentEmail || '');
    body.replaceText('\\{\\{BROJ_CASOVA\\}\\}', String(p.casova || brojCasovaZaNivo_(p.nivo)));
    body.replaceText('\\{\\{ROK\\}\\}', p.rok || '');
    body.replaceText('\\{\\{PROF_EMAIL\\}\\}', p.profEmail || prof.email || '');

    // Kalendar (link) ili ukloni red
    if (p.calendarUrl) { postaviLink_(body, '{{KALENDAR}}', 'Klikni za zakazivanje', p.calendarUrl); }
    else { ukloniRedSaTekstom_(body, '{{KALENDAR}}'); }

    // Materijali nivoa (link) ili ukloni red
    var matId = MATERIJALI_FOLDERI[String(p.nivo || '')];
    if (matId) { postaviLink_(body, '{{MATERIJALI}}', 'Otvori materijale', 'https://drive.google.com/drive/folders/' + matId); }
    else { ukloniRedSaTekstom_(body, '{{MATERIJALI}}'); }

    // Termini na mestu markera
    var N = parseInt(p.casova, 10);
    if (!N || N < 1) { N = brojCasovaZaNivo_(p.nivo); }
    var markerIdx = -1;
    for (var i = 0; i < body.getNumChildren(); i++) {
      var el = body.getChild(i);
      if (el.getType() === DocumentApp.ElementType.PARAGRAPH &&
          el.asParagraph().getText().indexOf('{{TERMINI}}') !== -1) { markerIdx = i; break; }
    }
    if (markerIdx !== -1) {
      var idx = markerIdx;
      for (var t = 1; t <= N; t++) { idx = dodajIndTermin_(body, idx, t); }
      body.getChild(idx).removeFromParent(); // ukloni marker (sad je na idx)
    }

    doc.saveAndClose();
    kopija.addEditor(prof.email);
    return kopija.getId();
  } catch (e) {
    return '';
  }
}
```

- [ ] **Step 3: clasp push**

```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && clasp push -f
```
Expected: `Pushed N files.`

---

## Task 4: Test harness + verifikacija generisanja

**Files:**
- Modify: `automatizacija/grupni-webapp/SetupTemplate.gs` (dodati `testIndBeleske`)

- [ ] **Step 1: Dodati `testIndBeleske` u SetupTemplate.gs**

```javascript
/**
 * TEST: napravi probne beleške za razne pakete i ispiši linkove.
 * Pokrenuti RUČNO; obrisati probne docove posle provere.
 */
function testIndBeleske() {
  var prof = nadjiProf('Hristina');
  var slucajevi = [
    { nivo: 'A2.2', casova: 10 },
    { nivo: 'A1.1', casova: 7 },
    { nivo: 'B1.2', casova: 14 },   // npr. A1 paket scenario (14)
    { nivo: 'FIDE', casova: 5 },    // nema materijala → red izostaje
    { nivo: 'A1.2', casova: 8 }     // KTZ mesečni 8
  ];
  var out = [];
  for (var i = 0; i < slucajevi.length; i++) {
    var s = slucajevi[i];
    var id = kreirajIndBeleske({
      nivo: s.nivo, studentName: 'TEST ' + s.nivo, studentEmail: 'test@example.com',
      casova: s.casova, rok: '14.09.2026.', calendarUrl: 'https://calendar.example/hristina',
      profEmail: prof.email
    }, prof);
    out.push(s.nivo + ' (' + s.casova + ') → https://docs.google.com/document/d/' + id + '/edit');
  }
  Logger.log(out.join('\n'));
  return out;
}
```

- [ ] **Step 2: clasp push**

```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && clasp push -f
```

- [ ] **Step 3: Nataša pokreće `testIndBeleske`**

CHECKPOINT (Nataša): Run `testIndBeleske` → pošalji log sa 5 linkova.

- [ ] **Step 4: Verifikacija (Claude, Drive konektor `read_file_content` na svaki link)**

Za svaki doc proveriti:
- Broj „Termin Nr. X" naslova == `casova` (10, 7, 14, 5, 8).
- Zaglavlje popunjeno (ime, nivo, broj časova, rok, prof email), placeholderi nestali.
- A2.2/A1.1/B1.2/A1.2 imaju „Materijali" red; FIDE ga NEMA.
- „Zakaži čas" red ima link.
Expected: sve tačno. (Probne docove Nataša obriše iz foldera.)

---

## Task 5: Sajt — `grant-access.ts` prosleđuje nova polja

**Files:**
- Modify: `sajt/LMS/lms/src/lib/grant-access.ts:130-134`

- [ ] **Step 1: Proširiti `callGas("enrollIndividual", …)` poziv**

Zameniti blok (oko reda 130):
```typescript
      // GAS: beleške doc (bez kalendar eventa).
      let notesUrl: string | null = null;
      try {
        const rokDate = new Date();
        rokDate.setMonth(rokDate.getMonth() + 3);
        const rok = `${String(rokDate.getDate()).padStart(2, "0")}.${String(rokDate.getMonth() + 1).padStart(2, "0")}.${rokDate.getFullYear()}.`;
        const r = await callGas("enrollIndividual", {
          nivo, prof: profIme, studentName: order.full_name, studentEmail: order.email,
          casova: pkgLessons ?? 0, rok, calendarUrl: calendarUrl ?? "", profEmail: profEmail ?? "",
        });
        notesUrl = (r.notesUrl as string) || null;
      } catch (ge) {
        console.error(`[grant][ind] GAS enrollIndividual pao za ${order.email} (${nivo}):`, ge);
      }
```
(`calendarUrl`, `profEmail`, `pkgLessons` su već u opsegu iznad — redovi 121-126, 111.)

- [ ] **Step 2: Typecheck**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && npx tsc --noEmit
```
Expected: bez grešaka u `grant-access.ts`.

- [ ] **Step 3: Commit (LMS repo, na main — prvo proveri granu)**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && git branch --show-current && git add src/lib/grant-access.ts docs/superpowers/specs/2026-06-08-ind-beleske-template-redizajn-design.md docs/superpowers/plans/2026-06-08-ind-beleske-template-redizajn.md && git commit -m "feat(ind-beleske): prosledi broj časova/rok/kalendar/email profesorke u GAS"
```

---

## Task 6: Deploy

- [ ] **Step 1: Redeploy GAS web-app (da sajt dobije novu enrollIndividual)**

Web-app sajt zove preko verzionisanog deployment-a (isti URL). `clasp push` NE objavljuje novu verziju.
CHECKPOINT (Nataša ili Claude): redeploy postojećeg deployment-a novom verzijom:
```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && clasp deployments
# uzmi deploymentId postojećeg web-app-a, pa:
clasp deploy -i <DEPLOYMENT_ID> -d "ind-beleske redizajn"
```
Expected: nova verzija na ISTOM URL-u. (Ako clasp deploy ne uspe, Nataša: Apps Script editor → Deploy → Manage deployments → edit → New version.)

- [ ] **Step 2: Deploy sajta na produkciju**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && vercel --prod
```
Expected: deploy uspeo; PostToolUse smoke-deploy hook prođe (vidi [[feedback_deploy_smoke_test]]).

- [ ] **Step 3: E2E provera (opciono, Claude)**

Ako je bezbedno okinuti `grant-access` za probnu porudžbinu (bez fiskalizacije, vidi memoriju), proveriti da realan upis napravi ispravan doc. U suprotnom, osloniti se na Task 4 verifikaciju + prvu pravu kupovinu.

---

## Task 7: Čišćenje privremenog koda

**Files:**
- Delete: `automatizacija/grupni-webapp/Cleanup.gs`, `automatizacija/grupni-webapp/DeliPrezentacije.gs`
- Modify: `automatizacija/grupni-webapp/appsscript.json` (ukloniti `executionApi`)

- [ ] **Step 1: Obrisati privremene fajlove i executionApi**

```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && rm Cleanup.gs DeliPrezentacije.gs
```
Ukloniti iz `appsscript.json`:
```json
  "executionApi": {
    "access": "MYSELF"
  },
```

- [ ] **Step 2: clasp push (čisti projekat)**

```bash
cd /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp && clasp push -f
```
Expected: `Pushed N files.` (bez Cleanup/DeliPrezentacije). `SetupTemplate.gs` (rebuild/test) se može zadržati ili obrisati po želji.

---

## Self-Review (popunjeno)

- **Spec coverage:** Logo (Task 2), zaglavlje 9 polja + 24h (Task 2), kalendar/email/materijali linkovi (Task 3), broj termina = paket (Task 3 + fallback), termin kao Heading (Task 1 `dodajIndTermin_`), KTZ 4/8/12 (prolazi kroz `casova`), sajt prosleđuje polja (Task 5), čišćenje (Task 7). ✓
- **Placeholderi:** nema TBD/TODO; sav kod konkretan. ✓
- **Tipovi/imena:** `dodajIndTermin_`, `postaviLink_`, `ukloniRedSaTekstom_`, `brojCasovaZaNivo_`, `MATERIJALI_FOLDERI`, `IND_SEKCIJE`, `{{TERMINI}}` dosledni kroz Task 1/2/3/4. ✓
- **Napomena:** `nivo` mora tačno da odgovara ključu u `MATERIJALI_FOLDERI` (npr. „A2.2"); za „A1 paket" ako `nivo` nije „A1.1/A1.2" — materijali red se izostavlja (prihvatljivo).

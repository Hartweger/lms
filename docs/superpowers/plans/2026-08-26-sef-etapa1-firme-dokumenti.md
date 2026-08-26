# SEF Etapa 1 — Firme, predračun i faktura

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Narudžbina može da ima kupca-firmu, a sistem sam pravi predračun i fakturu kao PDF i šalje ih računovodstvu — bez kucanja u Google tabeli.

**Architecture:** Podaci firme idu na `orders` uz vezu ka novoj tabeli `companies`. Broj dokumenta je broj prve narudžbine u grupi — isti broj nosi i predračun i faktura. Sastavljanje dokumenta je čista funkcija bez baze i mreže (testabilna), crtanje PDF-a je zaseban modul, a rute u adminu samo spajaju to dvoje i šalju mejl.

**Tech Stack:** Next.js App Router, Supabase (service role), jsPDF sa Roboto fontom, Resend, vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-sef-efaktura-firme-design.md`

**Van obima ove etape:** SEF API, webhook, ulazne fakture. To je Etapa 2 i 3.

---

## Preduslovi — podaci od Nataše

Odgovoreno 26.08.2026, oba su ugrađena:

1. **Račun na dokumentima firmama:** Banca Intesa `160-6000001689258-40` (`BANK_FIRME` u `src/lib/order-utils.ts`). Uplatnice fizičkim licima ostaju na `BANK_DETAILS.racun`.
2. **Adresa u zaglavlju:** `MERCHANT.adresa`, dakle `Jurija Gagarina 20, Beograd (Novi Beograd)`.

---

## Struktura fajlova

| Fajl | Odgovornost |
|---|---|
| `supabase/migrations/101_firme_i_dokumenti.sql` | tabela `companies`, nove kolone na `orders` |
| `src/lib/dokument-podaci.ts` | čisto računanje: stavke, bez PDV, PDV, ukupno. Bez baze i mreže. |
| `src/lib/dokument-podaci.test.ts` | testovi za gornje |
| `src/lib/dokument-pdf.ts` | crtanje PDF-a iz `DokumentPodaci` |
| `src/app/api/admin/dokument/[groupId]/route.ts` | sklopi podatke, napravi PDF, pošalji mejl |
| `src/lib/order-utils.ts` | proširenje `buildIpsString` za dokumente |
| `src/lib/email.ts` | prilozi u mejlu + `sendDokumentEmail` |
| `src/app/admin/narudzbine/NarudzbineClient.tsx` | polja za firmu, „Dodaj polaznika", dugmad za dokumente |
| `src/app/api/admin/orders/route.ts` | prijem podataka firme, upsert u `companies`, grupa |

---

### Task 1: Migracija baze — URAĐEN 26.08.2026

**Files:**
- Create: `supabase/migrations/101_firme_i_dokumenti.sql`

- [x] **Step 1: Napiši migraciju**

Tabela `companies` (firme se pamte po PIB-u) i sedam novih kolona na `orders`.
Zaseban brojač dokumenata je bio u prvoj verziji pa je uklonjen — broj dokumenta
je broj narudžbine, vidi spec.

- [x] **Step 2: Primeni migraciju**

Primenjena kroz Supabase MCP konektor (`apply_migration`, projekat
`rzmyglynjcygsbicssbt`). CLI je odjavljen, `sbp_` token mrtav — konektor je put.

- [x] **Step 3: Proveri kolone**

```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='orders'
   and column_name in ('company_id','billing_email','company_order_group',
                       'predracun_broj','predracun_sent_at','faktura_broj','faktura_sent_at');
```

Očekivano: sedam redova. Potvrđeno.

- [x] **Step 4: Osveži tipove**

Kroz konektor (`generate_typescript_types`), pa upis u
`src/lib/supabase/database.types.ts`. Razlika prema prethodnoj verziji: samo
dodata tabela `companies`, ništa uklonjeno.

- [x] **Step 5: Proveri kompajliranje**

```bash
./node_modules/.bin/tsc --noEmit
```

Očekivano: bez grešaka. Potvrđeno.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/101_firme_i_dokumenti.sql src/lib/supabase/database.types.ts
git commit -m "feat(firme): tabela companies i kolone za dokumente na narudzbini"
```

---

### Task 2: Računanje dokumenta

Ovo je srce etape. Cene u bazi su **sa** PDV-om, a na dokumentu stavke idu **bez** PDV-a. Zaokruživanje po stavci ne sme da pomeri ukupan iznos — zbir stavki mora tačno da da ukupno bez PDV-a, a ukupno sa PDV-om mora da bude tačan zbir narudžbina.

**Files:**
- Create: `src/lib/dokument-podaci.ts`
- Test: `src/lib/dokument-podaci.test.ts`

- [ ] **Step 1: Napiši padajuće testove**

```ts
import { describe, it, expect } from "vitest";
import { sastaviDokument } from "./dokument-podaci";

const kupac = {
  naziv: "Test DOO",
  adresa: "Neka ulica 1, Beograd",
  pib: "123456789",
  maticniBroj: "87654321",
  email: "racunovodstvo@test.rs",
};

describe("sastaviDokument", () => {
  it("jedna stavka: bez PDV je cena/1.2, PDV je razlika", () => {
    const d = sastaviDokument({
      tip: "faktura",
      broj: "2026-408",
      datum: "26.08.2026.",
      kupac,
      narudzbine: [{ opis: "Grupni kurs A2.1", total: 19600 }],
    });
    expect(d.stavke).toEqual([
      { opis: "Grupni kurs A2.1", kolicina: 1, cenaBezPdv: 16333, iznosBezPdv: 16333 },
    ]);
    expect(d.ukupnoBezPdv).toBe(16333);
    expect(d.pdv).toBe(3267);
    expect(d.ukupnoSaPdv).toBe(19600);
  });

  it("iste stavke se spajaju u jednu sa količinom", () => {
    const d = sastaviDokument({
      tip: "faktura",
      broj: "2026-408",
      datum: "26.08.2026.",
      kupac,
      narudzbine: [
        { opis: "Grupni kurs A2.1", total: 19600 },
        { opis: "Grupni kurs A2.1", total: 19600 },
      ],
    });
    expect(d.stavke).toHaveLength(1);
    expect(d.stavke[0].kolicina).toBe(2);
    expect(d.ukupnoSaPdv).toBe(39200);
  });

  it("ostatak od zaokruživanja ide na poslednju stavku, zbir se poklapa", () => {
    // 2 x 38.500 sa PDV = 77.000. Bez PDV po stavci je 32.083,33 -> naivno
    // zaokruživanje daje 64.166, a treba 64.167. Razlika ide na poslednju stavku.
    const d = sastaviDokument({
      tip: "faktura",
      broj: "2026-408",
      datum: "26.08.2026.",
      kupac,
      narudzbine: [
        { opis: "Individualni kurs A2.1 Nataša", total: 38500 },
        { opis: "Individualni kurs A2.2 Nataša", total: 38500 },
      ],
    });
    expect(d.stavke.map((s) => s.iznosBezPdv)).toEqual([32083, 32084]);
    expect(d.ukupnoBezPdv).toBe(64167);
    expect(d.pdv).toBe(12833);
    expect(d.ukupnoSaPdv).toBe(77000);
    const zbir = d.stavke.reduce((a, s) => a + s.iznosBezPdv, 0);
    expect(zbir).toBe(d.ukupnoBezPdv);
  });

  it("bez narudžbina baca grešku umesto praznog dokumenta", () => {
    expect(() =>
      sastaviDokument({
        tip: "faktura", broj: "2026-408", datum: "26.08.2026.", kupac, narudzbine: [],
      }),
    ).toThrow("Dokument bez stavki");
  });
});
```

- [ ] **Step 2: Pokreni testove da vidiš da padaju**

```bash
npx vitest run src/lib/dokument-podaci.test.ts
```

Očekivano: FAIL, `Failed to resolve import "./dokument-podaci"`.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/dokument-podaci.ts
// Sastavljanje predračuna i fakture. Čista funkcija - bez baze, bez mreže,
// da može da se testira sama.
//
// PDV: cene u bazi su SA uračunatim PDV-om (isto kao na sajtu), a na dokumentu
// stavke idu BEZ PDV-a. Zaokruživanje po stavci ume da pomeri zbir za dinar-dva,
// pa se ostatak dodaje na poslednju stavku - tako zbir stavki uvek daje ukupno.

export const PDV_STOPA = 0.2;

export interface DokumentKupac {
  naziv: string;
  adresa: string | null;
  pib: string;
  maticniBroj: string | null;
  email: string | null;
}

export interface DokumentStavka {
  opis: string;
  kolicina: number;
  cenaBezPdv: number;
  iznosBezPdv: number;
}

export interface DokumentPodaci {
  tip: "predracun" | "faktura";
  broj: string;
  datum: string;
  kupac: DokumentKupac;
  stavke: DokumentStavka[];
  ukupnoBezPdv: number;
  pdv: number;
  ukupnoSaPdv: number;
  napomena: string | null;
}

interface Ulaz {
  tip: "predracun" | "faktura";
  broj: string;
  datum: string;
  kupac: DokumentKupac;
  /** Po jedna stavka po narudžbini; `total` je cena SA PDV-om. */
  narudzbine: { opis: string; total: number }[];
  napomena?: string | null;
}

export function sastaviDokument(u: Ulaz): DokumentPodaci {
  if (u.narudzbine.length === 0) throw new Error("Dokument bez stavki");

  // Spoji identične opise u jednu stavku sa količinom, redosled prvog pojavljivanja.
  const redosled: string[] = [];
  const grupe = new Map<string, { kolicina: number; totalSaPdv: number }>();
  for (const n of u.narudzbine) {
    const g = grupe.get(n.opis);
    if (g) {
      g.kolicina += 1;
      g.totalSaPdv += n.total;
    } else {
      redosled.push(n.opis);
      grupe.set(n.opis, { kolicina: 1, totalSaPdv: n.total });
    }
  }

  const ukupnoSaPdv = u.narudzbine.reduce((a, n) => a + n.total, 0);
  const ukupnoBezPdv = Math.round(ukupnoSaPdv / (1 + PDV_STOPA));

  const stavke: DokumentStavka[] = redosled.map((opis) => {
    const g = grupe.get(opis)!;
    const iznosBezPdv = Math.round(g.totalSaPdv / (1 + PDV_STOPA));
    return {
      opis,
      kolicina: g.kolicina,
      cenaBezPdv: Math.round(iznosBezPdv / g.kolicina),
      iznosBezPdv,
    };
  });

  // Ostatak zaokruživanja na poslednju stavku, da zbir stavki = ukupno bez PDV.
  const zbir = stavke.reduce((a, s) => a + s.iznosBezPdv, 0);
  const razlika = ukupnoBezPdv - zbir;
  if (razlika !== 0) {
    const poslednja = stavke[stavke.length - 1];
    poslednja.iznosBezPdv += razlika;
    poslednja.cenaBezPdv = Math.round(poslednja.iznosBezPdv / poslednja.kolicina);
  }

  return {
    tip: u.tip,
    broj: u.broj,
    datum: u.datum,
    kupac: u.kupac,
    stavke,
    ukupnoBezPdv,
    pdv: ukupnoSaPdv - ukupnoBezPdv,
    ukupnoSaPdv,
    napomena: u.napomena ?? null,
  };
}
```

- [ ] **Step 4: Pokreni testove**

```bash
npx vitest run src/lib/dokument-podaci.test.ts
```

Očekivano: PASS, 4 testa.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dokument-podaci.ts src/lib/dokument-podaci.test.ts
git commit -m "feat(dokumenti): racunanje predracuna i fakture bez gubitka dinara"
```

---

### Task 3: ~~Dodela broja dokumenta~~ — OTPAO

Broj dokumenta je broj narudžbine (`orders.order_number`, npr. `2026-408`), pa
zaseban brojač i modul `dokument-broj.ts` nisu potrebni. Odluka 26.08.2026.

---

### Task 4: IPS QR za dokument

`buildIpsString` sad tvrdo upisuje „Placanje porudzbine #" i koristi `order_number` kao poziv na broj. Za fakturu treba broj dokumenta. Postojeći pozivi se ne smeju promeniti.

**Files:**
- Modify: `src/lib/order-utils.ts:22-32`
- Modify: `src/lib/ips-qr.ts`
- Test: `src/lib/order-utils.test.ts`

- [ ] **Step 1: Dodaj padajući test u postojeći fajl**

```ts
it("dokument dobija svoj poziv na broj i svrhu", () => {
  const s = buildIpsString({ total: 39200, order_number: "2026-100" }, {
    poziv: "2026-408",
    svrha: "Placanje po fakturi 2026-408",
  });
  expect(s).toContain("RO:002026-408");
  expect(s).toContain("S:Placanje po fakturi 2026-408");
});
```

- [ ] **Step 2: Pokreni testove da vidiš da pada**

```bash
npx vitest run src/lib/order-utils.test.ts
```

Očekivano: FAIL — novi test pada, stari prolaze.

- [ ] **Step 3: Proširi `buildIpsString`**

Zameni telo funkcije u `src/lib/order-utils.ts`:

```ts
export function buildIpsString(
  o: { total: number; order_number: string },
  opcije?: { poziv?: string; svrha?: string },
): string {
  const poziv = opcije?.poziv ?? o.order_number;
  const svrha = opcije?.svrha ?? `Placanje porudzbine #${o.order_number}`;
  return [
    "K:PR", "V:01", "C:1",
    `R:${racunZaIps(BANK_DETAILS.racun)}`,
    `N:${BANK_DETAILS.primalac}`,
    `I:RSD${Number(o.total).toFixed(2).replace(".", ",")}`,
    `S:${svrha}`,
    `SF:${BANK_DETAILS.sifraPalcanja}`,
    `RO:00${poziv}`,
  ].join("|");
}
```

- [ ] **Step 4: Dodaj generisanje QR-a za dokument**

U `src/lib/ips-qr.ts` dodaj, ispod postojeće funkcije:

```ts
/** IPS QR kao PNG bafer, za ugradnju u PDF dokumenta. Ne diže se na Storage. */
export async function ipsQrBuffer(d: {
  total: number;
  broj: string;
  tip: "predracun" | "faktura";
}): Promise<Buffer | null> {
  try {
    const naziv = d.tip === "predracun" ? "predracunu" : "fakturi";
    const ips = buildIpsString(
      { total: d.total, order_number: d.broj },
      { poziv: d.broj, svrha: `Placanje po ${naziv} ${d.broj}` },
    );
    return await QRCode.toBuffer(ips, { width: 260, margin: 1, errorCorrectionLevel: "M" });
  } catch (e) {
    console.error("[ips-qr] dokument QR pao:", e);
    return null;
  }
}
```

- [ ] **Step 5: Pokreni ceo test paket**

```bash
npm test
```

Očekivano: PASS. Ako neki stari test o IPS-u pukne, znači da se podrazumevano ponašanje promenilo — vrati podrazumevane vrednosti tačno kako su bile.

- [ ] **Step 6: Commit**

```bash
git add src/lib/order-utils.ts src/lib/order-utils.test.ts src/lib/ips-qr.ts
git commit -m "feat(ips): poziv na broj i svrha po dokumentu, QR kao bafer"
```

---

### Task 5: PDF dokumenta

Izgled prati postojeću Google tabelu. Font mora biti Roboto iz `src/fonts/Roboto-VF.ttf` — bez njega jsPDF ne peca naša slova (č, ć, š, ž, đ). Vidi `src/app/api/sertifikat/[id]/route.ts:40-45`.

**Files:**
- Create: `src/lib/dokument-pdf.ts`

- [ ] **Step 1: Napiši modul**

```ts
// src/lib/dokument-pdf.ts
// Crtanje predračuna i fakture. Izgled prati postojeću Google tabelu:
// zaglavlje, blok kupca, tabela stavki bez PDV-a, zbir, IPS QR, podnožje.
import "server-only";
import { jsPDF } from "jspdf";
import * as fs from "fs";
import * as path from "path";
import { MERCHANT } from "@/lib/payment-confirmation";
import { BANK_DETAILS } from "@/lib/order-utils";
import type { DokumentPodaci } from "@/lib/dokument-podaci";

const M = 18;        // margina
const W = 210;       // A4 širina u mm

function rsd(n: number): string {
  return `${n.toLocaleString("sr-RS")} RSD`;
}

export function napraviDokumentPdf(d: DokumentPodaci, qr: Buffer | null): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const fontData = fs.readFileSync(path.join(process.cwd(), "src/fonts/Roboto-VF.ttf"));
  doc.addFileToVFS("Roboto-VF.ttf", fontData.toString("base64"));
  doc.addFont("Roboto-VF.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  let y = M;

  // Naslov gore desno
  doc.setFontSize(22);
  doc.text(d.tip === "faktura" ? "FAKTURA" : "PREDRAČUN", W - M, y + 6, { align: "right" });

  // Zaglavlje levo
  doc.setFontSize(9);
  doc.text(MERCHANT.adresa, M, y);
  doc.text(`PIB: ${MERCHANT.pib}  ·  Banca Intesa: ${BANK_DETAILS.racun}`, M, y + 4.5);
  doc.text("www.hartweger.rs  ·  info@hartweger.rs", M, y + 9);

  // Broj i datum desno
  doc.text(`Broj: ${d.broj}`, W - M, y + 13, { align: "right" });
  doc.text(`Datum: ${d.datum}`, W - M, y + 17.5, { align: "right" });

  y += 30;

  // Kupac
  doc.setFontSize(10);
  doc.text("KUPAC / PRIMALAC", M, y);
  y += 6;
  doc.setFontSize(9);
  for (const red of [
    d.kupac.naziv,
    d.kupac.adresa ?? "",
    `PIB: ${d.kupac.pib}`,
    d.kupac.maticniBroj ? `Matični broj: ${d.kupac.maticniBroj}` : "",
    d.kupac.email ?? "",
  ]) {
    if (!red) continue;
    doc.text(red, M, y);
    y += 4.5;
  }

  y += 6;

  // Zaglavlje tabele
  const kolKol = 108, kolCena = 138, kolIznos = W - M;
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y - 4, W - 2 * M, 7, "F");
  doc.setFontSize(8);
  doc.text("OPIS USLUGE", M + 2, y);
  doc.text("KOL.", kolKol, y, { align: "right" });
  doc.text("CENA BEZ PDV", kolCena, y, { align: "right" });
  doc.text("IZNOS BEZ PDV", kolIznos - 2, y, { align: "right" });
  y += 8;

  doc.setFontSize(9);
  for (const s of d.stavke) {
    doc.text(s.opis, M + 2, y);
    doc.text(String(s.kolicina), kolKol, y, { align: "right" });
    doc.text(rsd(s.cenaBezPdv), kolCena, y, { align: "right" });
    doc.text(rsd(s.iznosBezPdv), kolIznos - 2, y, { align: "right" });
    y += 6;
  }

  y += 4;
  doc.setDrawColor(200);
  doc.line(M, y, W - M, y);
  y += 6;

  for (const [oznaka, iznos] of [
    ["Ukupno bez PDV:", d.ukupnoBezPdv],
    ["PDV (20%):", d.pdv],
  ] as const) {
    doc.text(oznaka, kolCena, y, { align: "right" });
    doc.text(rsd(iznos), kolIznos - 2, y, { align: "right" });
    y += 5.5;
  }
  doc.setFontSize(11);
  doc.text("UKUPNO SA PDV:", kolCena, y + 2, { align: "right" });
  doc.text(rsd(d.ukupnoSaPdv), kolIznos - 2, y + 2, { align: "right" });
  y += 14;

  doc.setFontSize(9);
  if (d.napomena) {
    doc.text(d.napomena, M, y);
    y += 8;
  }

  doc.text("Plaćanje: Molimo vas da iznos uplatite u roku od 7 dana.", M, y);
  y += 8;

  if (qr) {
    doc.addImage(`data:image/png;base64,${qr.toString("base64")}`, "PNG", M, y, 32, 32);
    doc.setFontSize(8);
    doc.text(`Poziv na broj: ${d.broj}`, M + 36, y + 8);
    doc.text("IPS QR — plaćanje skeniranjem", M + 36, y + 13);
  }

  // Podnožje
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `HARTWEGER  ·  www.hartweger.rs  ·  info@hartweger.rs  ·  PIB: ${MERCHANT.pib}`,
    W / 2, 285, { align: "center" },
  );

  return Buffer.from(doc.output("arraybuffer"));
}
```

- [ ] **Step 2: Napravi probni PDF za oko**

```bash
npx tsx -e "
const { sastaviDokument } = require('./src/lib/dokument-podaci');
const { napraviDokumentPdf } = require('./src/lib/dokument-pdf');
const d = sastaviDokument({
  tip: 'faktura', broj: '2026-408', datum: '26.08.2026.',
  kupac: { naziv: 'PROBA DOO BEOGRAD', adresa: 'Neka ulica 1, 11000 Beograd', pib: '123456789', maticniBroj: '87654321', email: 'racunovodstvo@proba.rs' },
  narudzbine: [
    { opis: 'Individualni kurs A2.1 Nataša', total: 38500 },
    { opis: 'Individualni kurs A2.2 Nataša', total: 38500 },
  ],
});
require('fs').writeFileSync('/tmp/proba-faktura.pdf', napraviDokumentPdf(d, null));
console.log('ok');
"
```

Očekivano: fajl `/tmp/proba-faktura.pdf`. Otvori ga i proveri: naša slova se vide, iznosi su 32.083 + 32.084 = 64.167, PDV 12.833, ukupno 77.000.

- [ ] **Step 3: Pošalji probni PDF Nataši na odobrenje**

Ne ide dalje dok ne kaže da je izgled u redu.

- [ ] **Step 4: Commit**

```bash
git add src/lib/dokument-pdf.ts
git commit -m "feat(dokumenti): PDF predracuna i fakture po postojecem obrascu"
```

---

### Task 6: Prilog u mejlu

`sendEmail` u `src/lib/email.ts:62` ne prima priloge. Resend ih podržava preko `attachments`.

**Files:**
- Modify: `src/lib/email.ts:62-82`

- [ ] **Step 1: Dodaj `attachments` u `sendEmail`**

Proširi tip parametra i prosledi ga Resendu:

```ts
async function sendEmail(
  resend: Resend,
  p: {
    to: string | string[]; subject: string; html: string;
    from?: string; replyTo?: string; bulk?: boolean;
    attachments?: { filename: string; content: string }[];
  },
) {
```

i u telu, uz ostala polja:

```ts
    ...(p.attachments?.length ? { attachments: p.attachments } : {}),
```

- [ ] **Step 2: Dodaj funkciju za slanje dokumenta**

Na kraj `src/lib/email.ts`:

```ts
/** Predračun ili faktura firmi, kao PDF prilog. Nije bulk - ne prolazi kroz odjave. */
export async function sendDokumentEmail(o: {
  to: string;
  tip: "predracun" | "faktura";
  broj: string;
  pdf: Buffer;
}) {
  const naziv = o.tip === "predracun" ? "Predračun" : "Faktura";
  const resend = getResend();
  try {
    return await sendEmail(resend, {
      to: o.to,
      subject: `${naziv} ${o.broj} — Hartweger`,
      html: `
<p>Poštovani,</p>
<p>u prilogu vam šaljemo ${naziv.toLowerCase()} broj <strong>${o.broj}</strong>.</p>
<p>Molimo vas da iznos uplatite u roku od 7 dana. Ako imate pitanja, samo odgovorite na ovaj mejl.</p>
<p>Srdačno,<br/>Hartweger tim</p>`,
      attachments: [
        { filename: `${o.tip}-${o.broj.replace(/\//g, "-")}.pdf`, content: o.pdf.toString("base64") },
      ],
    });
  } catch (e) {
    console.error(`[email] sendDokumentEmail pao za ${o.broj}:`, e);
    return null;
  }
}
```

Ako se `getResend` u fajlu zove drukčije, koristi postojeći način dobijanja klijenta iz susednih funkcija — ne uvoditi novi.

- [ ] **Step 3: Proveri da se projekat i dalje kompajlira**

```bash
./node_modules/.bin/tsc --noEmit
```

Očekivano: bez grešaka. (`npx tsc` ume da povuče drugu verziju — koristi putanju iz `node_modules`.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat(mejl): prilozi i slanje predracuna/fakture firmi"
```

---

### Task 7: Ruta koja izdaje dokument

**Files:**
- Create: `src/app/api/admin/dokument/[groupId]/route.ts`

- [ ] **Step 1: Napiši rutu**

```ts
// src/app/api/admin/dokument/[groupId]/route.ts
// Izdaje predračun ili fakturu za jednu grupu narudžbina firme: sastavi podatke,
// nacrtaj PDF, pošalji mejlom, upiši broj i vreme na narudžbine.
// Broj dokumenta je broj PRVE narudžbine u grupi - isti broj nosi i predračun i
// faktura, kako je Nataša radila i ručno.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { sastaviDokument } from "@/lib/dokument-podaci";
import { napraviDokumentPdf } from "@/lib/dokument-pdf";
import { ipsQrBuffer } from "@/lib/ips-qr";
import { sendDokumentEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { groupId } = await params;
  const { tip } = (await request.json()) as { tip: "predracun" | "faktura" };
  if (tip !== "predracun" && tip !== "faktura") {
    return NextResponse.json({ error: "Nepoznat tip dokumenta." }, { status: 400 });
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, total, items, billing_email, company_id, predracun_broj, faktura_broj")
    .eq("company_order_group", groupId)
    .order("created_at", { ascending: true });

  if (!orders?.length) {
    return NextResponse.json({ error: "Nema narudžbina u ovoj grupi." }, { status: 404 });
  }

  // Idempotentno: dokument se ne izdaje dvaput za istu grupu.
  const postojeci = tip === "predracun" ? orders[0].predracun_broj : orders[0].faktura_broj;
  if (postojeci) {
    return NextResponse.json({ broj: postojeci, vec_izdat: true });
  }

  const { data: firma } = await admin
    .from("companies")
    .select("naziv, adresa, pib, maticni_broj, email")
    .eq("id", orders[0].company_id!)
    .single();

  if (!firma) {
    return NextResponse.json({ error: "Firma nije pronađena." }, { status: 400 });
  }

  const broj = orders[0].order_number;
  if (!broj) {
    return NextResponse.json({ error: "Narudžbina nema broj." }, { status: 400 });
  }

  const dokument = sastaviDokument({
    tip,
    broj,
    datum: new Intl.DateTimeFormat("sr-RS", {
      timeZone: "Europe/Belgrade", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date()),
    kupac: {
      naziv: firma.naziv,
      adresa: firma.adresa,
      pib: firma.pib,
      maticniBroj: firma.maticni_broj,
      email: firma.email,
    },
    narudzbine: orders.map((o) => ({
      opis: ((o.items as { title?: string }[])?.[0]?.title) ?? "Kurs nemačkog jezika",
      total: Number(o.total),
    })),
  });

  const qr = await ipsQrBuffer({ total: dokument.ukupnoSaPdv, broj, tip });
  const pdf = napraviDokumentPdf(dokument, qr);

  const primalac = orders[0].billing_email ?? firma.email;
  if (!primalac) {
    return NextResponse.json({ error: "Nema mejla za slanje dokumenta." }, { status: 400 });
  }
  await sendDokumentEmail({ to: primalac, tip, broj, pdf });

  const kolone = tip === "predracun"
    ? { predracun_broj: broj, predracun_sent_at: new Date().toISOString() }
    : { faktura_broj: broj, faktura_sent_at: new Date().toISOString() };

  await admin.from("orders").update(kolone).eq("company_order_group", groupId);

  return NextResponse.json({ broj, poslato_na: primalac });
}
```

- [ ] **Step 2: Proveri kompajliranje**

```bash
./node_modules/.bin/tsc --noEmit
```

Očekivano: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/dokument/[groupId]/route.ts"
git commit -m "feat(dokumenti): ruta koja izdaje i salje predracun ili fakturu"
```

---

### Task 8: Podaci firme na narudžbini

**Files:**
- Modify: `src/app/api/admin/orders/route.ts:27` (destrukturiranje tela) i mesto gde se pravi order

- [ ] **Step 1: Primi podatke firme**

U destrukturiranju tela dodaj:

```ts
    const { email, courseId, totalAmount, paymentMethod, markAsPaid, sendPaymentEmail,
            fiscalize, professorId, packageType, firma, billingEmail, groupId } = await request.json();
```

gde je `firma` oblika `{ pib, naziv, adresa, maticniBroj, email } | null`.

- [ ] **Step 2: Upsertuj firmu i veži narudžbinu**

Pre pravljenja narudžbine:

```ts
    // Firma se pamti po PIB-u, da se sledeći put podaci popune sami.
    let companyId: string | null = null;
    let companyGroup: string | null = null;
    if (firma?.pib) {
      const { data: c, error: cErr } = await admin
        .from("companies")
        .upsert(
          {
            pib: String(firma.pib).trim(),
            naziv: firma.naziv,
            adresa: firma.adresa ?? null,
            maticni_broj: firma.maticniBroj ?? null,
            email: firma.email ?? billingEmail ?? null,
          },
          { onConflict: "pib" },
        )
        .select("id")
        .single();
      if (cErr || !c) {
        return NextResponse.json({ error: "Upis firme nije uspeo." }, { status: 500 });
      }
      companyId = c.id;
      // Prvi polaznik otvara grupu, svaki sledeći se kači na istu.
      companyGroup = groupId ?? crypto.randomUUID();
    }
```

- [ ] **Step 3: Upiši nova polja u narudžbinu**

U objekat koji se ubacuje u `orders` dodaj:

```ts
      company_id: companyId,
      billing_email: billingEmail ?? null,
      company_order_group: companyGroup,
```

- [ ] **Step 4: Vrati grupu u odgovoru**

Da bi forma mogla da doda sledećeg polaznika u istu grupu, u uspešan odgovor dodaj `company_order_group: companyGroup`.

- [ ] **Step 5: Proveri kompajliranje**

```bash
./node_modules/.bin/tsc --noEmit
```

Očekivano: bez grešaka.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/orders/route.ts
git commit -m "feat(firme): podaci firme na narudzbini, pamcenje po PIB-u"
```

---

### Task 9: Admin forma i dugmad

**Files:**
- Modify: `src/app/admin/narudzbine/NarudzbineClient.tsx`
- Create: `src/app/api/admin/companies/[pib]/route.ts`

- [ ] **Step 1: Ruta za popunjavanje po PIB-u**

```ts
// src/app/api/admin/companies/[pib]/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pib: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { pib } = await params;

  const { data } = await auth.admin
    .from("companies")
    .select("pib, naziv, adresa, maticni_broj, email")
    .eq("pib", pib)
    .maybeSingle();

  return NextResponse.json({ firma: data ?? null });
}
```

- [ ] **Step 2: Prekidač i polja za firmu**

U formi za novu narudžbinu, iznad polja za mejl, dodaj čekboks „Kupac je firma". Kad je uključen, prikaži polja: PIB, naziv, adresa, matični broj, mejl za fakturu. Kad se PIB napusti (`onBlur`) i ima bar 8 cifara, pozovi `/api/admin/companies/${pib}` i popuni ostala polja ako firma postoji.

Postojeće polje za mejl ostaje i dalje **polaznikov** mejl — dopuni mu opis sa „mejl polaznika" kad je firma uključena, da se ne pomeša sa mejlom za fakturu.

- [ ] **Step 3: Čekboks „Fiskalizuj račun" se ne dira**

Ostaje tačno kako jeste, sa istim tekstom i istim podrazumevanim stanjem. Ne dodavati nikakvu logiku koja ga menja na osnovu PIB-a — to je izričita odluka iz spec-a.

- [ ] **Step 4: „Dodaj polaznika"**

Posle uspešnog čuvanja narudžbine za firmu, prikaži dugme „Dodaj još jednog polaznika". Ono ponovo otvara formu sa zadržanim podacima firme i sa `groupId` iz odgovora, a praznim poljima za polaznika, kurs i profesorku.

- [ ] **Step 5: Dugmad za dokumente**

U redu narudžbine koja ima `company_order_group`, prikaži:

- „Pošalji predračun" — `POST /api/admin/dokument/${groupId}` sa `{ tip: "predracun" }`. Posle uspeha prikaži broj umesto dugmeta.
- „Izdaj fakturu" — isto sa `{ tip: "faktura" }`. Vidljivo tek kad je narudžbina plaćena.

Oba dugmeta se onemoguće dok traje poziv, da dvoklik ne pošalje dva zahteva.

- [ ] **Step 6: Proveri kompajliranje i lint**

```bash
./node_modules/.bin/tsc --noEmit && npm run lint
```

Očekivano: bez grešaka.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/narudzbine/NarudzbineClient.tsx "src/app/api/admin/companies/[pib]/route.ts"
git commit -m "feat(admin): forma za kupca firmu i dugmad za dokumente"
```

---

### Task 10: Provera na živo

- [ ] **Step 1: Pokreni ceo test paket**

```bash
npm test
```

Očekivano: PASS, bez novih padova.

- [ ] **Step 2: Napravi probnu narudžbinu za izmišljenu firmu**

U adminu, na lokalnom dev serveru: uključi „Kupac je firma", unesi PIB `123456789`, naziv `PROBA DOO`, mejl za fakturu na svoju adresu. Ne označavaj kao plaćeno.

- [ ] **Step 3: Pošalji predračun i proveri mejl**

Klikni „Pošalji predračun". Očekivano: mejl sa PDF prilogom, broj je broj te narudžbine (npr. `2026-409`), iznos i PDV se poklapaju sa cenom kursa, naša slova se vide, IPS QR postoji.

- [ ] **Step 4: Dodaj drugog polaznika, pa ponovi**

Očekivano: druga narudžbina je u istoj grupi; novi predračun se ne izdaje jer prvi već postoji (ruta vraća `vec_izdat: true`). Ovo je namerno — dokument se ne menja pošto je poslat.

- [ ] **Step 5: Označi kao plaćeno i izdaj fakturu**

Očekivano: faktura sa **istim** brojem kao predračun, sa istim stavkama.

- [ ] **Step 6: Obriši probne podatke**

Ukloni probne narudžbine i probnu firmu iz baze.

- [ ] **Step 7: Commit i najava**

Ne pushovati na `main` bez Natašine potvrde — push na `main` ide u produkciju.

---

## Šta ostaje za Etapu 2

SEF API (`src/lib/sef.ts`, `src/lib/sef-ubl.ts`), slanje fakture na SEF, webhook za status. Faktura koja se ovde izdaje već ima broj narudžbine, i taj isti broj ide na SEF — nema ponovnog numerisanja.

## Šta ostaje za Etapu 3

Ulazne fakture iz SEF-a i tab u Finansijama sa odobravanjem troškova.

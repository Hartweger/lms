# Flip-day runbook — hartweger.rs → novi app

Prelazak glavnog domena `hartweger.rs` sa starog WordPress/LearnDash na novi Vercel app.
**Kanonski domen posle flipa: `www.hartweger.rs`** (ceo kod već pokazuje tamo — sitemap, canonical, llms, metadataBase).

## Topologija

| Domen | Sada | Posle flipa |
|---|---|---|
| `hartweger.rs` (apex) | stari WP | 301 → `www.hartweger.rs` |
| `www.hartweger.rs` | stari WP | **novi app (primary)** |
| `kurs.hartweger.rs` | novi app | 301 → `www.hartweger.rs` |
| `old.hartweger.rs` | — (ne postoji) | stari WP, read-only most |

Redirekcije u `next.config.ts` su RELATIVNE → aktiviraju se same kad `www` počne da servira app. Nema „kurs→hartweger" kao mehanizam; flip = www prestane da gađa WP i počne da gađa Vercel.

---

## FAZA 0 — Pre-flip (mora biti zeleno pre nego što se dira DNS)

- [ ] **old.hartweger.rs most** stoji: stari WP dostupan na poddomenu, read-only, za zatečene LearnDash studente. *(vlasnik: hosting/Nataša)*
- [ ] **Woo „Kupi" dugmad na starom WP zatvorena** (gase se ili redirektuju na novi sajt) — da nema dvostruke prodaje. *(vlasnik: WP)*
- [ ] **Svi LearnDash kupci migrirani + imaju pristup** na novom appu (575 korisnika ✅ urađeno 06.06). Poštuje wp-gašenje-bloker.
- [ ] **course_unlocks** pokriva sve kupljive kurseve (31/34, ostala 3 su grupni-C1/mesečni → otključavaju se upisom, namerno) ✅
- [ ] **Redirekcije** kompletne (268/268 + product slugovi + tip-kursa + masterclass) ✅
- [ ] **SEO/AI** spreman (JSON-LD, llms.txt, llms-full.txt, robots, sitemap) ✅
- [ ] **NEXT_PUBLIC_SITE_URL** spreman da se prebaci (vidi Fazu 2)

---

## FAZA 1 — DNS flip *(vlasnik: Nataša / DNS provajder + Vercel)*

1. U **Vercel → projekat `lms` → Settings → Domains**: dodaj `www.hartweger.rs` i `hartweger.rs`.
2. Podesi **`hartweger.rs` (apex) → redirect na `www.hartweger.rs`** (Vercel domain redirect, 308/301).
3. Kod DNS provajdera: prebaci `www` (CNAME) i apex (A/ALIAS) sa starog hostinga na Vercel (vrednosti koje Vercel da).
4. `kurs.hartweger.rs`: ostavi na projektu, ali podesi **`kurs.hartweger.rs` → redirect → `www.hartweger.rs`** (Vercel domain redirect). Stari bukmarci i dalje rade, jedan kanonski domen.
5. Sačekaj propagaciju (TTL). Proveravaj sa `dig www.hartweger.rs` da pokazuje na Vercel.

> ⚠️ Prelazni period ~1 mesec: `old.hartweger.rs` radi paralelno za polaznike koji još nisu prešli.

---

## FAZA 2 — Code/env prebacivanje *(vlasnik: ja, 1 komanda + deploy)*

Domen je centralizovan u `src/lib/site-url.ts` (default `kurs.hartweger.rs`). Sve mejlove, sertifikate i NaKI prompt vodi `NEXT_PUBLIC_SITE_URL`. Na flip:

```bash
vercel env rm NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_SITE_URL production   # vrednost: https://www.hartweger.rs
vercel --prod
```

Time se menjaju: verifikacioni URL na sertifikatima, „sledeći nivo" mejlovi (cron + profesor), NaKI prompt URL-ovi — svi pređu na www. **Nema izmena koda na flip-dan.**

Ručno (kozmetika/legal, nisu kritični — odraditi kad stigne):
- `src/app/instaliraj/page.tsx` — PWA uputstvo „Otvorite kurs.hartweger.rs" (×3) → hartweger.rs
- `src/app/politika-privatnosti/page.tsx` — pravni tekst pominje kurs.hartweger.rs (×3) → www.hartweger.rs

---

## FAZA 3 — Post-flip verifikacija

- [ ] `https://www.hartweger.rs/` → novi app (200)
- [ ] `https://hartweger.rs/` → 301 → www
- [ ] `https://kurs.hartweger.rs/` → 301 → www
- [ ] Stari WP URL radi: `www.hartweger.rs/proizvod/polozi-goethe-b1-sa-natasom-i-katarinom` → 308 → `/kursevi/polozi-goethe-b1`
- [ ] Blog: `www.hartweger.rs/<stari-slug>` → 308 → `/magazin/<slug>`
- [ ] Masterclass: `www.hartweger.rs/proizvod/kako-da-naucis-reci-na-stranom-jeziku` → 308 → `/kurs/kako-uciti-reci`
- [ ] Login/checkout rade na www (NestPay callback koristi NEXT_PUBLIC_SITE_URL)
- [ ] Novi sertifikat ima „Verifikacija: www.hartweger.rs/..."
- [ ] **Google Search Console**: dodaj `www.hartweger.rs` property, pošalji `sitemap.xml`, prati Coverage. Domen ostaje hartweger.rs → NE treba „Change of Address".

---

## ROLLBACK (ako nešto pukne)

DNS je jedina prelomna tačka. Vraćanje:
1. Vrati DNS `www`/apex na stari hosting (LearnDash) — propagacija po TTL-u.
2. `NEXT_PUBLIC_SITE_URL` vrati na `https://kurs.hartweger.rs` + `vercel --prod`.
3. Novi app i dalje živ na `kurs.hartweger.rs` — ništa se ne gubi.

> Drži TTL nizak (npr. 300s) 24–48h pre flipa da rollback bude brz.

---

## DODATAK — tačne komande za flip-dan

**Stanje prep-a (2026-06-08):** Vercel domeni dodati ✅ | TTL nizak (apex 60s, www 299s) ✅ | kod centralizovan ✅. Ostaje samo koordinisani flip.

### A) Hostinger DNS zona (hPanel → Domains → DNS Zone) — VLASNIK: Nataša
**TAČNE vrednosti iz Vercela (potvrđeno 2026-06-08, novi domen-specifični zapisi):**
- `www` zapis: promeni CNAME sa `www.hartweger.rs.cdn.hstgr.net` na **`a6ecaa8021378145.vercel-dns-017.com.`**
- `@` (apex): obriši stare A (`92.113.*`) i dodaj **A → `216.198.79.1`**
- dodaj **`old` A → `92.113.23.51`** (trenutni web IP WP-a) — most za stare studente
(Stari generički zapisi `cname.vercel-dns.com` / `76.76.21.21` i dalje rade ali Vercel preporučuje gornje nove.)

### B) WP rekonfiguracija na `old.` (SSH) — VLASNIK: Nataša (ima lozinku)
```bash
ssh -p 65002 u184006541@89.116.120.25
cd ~/domains/hartweger.rs/public_html   # ili gde je WP
# kanonski domen WP-a -> old.
wp option update home    'https://old.hartweger.rs'
wp option update siteurl 'https://old.hartweger.rs'
# zameni domen u sadržaju (prvo dry-run pa bez njega)
wp search-replace 'https://www.hartweger.rs' 'https://old.hartweger.rs' --skip-columns=guid --dry-run
wp search-replace 'https://hartweger.rs'     'https://old.hartweger.rs' --skip-columns=guid --dry-run
```
U hPanelu: dodaj `old.hartweger.rs` kao alias/parked domen na isti WP docroot.

### C) Zatvori Woo prodaju na `old.` (mu-plugin) — VLASNIK: Nataša
Napravi fajl `wp-content/mu-plugins/zatvori-prodaju.php`:
```php
<?php
/* Plugin Name: Zatvori Woo prodaju (migracija) */
add_filter('woocommerce_is_purchasable', '__return_false');
add_action('template_redirect', function () {
  if (function_exists('is_cart') && (is_cart() || is_checkout())) {
    wp_redirect('https://www.hartweger.rs/kursevi', 301); exit;
  }
});
```
Tako stari studenti i dalje gledaju LearnDash kurseve, ali niko ne može da kupi (sve kupovine idu na novi sajt).

### D) Ja (kod) — posle DNS flipa
```bash
vercel env rm NEXT_PUBLIC_SITE_URL production --yes
vercel env add NEXT_PUBLIC_SITE_URL production   # https://www.hartweger.rs
vercel --prod
```

---

## POSLE flipa (zaseban posao)

- Mejlovi/obaveštenja korisnicima (TEK SAD, po dogovoru — poslednji korak).
- Po isteku prelaznog perioda: gašenje + arhiviranje starog WP-a.
- **Blok D**: grupni/individualni checkout + termini/profesor + Calendar/Meet + Apps Script zamene (XL).

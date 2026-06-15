# DNS selidba — hartweger.rs (Hostinger se gasi ~15.07.2026)

**Problem:** Nameserveri za `hartweger.rs` su na Hostinger-u (`ns1/ns2.dns-parking.com`).
Kad se Hostinger ugasi, gasi se DNS za ceo domen → **padaju i sajt (www) i prijem mejlova (info@, natasa@)**, ne samo kurs.

**Plan:** Preseliti DNS pre gašenja. Dve opcije:
- **(A) Vercel DNS** — promeni nameservere domena na Vercel-ove (kao što je već `natasahartweger.rs`). Sajt records idu lako; MX/TXT za mejl recreirati ručno.
- **(B) Cloudflare DNS (besplatno, preporuka)** — Cloudflare često sam importuje postojeću zonu; pouzdano za mejl + web.

**Najbezbednije:** prvo **export zone iz Hostinger-a** (Hostinger DNS panel ima export), pa import kod novog. Donji popis je kontrolna lista (snimljeno 14.06.2026) — proveri da je SVE preneto:

## Zapisi koje OBAVEZNO preneti

### Sajt (Vercel)
| Tip | Ime | Vrednost |
|-----|-----|----------|
| A | `@` (root) | `216.198.79.1` (Vercel) — root radi 308→www |
| CNAME | `www` | `a6ecaa8021378145.vercel-dns-017.com` (Vercel) |

### Prijem mejlova — Google Workspace (info@, natasa@) — KRITIČNO
| Tip | Ime | Vrednost |
|-----|-----|----------|
| MX | `@` | `1 aspmx.l.google.com` |
| MX | `@` | `5 alt1.aspmx.l.google.com`, `5 alt2.aspmx.l.google.com` |
| MX | `@` | `10 alt3.aspmx.l.google.com`, `10 alt4.aspmx.l.google.com` |

### TXT na root (`@`)
- SPF: `v=spf1 include:_spf.mlsend.com include:_spf.google.com include:spf.titan.email ~all`
- `google-site-verification=Hdp4I5gbXWXzYIb-OjOq8E3wH9rs_ckAK19tzY1hCL4`
- `facebook-domain-verification=2e9d513hxcxqcui4w2iylp149nogxl`
- DKIM na root: `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzzIA4T55...` (dvodelni, ceo preneti)

### DMARC
| Tip | Ime | Vrednost |
|-----|-----|----------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@hartweger.rs` |

### Resend (slanje mejlova iz LMS-a) — KRITIČNO za automatske mejlove
| Tip | Ime | Vrednost |
|-----|-----|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGkAU7v4wxQrTC7+1+/IQWJWacia2fvkH+YHWuz4R7aBFpaiyACglvX+dZNqpOIxX5+gWB6DvPchVcGowr9xMhcMD0vbnJ38ghVK5KxdFW5bIbdMBv8/ZCcp7p/yz6pmcGThGonGklM9XpFmuQPl6nGN0w1L6KK3c84gX0g6udCQIDAQAB` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| MX | `send` | `10 feedback-smtp.eu-west-1.amazonses.com` |

## NE preneti
- **`kurs` (CNAME → cname.vercel-dns.com)** — mrtav, namerno se izostavlja. Time se `kurs.hartweger.rs` gasi.
- **`mail` A `89.116.120.25`** (stari Hostinger server) — proveriti da li se koristi (verovatno legacy, mejl je sad Google Workspace). Ako se ne koristi → ne prenositi.

## Ko drži domen + produženje
- Domen registruje/drži **veb developer Saša Savić, Webolution (`sasa@webolution.rs`)** preko registrara **CRI Domains**. RNIDS/CRI mejlovi idu njemu, ne Nataši.
- **Ističe 26.04.2027** — produženje ide preko CRI Domains, praktično preko Saše (ili da Nataša dobije login/fakturu).
- **Preporuka (reći Saši dok ionako dira domen):** preneti domen na Natašin sopstveni nalog (npr. **Loopia**, gde već ima `natasahartweger.rs`) ILI joj dati CRI Domains login — da ubuduće sama produžava i menja DNS, bez posrednika. `.rs` prenos ide preko auth koda od trenutnog registrara.

## Posle selidbe — proveriti
- [ ] `dig www.hartweger.rs` i sajt 200
- [ ] poslati test mejl NA info@hartweger.rs (prijem radi)
- [ ] iz LMS-a poslati test (Resend slanje radi, DKIM prolazi)
- [ ] MailerLite i Titan zapisi (ako se koriste) preneti — proveri u Hostinger zoni ima li još `mlsend`/`titan`/autodiscover CNAME/TXT koje dig nije uhvatio
- [ ] obrisati/repointovati Sentry uptime monitor sa kurs → www

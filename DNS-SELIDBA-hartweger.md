# DNS selidba — hartweger.rs (Hostinger se gasi 8.7.2026 — POTVRĐENO 27.06, HITNO)

> ⏰ **Rok pomeren na 8.7.2026** (Nataša, 27.06), ranije od pretpostavljenog 15.07. DNS MORA biti
> na novom provajderu pre toga — inače 8.7 padaju i sajt (www) i prijem svih mejlova (info@, natasa@).
> Nameservere menja Saša Savić / CRI Domains (vidi dno). Pokrenuti odmah zbog propagacije (TTL).

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

### old.hartweger.rs — stari WP most, DRŽATI DO 8.7 (obećano polaznicima)
⚠️ **REŠENJE: NE fiksni A zapis nego NS delegacija nazad na Hostinger.** Provereno 27.06: Hostinger
servira `old` (i `dev`, `link`) iz **rotirajućeg pula IP-jeva** — viđeno 4+ različitih parova za sat
vremena (92.112.183.93/77.37.55.205, 185.170.199.231/91.108.123.73, 147.79.120.222/77.37.76.103,
185.170.199.115/91.108.123.157). Bilo koja dva fiksna IP-ja zastare → old. padne pre 8.7.
**Umesto A zapisa, u Cloudflare dodati NS delegaciju** za `old`/`dev`/`link`:
`NS old → ns1.dns-parking.com` + `ns2.dns-parking.com` (isto za dev, link). Hostinger ih onda servira
kao i sad sve do 8.7, bez nagađanja IP-ja. Posle 8.7 obrisati NS delegacije (kozmetika).

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
- DKIM na root (apex, inertan — DKIM bez selektora ne radi ništa, ali preneti da se ništa ne lomi). PUN, dvodelni, provereno 27.06: `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzzIA4T55+td1D33UVtdtG2D0uKPu3Y10+oR2fzK5dyeCW2w9URYyf5cgMFHqT9PKnzuX5HuOL8Akis+NHdUQvfNgCW+zzdXwRFtJrLJ/7MNeUR451hUucilJ7zR60PJCBkxHDgQVGDQGc9a0vMFsa2YJruPcALYaSI3cLT+qWQfQ3Fzse/QArmvCz0xjNDa0H` + nastavak `wR1Q2buHE9ZX5WaYr7h/HDciVNEhnk68q6kTc2C7hSUkzIkB+ztDE8Qh8abY7s6hi/z7Eu/07u9umOYnRfJvws0c/x8WyN5Oxmpy3zfFqPH1Avj/sDpiR4zfRsyKRev6C1cytOcJ2qzyg3ymw99iwIDAQAB`

### Google Workspace DKIM (selektor `google`) — NOVO, generisano 27.06.2026
Nije postojalo u Hostinger zoni (zato Gmail/Workspace mejlovi nisu bili potpisani → spam). Key
generisan 27.06, dodaje se DIREKTNO u NOVI DNS (ne u Hostinger koji se gasi). Posle ubacivanja +
propagacije → u Google Admin konzoli (Gmail → Authenticate email) kliknuti „Start authentication".
| Tip | Ime | Vrednost |
|-----|-----|----------|
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv8jxxG8lfz4ypI9aDWnedB7VtCB5mR0NMpLwPPlEUosl0yiWPaAXaZdwlCUxiAaxdkFJplBKmJvhNAHDYOiyjoJPSeaoBAW5dPX2IXZlZ+V4X/JmzA1GwHd9QBA4/BPh31IwrsqBhFKb6eI5bjZ4vtgTsw6F6MA4GsxNcfJoTlBVRKKpr2tLR179sOg9CxmM0geCwysFFfG3TeqHu+b6zC262KFYKjkpSwK/G+eHRXDRYUJEqpQopnENdsUvZ29Top5KzxuRG2LLBjH8M9G5ZU1mc+oe92D6EQVNCeaQG31FhDuqDZel+mTOPj/PNzPKDaGAdVMhrcZlXJb6WcWm/QIDAQAB` |

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

### Titan email DKIM (selektor `titan1`) + MailerLite DKIM — preneti
Provereno 27.06. **MailerLite IMA DKIM**: `litesrv._domainkey` CNAME → `litesrv._domainkey.mlsend.com`
(ranije promašeno jer sam probao ml/mlsend selektore; pravi selektor je `litesrv`). Cloudflare skener
ga je pokupio — zadržati, DNS only. Titan DKIM (`titan1`) zaseban TXT ispod.
| Tip | Ime | Vrednost |
|-----|-----|----------|
| TXT | `titan1._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD4soG0VLlLCaV+RtZBYz/QkKcwc/U7klWOkP8a7YHJCJnVdXxypavSYq+L5ZdujNt10HyzShpmv/MxPSYQvqfMLJCRBud45ejNJh4n7n5sQEpydDp5+wOoZaRxBFGZsK38owyq/1OWQ03IZjO+Occ3cdrHtpzHckfepKFSWJtVkwIDAQAB` |

## NE preneti (provereno uživo 27.06)
- **`kurs` (CNAME → cname.vercel-dns.com)** — i dalje živ, ali namerno se izostavlja → `kurs.hartweger.rs` se gasi (svi canonical/SEO već idu na www, smoke test prebačen na www).
- **`mail`** — više NE postoji A zapis (mejl je Google Workspace), ništa za preneti.
- **`ftp` A `89.116.120.25`** (stari Hostinger server) — legacy, ne prenositi (taj server ionako nestaje 8.7).
- Nema CAA, SRV, ni autodiscover/autoconfig zapisa — ništa skriveno za mejl klijente.

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

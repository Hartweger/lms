#!/bin/bash
# Popunjava Supabase courses tabelu sa marketing podacima za sve proizvode
SB_URL="https://rzmyglynjcygsbicssbt.supabase.co"
SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bXlnbHluamN5Z3NiaWNzc2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzI1MiwiZXhwIjoyMDkxODMzMjUyfQ.0eOWj0OJwzliA9rYnEd4HkDQS6ngF9fAZZdWy6znT9o"

H1="apikey: $SB_KEY"
H2="Authorization: Bearer $SB_KEY"
H3="Content-Type: application/json"
H4="Prefer: return=representation"

# Helper: update existing course by slug
update() {
  local slug="$1"
  local data="$2"
  echo "UPDATE $slug..."
  curl -s -X PATCH "$SB_URL/rest/v1/courses?slug=eq.$slug" \
    -H "$H1" -H "$H2" -H "$H3" -H "Prefer: return=minimal" \
    -d "$data"
  echo ""
}

# Helper: insert new course
insert() {
  local data="$1"
  echo "INSERT..."
  curl -s -X POST "$SB_URL/rest/v1/courses" \
    -H "$H1" -H "$H2" -H "$H3" -H "Prefer: return=minimal" \
    -d "$data"
  echo ""
}

echo "=== UPDATING EXISTING VIDEO COURSES ==="

# polozi-goethe-b1
update "polozi-goethe-b1" '{
  "title": "VIDEO + B1 ispit – kompletna priprema",
  "category": "video",
  "is_purchasable": true,
  "price": 3600,
  "paypal_price_eur": 31,
  "marketing_description": "Kompletna priprema za Goethe B1 ispit u jednom video kursu.\n\nOvaj kurs pokriva sva četiri dela ispita: čitanje (Lesen), slušanje (Hören), pisanje (Schreiben) i govor (Sprechen). Naučićete strategije za svaki deo, vežbati sa primerima iz pravih ispita i steći samopouzdanje za dan polaganja.\n\nKurs vode profesorka Nataša Hartweger i profesorka Katarina — obe sa dugogodišnjim iskustvom u pripremi kandidata za Goethe ispite.",
  "features": ["Svi delovi B1 ispita: Lesen, Hören, Schreiben, Sprechen", "Strategije i saveti za svaki deo", "Primeri iz pravih ispitnih zadataka", "Video lekcije — gledajte sopstvenim tempom", "Sa Natašom i Katarinom", "Pristup godinu dana"]
}'

# polozi-c1 → slug treba da bude polozi-goethe-c1 za konzistentnost
update "polozi-c1" '{
  "title": "VIDEO: Položi Goethe C1",
  "slug": "polozi-goethe-c1",
  "category": "video",
  "is_purchasable": true,
  "price": 3500,
  "paypal_price_eur": 30,
  "marketing_description": "Priprema za Goethe C1 ispit na naprednom nivou.\n\nKurs je namenjen kandidatima koji se pripremaju za C1 ispit — pokriva kompleksne tekstove, pisanje eseja, strukturirano izlaganje i razumevanje autentičnih audio materijala.\n\nSve lekcije su u video formatu i možete ih pratiti sopstvenim tempom.",
  "features": ["Kompleksni tekstovi i čitanje sa razumevanjem", "Pisanje eseja i formalnih tekstova", "Strukturirano usmeno izlaganje", "Slušanje autentičnih materijala", "Video lekcije — vaš tempo", "Pristup godinu dana"]
}'

# gramatika-a2-b1
update "gramatika-a2-b1" '{
  "title": "VIDEO + E-book Gramatika A2–B1",
  "category": "video",
  "is_purchasable": true,
  "price": 4680,
  "paypal_price_eur": 40,
  "marketing_description": "Kompletna gramatika od A2 do B1 nivoa sa profesorkom Natašom Hartweger.\n\n90 minuta video predavanja plus e-book sa svim objašnjenjima i vežbama na platformi. Idealno za one koji žele da sistematizuju gramatičko znanje ili da popune praznine iz ranijeg učenja.\n\nE-book ostaje vaš zauvek, a video lekcije su dostupne godinu dana.",
  "features": ["90 minuta video predavanja sa prof. Natašom", "E-book sa objašnjenjima i vežbama", "Kompletna gramatika A2–B1", "Pristup video lekcijama godinu dana", "E-book ostaje vaš zauvek"]
}'

# kurs-za-mame → update slug
update "kurs-za-mame" '{
  "title": "Kurs za mame i trudnice",
  "slug": "kurs-za-mame-i-trudnice",
  "category": "video",
  "is_purchasable": true,
  "price": 6435,
  "paypal_price_eur": 55,
  "marketing_description": "Kurs nemačkog jezika posebno dizajniran za mame i trudnice koje se pripremaju za život u Nemačkoj ili Austriji.\n\nUčite reči i fraze koje su vam zaista potrebne: kod pedijatra, u vrtiću, u školi, u apoteci, na roditeljskom sastanku. Bez nepotrebne teorije — fokus je na praktičnoj komunikaciji u svakodnevnim situacijama sa kojima se mame najčešće susreću.",
  "features": ["Vokabular za pedijatra, vrtić, školu", "Fraze za apoteku i hitne situacije", "Komunikacija na roditeljskim sastancima", "Praktične situacije iz svakodnevnog života", "Video lekcije — vaš tempo", "Pristup godinu dana"]
}'

# polozi-fide
update "polozi-fide" '{
  "title": "VIDEO: Položi FIDE",
  "category": "video",
  "is_purchasable": true,
  "price": 9360,
  "paypal_price_eur": 80,
  "marketing_description": "Priprema za FIDE jezički ispit koji se traži za dobijanje boravišne dozvole u Švajcarskoj.\n\nKurs pokriva sve delove FIDE testa: usmenu i pisanu komunikaciju na nemačkom jeziku u svakodnevnim situacijama. Naučićete šta tačno ispitivači očekuju i kako da se pripremite za svaki deo.\n\nKurs je namenjen svima koji planiraju život u Švajcarskoj i trebaju položiti jezički test za boravišnu dozvolu.",
  "features": ["Kompletna priprema za FIDE test", "Usmena i pisana komunikacija", "Strategije za svaki deo ispita", "Primeri iz pravih ispitnih situacija", "Video lekcije — vaš tempo", "Pristup godinu dana"]
}'

# polozi-fsp
update "polozi-fsp" '{
  "title": "VIDEO: FSP – pripremni kurs za lekare",
  "slug": "fsp",
  "category": "video",
  "is_purchasable": true,
  "price": 5960,
  "paypal_price_eur": 51,
  "marketing_description": "Specijalizovana priprema za FSP — stručni ispit neophodan lekarima koji žele da rade u Nemačkoj.\n\nKurs pokriva medicinsku terminologiju, komunikaciju sa pacijentima, pisanje nalaza i dokumentacije, kao i simulaciju ispitne situacije. Fokus je na praktičnom medicinskom nemačkom koji se traži na FSP ispitu.\n\nNamenjen lekarima koji su već na B2/C1 nivou opšteg nemačkog.",
  "features": ["Medicinska terminologija", "Komunikacija sa pacijentima na nemačkom", "Pisanje nalaza i dokumentacije", "Simulacija FSP ispitne situacije", "Video lekcije — vaš tempo", "Pristup godinu dana"]
}'

echo ""
echo "=== INSERTING NEW PRODUCTS ==="

# VIDEO kurs A1
insert '{
  "title": "VIDEO kurs A1",
  "slug": "video-kurs-a1",
  "description": "Kompletan A1 nivo u video lekcijama. Gramatika, izgovor, vežbanja — pratite sopstvenim tempom.",
  "course_type": "video",
  "category": "video",
  "is_purchasable": true,
  "is_published": true,
  "price": 11600,
  "paypal_price_eur": 99,
  "marketing_description": "Kompletan kurs nemačkog jezika za početnike — od nule do A1 nivoa.\n\nVideo lekcije sa profesorkom Natašom Hartweger pokrivaju sve što vam treba: azbuku i izgovor, osnovnu gramatiku, svakodnevne fraze i vokabular. Svaka lekcija ima vežbanja i testove da proverite naučeno.\n\nUčite sopstvenim tempom, bez pritiska. Pristup kursu imate godinu dana, a po završetku dobijate Hartweger sertifikat.",
  "features": ["Video lekcije sa prof. Natašom Hartweger", "Gramatika, izgovor, vokabular", "Testovi i vežbanja nakon svake lekcije", "Pristup platformi godinu dana", "Podrška u WhatsApp grupi", "Sertifikat HARTWEGER centra po završetku"]
}'

# VIDEO kurs A2
insert '{
  "title": "VIDEO kurs A2",
  "slug": "video-kurs-a2",
  "description": "Nastavak A1. Gramatika i vokabular za svakodnevne situacije — bez vremenskog pritiska.",
  "course_type": "video",
  "category": "video",
  "is_purchasable": true,
  "is_published": true,
  "price": 11600,
  "paypal_price_eur": 99,
  "marketing_description": "Nastavak A1 nivoa — elementarni nemački za svakodnevne situacije.\n\nNa A2 nivou učite da razgovarate o sebi, porodici, poslu i svakodnevnim situacijama. Gramatika postaje kompleksnija, ali sa video lekcijama i vežbanjima sve je jasno objašnjeno.\n\nKurs vodi profesorka Nataša Hartweger. Učite sopstvenim tempom sa pristupom godinu dana.",
  "features": ["Video lekcije sa prof. Natašom Hartweger", "Svakodnevne situacije i konverzacija", "Kompleksnija gramatika sa objašnjenjima", "Testovi i vežbanja nakon svake lekcije", "Pristup platformi godinu dana", "Podrška u WhatsApp grupi", "Sertifikat HARTWEGER centra po završetku"]
}'

# VIDEO kurs B1
insert '{
  "title": "VIDEO kurs B1",
  "slug": "video-kurs-b1",
  "description": "Srednji nivo u vašem tempu. Priprema za B1 ispit ili rad u nemačkom govornom području.",
  "course_type": "video",
  "category": "video",
  "is_purchasable": true,
  "is_published": true,
  "price": 11600,
  "paypal_price_eur": 99,
  "marketing_description": "Srednji nivo nemačkog jezika — B1 u video formatu.\n\nNa B1 nivou razumete glavne teme iz svakodnevnog života i slobodno izražavate mišljenje. Kurs pokriva argumentaciju, pisanje, kompleksniju gramatiku i pripremu za B1 ispit.\n\nIdealno za one koji planiraju rad u nemačkom govornom području ili žele da polože Goethe B1 ispit. Učite sopstvenim tempom.",
  "features": ["Video lekcije sa prof. Natašom Hartweger", "Argumentacija i izražavanje mišljenja", "Priprema za Goethe B1 ispit", "Kompleksnija gramatika i vokabular", "Testovi i vežbanja", "Pristup platformi godinu dana", "Podrška u WhatsApp grupi", "Sertifikat HARTWEGER centra po završetku"]
}'

# VIDEO: Položi Goethe B2
insert '{
  "title": "VIDEO: Položi Goethe B2",
  "slug": "polozi-goethe-b2",
  "description": "Ciljana priprema za Goethe B2 ispit. Strategije, tipovi zadataka i vežbanje svih delova testa.",
  "course_type": "video",
  "category": "video",
  "is_purchasable": true,
  "is_published": true,
  "price": 2880,
  "paypal_price_eur": 25,
  "marketing_description": "Ciljana priprema za Goethe B2 ispit sa Natašom i Ankom.\n\nKurs pokriva sve delove B2 ispita: čitanje, slušanje, pisanje i govor. Naučićete strategije za svaki deo, upoznati tipove zadataka i vežbati sa primerima iz pravih ispita.\n\nVodičke su profesorka Nataša Hartweger i profesorka Anka — obe sa višegodišnjim iskustvom u pripremi za Goethe ispite.",
  "features": ["Svi delovi Goethe B2 ispita", "Strategije za Lesen, Hören, Schreiben, Sprechen", "Sa Natašom i Ankom", "Primeri iz pravih ispitnih zadataka", "Video lekcije — vaš tempo", "Pristup godinu dana"]
}'

# Paket A1+A2
insert '{
  "title": "Video paket A1 + A2",
  "slug": "paket-a1-a2",
  "description": "A1 i A2 video kurs zajedno po specijalnoj ceni. Idealno za početnike koji žele brži napredak.",
  "course_type": "video",
  "category": "paket",
  "is_purchasable": true,
  "is_published": true,
  "price": 20475,
  "paypal_price_eur": 175,
  "marketing_description": "Dva video kursa u paketu po specijalnoj ceni — uštedite 2.725 din.\n\nPaket uključuje kompletne video kurseve A1 i A2 sa profesorkom Natašom Hartweger. Od potpunog početnika do elementarnog nivoa — sve u vašem tempu.\n\nIdealno za one koji žele da brže napreduju i odmah nastave sa A2 nakon završenog A1.",
  "features": ["VIDEO kurs A1 — kompletan početni nivo", "VIDEO kurs A2 — elementarni nivo", "Ušteda 2.725 din (12%) u odnosu na pojedinačnu kupovinu", "Pristup platformi godinu dana", "Podrška u WhatsApp grupi", "Sertifikat po završetku svakog nivoa"]
}'

# Paket A1+A2+B1
insert '{
  "title": "Video paket A1 + A2 + B1",
  "slug": "paket-a1-a2-b1",
  "description": "Kompletna putanja od nule do B1. Tri video kursa po najboljoj ceni.",
  "course_type": "video",
  "category": "paket",
  "is_purchasable": true,
  "is_published": true,
  "price": 29133,
  "paypal_price_eur": 249,
  "marketing_description": "Tri video kursa u paketu — kompletna putanja od nule do B1 po najboljoj ceni. Uštedite 5.667 din.\n\nPaket uključuje VIDEO kurs A1, A2 i B1 sa profesorkom Natašom Hartweger. Od apsolutnog početnika do samostalnog korisnika jezika — sve u jednom paketu.\n\nOvo je najpopularnija opcija jer pokriva sve što vam treba za svakodnevnu komunikaciju i pripremu za B1 ispit.",
  "features": ["VIDEO kurs A1 — početni nivo", "VIDEO kurs A2 — elementarni nivo", "VIDEO kurs B1 — srednji nivo", "Ušteda 5.667 din (16%) — najveća ušteda", "Pristup platformi godinu dana", "Podrška u WhatsApp grupi", "Sertifikat po završetku svakog nivoa"]
}'

echo ""
echo "=== DONE ==="

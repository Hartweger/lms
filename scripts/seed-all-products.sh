#!/bin/bash
# Seed ALL products — grupni, individualni, specijalni
SB_URL="https://rzmyglynjcygsbicssbt.supabase.co"
SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bXlnbHluamN5Z3NiaWNzc2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzI1MiwiZXhwIjoyMDkxODMzMjUyfQ.0eOWj0OJwzliA9rYnEd4HkDQS6ngF9fAZZdWy6znT9o"
H1="apikey: $SB_KEY"
H2="Authorization: Bearer $SB_KEY"
H3="Content-Type: application/json"

insert() {
  echo "INSERT $1..."
  curl -s -X POST "$SB_URL/rest/v1/courses" -H "$H1" -H "$H2" -H "$H3" -H "Prefer: return=minimal" -d "$2"
  echo ""
}

echo "=== GRUPNI KURSEVI ==="

insert "grupni-a1-1" '{
  "title":"Grupni kurs A1.1","slug":"grupni-kurs-nemackog-jezika-a1-1",
  "description":"Za apsolutne početnike. Za 7 nedelja — od nule do prvih razgovora na nemačkom.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":19600,"paypal_price_eur":168,
  "marketing_description":"Nikada niste učili nemački — ili ste pokušali, ali niste daleko stigli? Ovaj kurs je napravljen za taj prvi korak. Za 7 nedelja naučićete da se predstavite, postavljate pitanja i vodite prve kratke razgovore na nemačkom.\n\nNa platformi vas čekaju video lekcije profesorke Nataše Hartweger sa objašnjenjima gramatike, vokabulara i svega što je potrebno da razumete sagovornika i odgovorite. Na živoj nastavi (2× nedeljno, 60 min) u maloj grupi od 3 do 6 polaznika razvijate veštine govora i slušanja.\n\nČitanje i pisanje vežbate na platformi, u svom tempu.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe i flashcard kartice","Beleške sa svakog časa","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-a1-2" '{
  "title":"Grupni kurs A1.2","slug":"grupni-kurs-nemackog-jezika-a1-2-2",
  "description":"Nastavak A1.1. Proširivanje rečnika, prošlo vreme, kupovina, putovanje.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":19600,"paypal_price_eur":168,
  "marketing_description":"Nastavak A1.1 — na ovom nivou proširujete rečnik, učite prošlo vreme i snalazite se u svakodnevnim situacijama: kupovina, putovanje, kod lekara.\n\nKao i na A1.1, kombinujete video lekcije na platformi sa živom nastavom u maloj grupi 2× nedeljno. Profesorka vas vodi kroz konverzaciju i koriguje u realnom vremenu.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe i flashcard kartice","Beleške sa svakog časa","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-a2-1" '{
  "title":"Grupni kurs A2.1","slug":"grupni-kurs-nemackog-jezika-a2",
  "description":"Elementarni nivo. Razgovarate o sebi, porodici, poslu i svakodnevnim situacijama.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":19600,"paypal_price_eur":168,
  "marketing_description":"Na A2.1 nivou učite da razgovarate o poslu, zdravlju, stanovanju i svakodnevnim situacijama. Gramatika postaje kompleksnija, ali sa profesorkom koja vas vodi kroz svaki korak — sve je jasno.\n\nŽiva nastava 2× nedeljno u maloj grupi + video lekcije na platformi za samostalan rad.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe i flashcard kartice","Beleške sa svakog časa","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-a2-2" '{
  "title":"Grupni kurs A2.2","slug":"grupni-kurs-nemackog-jezika-a2-2",
  "description":"Nastavak A2.1. Mediji, kultura, kompleksnije situacije na višem nivou.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":19600,"paypal_price_eur":168,
  "marketing_description":"Nastavak A2.1 — učite o medijima, kulturi i kompleksnijim svakodnevnim situacijama. Gramatika i konverzacija na višem elementarnom nivou.\n\nŽiva nastava 2× nedeljno + video lekcije i vežbe na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe i flashcard kartice","Beleške sa svakog časa","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-b1-1" '{
  "title":"Grupni kurs B1.1","slug":"grupni-kurs-nemackog-jezika-b1-1-2",
  "description":"Srednji nivo. Razumete glavne teme i slobodno izražavate mišljenje.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":19600,"paypal_price_eur":168,
  "marketing_description":"Na B1.1 nivou razumete glavne teme iz svakodnevnog života, čitate tekstove srednje težine i slobodno izražavate mišljenje. Fokus je na argumentaciji, pisanju i kompleksnijoj gramatici.\n\nŽiva nastava 2× nedeljno u maloj grupi + video lekcije na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe i flashcard kartice","Beleške sa svakog časa","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-b1-2" '{
  "title":"Grupni kurs B1.2","slug":"grupni-kurs-nemackog-b1-2",
  "description":"Nastavak B1.1. Kompleksnija gramatika i bogaćenje vokabulara.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":19600,"paypal_price_eur":168,
  "marketing_description":"Nastavak B1.1 — kompleksnija gramatika, bogatiji vokabular i priprema za B1 ispit. Na kraju ovog kursa imate kompletno završen B1 nivo.\n\nŽiva nastava 2× nedeljno + video lekcije i vežbe na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe i flashcard kartice","Beleške sa svakog časa","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-b2-1" '{
  "title":"Grupni kurs B2.1","slug":"grupni-kurs-b2-1",
  "description":"Više-srednji nivo. Tečna komunikacija, složene strukture i apstraktne teme.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":21200,"paypal_price_eur":181,
  "marketing_description":"Na B2.1 nivou komunicirate tečno o apstraktnim temama, razumete složene tekstove i izražavate se precizno. Fokus je na poslovnom i akademskom nemačkom.\n\nŽiva nastava 2× nedeljno u maloj grupi + video lekcije na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe","Beleške sa svakog časa","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-b2-2" '{
  "title":"Grupni kurs B2.2","slug":"grupni-kurs-b2-2",
  "description":"Nastavak B2.1. Priprema za Goethe B2 ispit i napredna konverzacija.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":21200,"paypal_price_eur":181,
  "marketing_description":"Nastavak B2.1 — priprema za Goethe B2 ispit i napredna konverzacija. Kompleksne strukture, esej pisanje i akademski stil.\n\nŽiva nastava 2× nedeljno + video lekcije i vežbe na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe","Beleške sa svakog časa","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-c1-1" '{
  "title":"Grupni kurs C1.1","slug":"grupni-kurs-c1-1",
  "description":"Napredni nivo. Poslovni i akademski nemački, priprema za C1 ispit.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":21200,"paypal_price_eur":181,
  "marketing_description":"Na C1.1 nivou ovladavate poslovnim i akademskim nemačkim. Kompleksni tekstovi, prezentacije, pisanje eseja i priprema za Goethe C1 ispit.\n\nŽiva nastava 2× nedeljno u maloj grupi + video lekcije na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe","Beleške sa svakog časa","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

insert "grupni-c1-2" '{
  "title":"Grupni kurs C1.2","slug":"grupni-kurs-c1-2",
  "description":"Nastavak C1.1. Kompleksne strukture i kompletna priprema za Goethe C1 ispit.",
  "course_type":"group","category":"grupni","is_purchasable":true,"is_published":true,
  "price":21200,"paypal_price_eur":181,
  "marketing_description":"Nastavak C1.1 — kompletna priprema za Goethe C1 ispit. Kompleksne gramatičke strukture, akademsko pisanje i napredna konverzacija.\n\nŽiva nastava 2× nedeljno + video lekcije i vežbe na platformi.",
  "features":["Živa nastava 2× nedeljno (Google Meet, grupe 3–6)","Video lekcije sa prof. Natašom Hartweger","Testovi posle svake lekcije","Interaktivne vežbe","Beleške sa svakog časa","Pristup platformi godinu dana","Završni ispit i sertifikat HARTWEGER centra"]
}'

echo ""
echo "=== INDIVIDUALNI KURSEVI ==="

insert "ind-a1-1" '{
  "title":"Individualni kurs A1.1","slug":"individualni-kurs-nemackog-jezika-a11",
  "description":"Potpuno prilagođen vama. Vaš tempo, vaši ciljevi — idealno za zaposlene bez fiksnog rasporeda.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":23000,"paypal_price_eur":197,
  "marketing_description":"Kurs nemačkog za apsolutne početnike u individualnom formatu — 1 na 1 sa profesorkom.\n\nSve je prilagođeno vama: termin birate sami preko Google Calendar linka, tempo zavisi od vašeg napretka, a profesorka se fokusira 100% na vas.\n\nUz individualne časove dobijate i pristup video lekcijama na platformi — iste lekcije kao u video kursu, plus interaktivne vežbe, flashcard kartice i testove.",
  "features":["7 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","60+ video lekcija za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Testovi za proveru znanja","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-a1-2" '{
  "title":"Individualni kurs A1.2","slug":"individualni-kurs-nemackog-jezika-a1-2",
  "description":"Nastavak A1.1 u individualnom formatu. Gramatika i konverzacija prilagođeni vašem napretku.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":23000,"paypal_price_eur":197,
  "marketing_description":"Nastavak A1.1 u individualnom formatu — prošlo vreme, kupovina, putovanje, kod lekara.\n\nProfessorka vas vodi kroz konverzaciju, koriguje i prilagođava tempo vašem napretku. Termin birate sami preko Google Calendar linka.\n\nUz časove dobijate pristup video lekcijama i svim vežbama na platformi.",
  "features":["7 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","60+ video lekcija za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Testovi za proveru znanja","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-a2-1" '{
  "title":"Individualni kurs A2.1","slug":"individualni-kurs-nemackog-jezika-a2",
  "description":"Elementarni nivo jedan na jedan. Brži napredak jer je sve fokusirano samo na vas.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":33000,"paypal_price_eur":282,
  "marketing_description":"Elementarni nivo nemačkog — 1 na 1 sa profesorkom. Posao, zdravlje, stanovanje i svakodnevne situacije.\n\nBrži napredak jer je sve fokusirano samo na vas. Termin birate sami, tempo zavisi od vašeg napretka.\n\nUz časove dobijate pristup video lekcijama i svim interaktivnim vežbama na platformi.",
  "features":["10 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Video lekcije za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Testovi za proveru znanja","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-a2-2" '{
  "title":"Individualni kurs A2.2","slug":"individualni-kurs-nemackog-jezika-a2-2",
  "description":"Nastavak A2.1. Konverzacija, gramatika i vežbanja po vašim potrebama.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":33000,"paypal_price_eur":282,
  "marketing_description":"Nastavak A2.1 u individualnom formatu — mediji, kultura i kompleksnije situacije.\n\nKonverzacija, gramatika i vežbanja prilagođeni vašim potrebama. Termin birate sami.\n\nUz časove dobijate pristup video lekcijama i svim vežbama na platformi.",
  "features":["10 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Video lekcije za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Testovi za proveru znanja","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-b1-1" '{
  "title":"Individualni kurs B1.1","slug":"individualni-kurs-nemackog-jezika-b11",
  "description":"Srednji nivo, potpuno prilagođen. Fokus na govoru i razumevanju autentičnih materijala.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":35000,"paypal_price_eur":299,
  "marketing_description":"Srednji nivo nemačkog — 1 na 1 sa profesorkom. Argumentacija, pisanje i kompleksnija gramatika.\n\nFokus je na govoru i razumevanju autentičnih materijala. Potpuno prilagođen vašem tempu i ciljevima.\n\nUz časove dobijate pristup video lekcijama i svim vežbama na platformi.",
  "features":["10 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Video lekcije za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Testovi za proveru znanja","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-b1-2" '{
  "title":"Individualni kurs B1.2","slug":"individualni-kurs-nemackog-jezika-b1-2",
  "description":"Nastavak B1.1. Kompleksnija gramatika i priprema za B1 ispit u individualnom formatu.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":35000,"paypal_price_eur":299,
  "marketing_description":"Nastavak B1.1 — kompleksnija gramatika i priprema za B1 ispit.\n\nU individualnom formatu imate punu pažnju profesorke i tempo koji vam odgovara. Termin birate sami.\n\nUz časove dobijate pristup video lekcijama i svim vežbama na platformi.",
  "features":["10 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Video lekcije za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Testovi za proveru znanja","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-b2-1" '{
  "title":"Individualni kurs B2.1","slug":"individualni-kurs-nemackog-jezika-b2-1",
  "description":"Više-srednji nivo jedan na jedan. Tečna komunikacija, kompleksne strukture i apstraktne teme.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":37000,"paypal_price_eur":316,
  "marketing_description":"Više-srednji nivo nemačkog — 1 na 1 sa profesorkom. Tečna komunikacija, kompleksne strukture i apstraktne teme.\n\nPoslovni i akademski nemački prilagođen vašim ciljevima. Termin birate sami.\n\nUz časove dobijate pristup video lekcijama i vežbama na platformi.",
  "features":["10 individualnih časova (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Video lekcije za samostalno učenje","Interaktivne vežbe","Testovi za proveru znanja","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-mesecni" '{
  "title":"Individualni mesečni paketi","slug":"individualni-mesecni-paketi",
  "description":"Za poseban zahtev mimo nivoa. Plaćate mesečno i prilagođavate tempo i sadržaj prema potrebama.",
  "course_type":"individual","category":"mesecni","is_purchasable":true,"is_published":true,
  "price":14000,"paypal_price_eur":120,
  "marketing_description":"Individualni mesečni paket je za sve koji imaju poseban zahtev mimo standardnih nivoa.\n\nPlaćate mesečno, birate koliko časova želite i sadržaj prilagođavate prema potrebama — poslovni nemački, priprema za ispit, konverzacija ili bilo šta drugo.\n\nTermine zakazujete sami preko Google Calendar linka.",
  "features":["Individualni časovi (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Fleksibilan broj časova mesečno","Sadržaj prilagođen vašim potrebama","Otkazivanje najkasnije 24h pre časa","Idealno za održavanje ili intenzivan rad"]
}'

insert "ind-paket-a1" '{
  "title":"Paket A1 individualni (A1.1 + A1.2)","slug":"paket-nivo-a1-a1-1-a1-2-individualni-standard",
  "description":"A1.1 i A1.2 individualno u paketu. Kompletno savladajte A1 nivo uz personalnu pažnju predavača.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":46000,"paypal_price_eur":393,
  "marketing_description":"Kompletni A1 nivo u individualnom formatu — A1.1 i A1.2 u jednom paketu.\n\nDobijate sve individualne časove za oba podnivoa, plus pristup svim video lekcijama i vežbama na platformi. Termin birate sami.\n\nIdealno za one koji žele da kompletno savladaju A1 bez prekida.",
  "features":["14 individualnih časova (60 min) sa profesorkom","Kompletni A1 nivo (A1.1 + A1.2)","Google Calendar — zakazujete kad vama odgovara","120+ video lekcija za samostalno učenje","Interaktivne vežbe, flashcards i speak vežbe","Priručnik sa vokabularom i dijalozima","Pristup platformi godinu dana","Sertifikat HARTWEGER centra"]
}'

insert "ind-fide" '{
  "title":"Individualni: Položi FIDE","slug":"individualni-polozi-fide",
  "description":"Individualna priprema za FIDE ispit. Personalizovan program za švajcarsku boravišnu dozvolu.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":23000,"paypal_price_eur":197,
  "marketing_description":"Individualna priprema za FIDE jezički ispit — 1 na 1 sa profesorkom.\n\nPersonalizovan program za dobijanje švajcarske boravišne dozvole. Fokus na usmenu i pisanu komunikaciju u svakodnevnim situacijama koje se pojavljuju na testu.\n\nTermin birate sami preko Google Calendar linka.",
  "features":["Individualni časovi (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Kompletna priprema za FIDE test","Usmena i pisana komunikacija","Primeri iz pravih ispitnih situacija","Pristup platformi godinu dana"]
}'

insert "ind-fsp" '{
  "title":"FSP individualni – za lekare","slug":"fsp-individualni",
  "description":"Individualna priprema za FSP stručni ispit za lekare koji žele da rade u Nemačkoj.",
  "course_type":"individual","category":"individualni","is_purchasable":true,"is_published":true,
  "price":23000,"paypal_price_eur":197,
  "marketing_description":"Individualna priprema za FSP stručni ispit — 1 na 1 sa profesorkom.\n\nSpecijalizovan program za lekare: medicinska terminologija, komunikacija sa pacijentima, pisanje nalaza i dokumentacije.\n\nTermin birate sami preko Google Calendar linka.",
  "features":["Individualni časovi (60 min) sa profesorkom","Google Calendar — zakazujete kad vama odgovara","Medicinska terminologija","Komunikacija sa pacijentima","Pisanje nalaza i dokumentacije","Simulacija FSP ispitne situacije","Pristup platformi godinu dana"]
}'

echo ""
echo "=== PAKET A1+A2 (video) ==="

insert "paket-a1-a2" '{
  "title":"Video paket A1 + A2","slug":"paket-a1-i-a2",
  "description":"A1 i A2 video kurs zajedno po specijalnoj ceni.",
  "course_type":"video","category":"paket","is_purchasable":true,"is_published":true,
  "price":20475,"paypal_price_eur":175,
  "marketing_description":"Dva video kursa u paketu po specijalnoj ceni — uštedite 2.725 din.\n\nPaket uključuje kompletne video kurseve A1 i A2 sa profesorkom Natašom Hartweger. Od potpunog početnika do elementarnog nivoa.\n\nSve interaktivne vežbe, flashcard kartice, speak vežbe i priručnici uključeni.",
  "features":["VIDEO kurs A1 — kompletan početni nivo","VIDEO kurs A2 — elementarni nivo","Ušteda 2.725 din (12%)","120+ video lekcija","Interaktivne vežbe, flashcards i speak vežbe","Priručnici za oba nivoa","Pristup platformi godinu dana","Sertifikat po završetku svakog nivoa"]
}'

echo ""
echo "=== DONE ==="

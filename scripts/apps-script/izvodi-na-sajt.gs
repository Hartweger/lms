/**
 * Šalje bankovni izvod sa mejla na hartweger.rs.
 *
 * Radi u Natašinom Google nalogu (info@hartweger.rs), jednom dnevno.
 * Nalazi neobrađene mejlove od Banca Intese, izvlači XML prilog i šalje ga
 * sistemu. Obrađene niti obeleži etiketom, pa se isti izvod ne šalje dvaput.
 *
 * ZAŠTO ETIKETA, A NE „poslednjih N dana": mejl ume da stigne sa zakašnjenjem, a
 * skripta ume da preskoči dan. Etiketa pamti šta je stvarno obrađeno, bez obzira
 * na to kad je stiglo i kad je skripta radila.
 *
 * PODEŠAVANJE (jednom):
 *   1. script.google.com → Novi projekat → nalepi ovaj fajl
 *   2. Project Settings → Script Properties → dodaj:
 *        IZVOD_SECRET = (ključ koji ti je Claude poslao)
 *   3. Triggers → Add Trigger → posaljiIzvode → Time-driven → Day timer → 7-8am
 *   4. Pokreni `posaljiIzvode` jednom ručno, da odobriš pristup pošti
 */

var URL_PRIJEMA = 'https://www.hartweger.rs/api/izvod/prijem';
var POSILJALAC = 'info@mail.bancaintesa.rs';
var ETIKETA = 'izvod-poslat';

function posaljiIzvode() {
  var tajna = PropertiesService.getScriptProperties().getProperty('IZVOD_SECRET');
  if (!tajna) {
    throw new Error('Fali IZVOD_SECRET u Script Properties.');
  }

  var etiketa = GmailApp.getUserLabelByName(ETIKETA) || GmailApp.createLabel(ETIKETA);

  // Traže se samo neobeležene niti, i to unazad 30 dana - da prvo pokretanje ne
  // povuče celu istoriju.
  var upit = 'from:' + POSILJALAC + ' has:attachment newer_than:30d -label:' + ETIKETA;
  var niti = GmailApp.search(upit, 0, 25);

  var poslato = 0;
  var greske = [];

  for (var i = 0; i < niti.length; i++) {
    var poruke = niti[i].getMessages();
    var uspelo = false;

    for (var j = 0; j < poruke.length; j++) {
      var prilozi = poruke[j].getAttachments();
      for (var k = 0; k < prilozi.length; k++) {
        var ime = prilozi[k].getName() || '';
        if (ime.toLowerCase().slice(-4) !== '.xml') continue;

        var odgovor = UrlFetchApp.fetch(URL_PRIJEMA, {
          method: 'post',
          contentType: 'application/xml',
          headers: { Authorization: 'Bearer ' + tajna },
          payload: prilozi[k].getDataAsString('UTF-8'),
          muteHttpExceptions: true,
        });

        var kod = odgovor.getResponseCode();
        if (kod >= 200 && kod < 300) {
          poslato++;
          uspelo = true;
        } else {
          greske.push(ime + ': HTTP ' + kod + ' ' + odgovor.getContentText().slice(0, 200));
        }
      }
    }

    // Etiketa ide SAMO ako je slanje uspelo - inače se sutra pokušava ponovo.
    if (uspelo) niti[i].addLabel(etiketa);
  }

  Logger.log('Poslato izvoda: ' + poslato + (greske.length ? ' | greške: ' + greske.join(' ; ') : ''));

  // Greška se prijavljuje mejlom: skripta koja tiho pada je gora od one koja ne postoji.
  if (greske.length) {
    MailApp.sendEmail(
      'info@hartweger.rs',
      'Izvod nije poslat na sajt',
      'Skripta nije uspela da pošalje izvod:\n\n' + greske.join('\n\n')
    );
  }
}

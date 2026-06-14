/**
 * Hartweger CRM — Gmail → CRM sinhronizacija (Apps Script).
 * Postavlja se na info@hartweger.rs Google nalogu (script.google.com → New project).
 *
 * Šta radi: nađe niti sa labelom "CRM" koje još nisu obrađene, izvuče pošiljaoca
 * (ime + mejl) + naslov + tekst prve poruke i pošalje na CRM ingest. Posle uspeha
 * niti doda label "CRM-uvezeno" da se ne šalje dvaput.
 *
 * Podešavanje (jednom): pokreni ručno postaviOkidac() da napravi okidač na 15 min,
 * i odobri tražene dozvole (Gmail + UrlFetch).
 */

var CRM_ENDPOINT = 'https://www.hartweger.rs/api/crm/ingest';
var CRM_TOKEN = 'mc_024267aaeac1e3fb32af06f3eba432269f972a481c64de95';
var LABEL_NEW = 'CRM';
var LABEL_DONE = 'CRM-uvezeno';
var OUR_DOMAIN = '@hartweger.rs';

function syncCrmFromGmail() {
  var doneLabel = GmailApp.getUserLabelByName(LABEL_DONE) || GmailApp.createLabel(LABEL_DONE);
  var threads = GmailApp.search('label:' + LABEL_NEW + ' -label:' + LABEL_DONE, 0, 25);
  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    try {
      var msg = firstExternalMessage_(thread.getMessages());
      var parsed = parseFrom_(msg.getFrom());
      if (!parsed.email) { Logger.log('Preskačem nit bez mejla'); continue; }
      var payload = {
        channel: 'mejl',
        email: parsed.email,
        name: parsed.name,
        subject: thread.getFirstMessageSubject() || '(bez naslova)',
        message: msg.getPlainBody().slice(0, 6000)
      };
      var res = UrlFetchApp.fetch(CRM_ENDPOINT, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-crm-token': CRM_TOKEN },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 200) {
        thread.addLabel(doneLabel);
      } else {
        Logger.log('CRM ingest greška ' + res.getResponseCode() + ': ' + res.getContentText());
      }
    } catch (e) {
      Logger.log('Greška na niti: ' + e);
    }
  }
}

/** Prva poruka u niti koja NIJE sa našeg domena (lid), fallback na prvu. */
function firstExternalMessage_(msgs) {
  for (var i = 0; i < msgs.length; i++) {
    if (msgs[i].getFrom().toLowerCase().indexOf(OUR_DOMAIN) === -1) return msgs[i];
  }
  return msgs[0];
}

/** "Ime Prezime <mejl@x.rs>" → {name, email}; ili goli mejl. */
function parseFrom_(from) {
  var m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || null, email: m[2].trim().toLowerCase() };
  return { name: null, email: from.trim().toLowerCase() };
}

/** Pokreni JEDNOM ručno: postavlja vremenski okidač na 15 min. */
function postaviOkidac() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncCrmFromGmail') ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('syncCrmFromGmail').timeBased().everyMinutes(15).create();
}

/**
 * Apps Script za formu "Moji utisci" — pri svakom novom odgovoru upiše ime u
 * Supabase tabelu review_responses (da cron za recenzije zna ko je popunio).
 *
 * POSTAVLJANJE (jednom, ~2 min):
 * 1. Otvori formu → ⋮ (gore desno) → "Script editor" (ili Extensions → Apps Script
 *    iz vezanog sheeta).
 * 2. Nalepi ovaj kod.
 * 3. Project Settings (zupčanik) → Script Properties → dodaj:
 *      SUPABASE_URL          = https://rzmyglynjcygsbicssbt.supabase.co
 *      SUPABASE_SERVICE_KEY  = <service_role key iz Supabase (Settings → API)>
 * 4. Triggers (sat) → Add Trigger → funkcija: onReviewFormSubmit,
 *      event source: From form, event type: On form submit → Save.
 * 5. Pošalji jedan probni odgovor i proveri da se pojavio red u review_responses.
 *
 * Ime se čita iz polja "tvoje ime i prezime". Ako se naziv polja promeni,
 * ažuriraj NAME_FIELD ispod.
 */

var NAME_FIELD = "tvoje ime i prezime";

function onReviewFormSubmit(e) {
  try {
    var name = "";
    if (e && e.namedValues && e.namedValues[NAME_FIELD]) {
      name = String(e.namedValues[NAME_FIELD][0] || "").trim();
    } else if (e && e.values && e.values.length > 1) {
      // fallback: 2. kolona je obično ime (1. je vremenska oznaka)
      name = String(e.values[1] || "").trim();
    }
    if (!name) return;

    var props = PropertiesService.getScriptProperties();
    var url = props.getProperty("SUPABASE_URL");
    var key = props.getProperty("SUPABASE_SERVICE_KEY");
    if (!url || !key) {
      Logger.log("Nedostaje SUPABASE_URL ili SUPABASE_SERVICE_KEY u Script Properties.");
      return;
    }

    var resp = UrlFetchApp.fetch(url + "/rest/v1/review_responses", {
      method: "post",
      contentType: "application/json",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        Prefer: "return=minimal",
      },
      payload: JSON.stringify({ full_name: name, source: "form" }),
      muteHttpExceptions: true,
    });
    Logger.log("review_responses upis: " + resp.getResponseCode() + " za " + name);
  } catch (err) {
    Logger.log("onReviewFormSubmit greška: " + err);
  }
}

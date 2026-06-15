/**
 * Einstufungstest Notifikacija
 *
 * Deploy kao Web App u Google Apps Script:
 * 1. Napravi novi projekat na script.google.com
 * 2. Zalepi ovaj kod
 * 3. Deploy > New deployment > Web app
 * 4. Execute as: Me, Access: Anyone
 * 5. Kopiraj URL i stavi u Vercel env kao NOTIFY_WEBHOOK_URL
 */

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  var subject = "Novi test nivoa: " + data.email + " → " + data.level;
  var body = "Neko je završio besplatno testiranje!\n\n" +
    "Email: " + data.email + "\n" +
    "Preporučeni nivo: " + data.level + "\n" +
    "Rezultat: " + data.score + "\n" +
    "Detalji: " + data.details + "\n\n" +
    "Pogledaj sve rezultate: https://www.hartweger.rs/admin/test-nivoa";

  GmailApp.sendEmail("natasa@hartweger.rs", subject, body);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

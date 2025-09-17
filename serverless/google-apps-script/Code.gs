// Google Apps Script Web App handler for Logical Books forms
// Deployment steps:
// 1) Create a new Apps Script project, paste this file.
// 2) Create a Google Sheet and copy its ID. Set Script Properties:
//    - SHEET_ID: <your-sheet-id>
//    - DEST_EMAIL: info@logicalbooks.com (or preferred)
// 3) Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4) Use the deployment URL as FORM_ENDPOINT (no trailing slash) and post to
//    `${FORM_ENDPOINT}/contact` and `${FORM_ENDPOINT}/intake` (handled below).

function doPost(e) {
  try {
    var path = e?.pathInfo || '';
    var body = e?.postData?.contents || '';
    var data = {};
    try { data = JSON.parse(body); } catch (err) { return json({ ok: false, error: 'Invalid JSON' }, 400); }

    var type = path && path.match(/intake$/) ? 'intake' : 'contact';
    if (type === 'contact' && (!data.name || !data.email || !data.message))
      return json({ ok: false, error: 'Missing fields' }, 400);
    if (type === 'intake' && (!data.name || !data.email || !data.challenges || !data.goals))
      return json({ ok: false, error: 'Missing fields' }, 400);

    // Persist to Sheet
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('SHEET_ID');
    if (sheetId) {
      var ss = SpreadsheetApp.openById(sheetId);
      var sh = ss.getSheetByName('submissions') || ss.insertSheet('submissions');
      if (sh.getLastRow() === 0) {
        sh.appendRow(['ts','type','name','email','phone','service','message','company','website','industry','stage','team','services','software','transactions','challenges','goals','budget','timeline','referrer','consent','source','userAgent']);
      }
      sh.appendRow([
        new Date(), type,
        safe(data.name), safe(data.email), safe(data.phone), safe(data.service), safe(data.message),
        safe(data.company), safe(data.website), safe(data.industry), safe(data.stage), safe(data.team),
        Array.isArray(data.services) ? data.services.join(', ') : safe(data.services),
        safe(data.software), safe(data.transactions), safe(data.challenges), safe(data.goals),
        safe(data.budget), safe(data.timeline), safe(data.referrer), data.consent ? 'yes' : 'no',
        safe(data.source), safe(data.userAgent)
      ]);
    }

    // Email notification
    var dest = props.getProperty('DEST_EMAIL');
    if (dest) {
      var subject = type === 'contact' ? 'New Contact Request – Logical Books' : 'New Intake Submission – Logical Books';
      var bodyText = Object.keys(data).map(function(k){ var v = data[k]; return k+': '+(typeof v === 'object' ? JSON.stringify(v) : v); }).join('\n');
      MailApp.sendEmail({ to: dest, subject: subject, body: bodyText, name: 'Logical Books Website' });
    }

    return json({ ok: true }, 200);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function json(obj, status) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  var resp = HtmlService.createHtmlOutput();
  var response = output;
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(obj));
}

function safe(v){ return (v == null ? '' : String(v)).slice(0, 4000); }


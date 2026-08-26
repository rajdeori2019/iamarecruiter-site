/**
 * I AM A RECRUITER — Join form backend
 * ------------------------------------------------------------------
 * Deployed as a Web App bound to the community Google Sheet. Receives
 * a POST from the website's Join form, appends a row to the "Master"
 * tab, and emails the person a welcome note with the WhatsApp invite.
 *
 * Setup: see README.md in this folder for the exact deployment steps.
 */

// ---- Configuration --------------------------------------------------

var SPREADSHEET_ID = '1T5GUZqQlIPIL_cOgiBrhJtzkzL1u4H7hK6ZB5zsAP6I';
var SHEET_NAME = 'Master';
var WHATSAPP_LINK = 'https://chat.whatsapp.com/9lNsbSksZ9F34ojDJxWNC1';
var COMMUNITY_NAME = 'I AM A RECRUITER';

// Column order written to the sheet. "Timestamp" is added automatically;
// the rest must match the field names sent by the website's join form.
var FIELDS = [
  'Name',
  'Email ID',
  'Phone - Mobile',
  'Job Title',
  'Current Company / Organisation Name',
  'Your Current Location',
  'Your LinkedIn Profile URL'
];

// ---- Entry point ------------------------------------------------------

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'No data received.' });
    }

    var data = JSON.parse(e.postData.contents);

    // Basic required-field validation
    var missing = FIELDS.filter(function (f) { return !data[f] || String(data[f]).trim() === ''; });
    if (missing.length) {
      return jsonResponse({ status: 'error', message: 'Missing fields: ' + missing.join(', ') });
    }
    if (!isValidEmail(data['Email ID'])) {
      return jsonResponse({ status: 'error', message: 'Invalid email address.' });
    }

    appendToSheet(data);
    sendWelcomeEmail(data);

    return jsonResponse({ status: 'success' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err && err.message ? err.message : String(err) });
  }
}

// Lets you sanity-check the deployment URL by opening it in a browser.
function doGet(e) {
  return ContentService
    .createTextOutput('I AM A RECRUITER join-form endpoint is live. POST JSON to this URL.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ---- Sheet ------------------------------------------------------------

function appendToSheet(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Write the header row once, if the sheet is currently empty.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp'].concat(FIELDS));
    sheet.setFrozenRows(1);
  }

  var row = [new Date()].concat(FIELDS.map(function (f) { return data[f]; }));
  sheet.appendRow(row);
}

// ---- Email --------------------------------------------------------------

function sendWelcomeEmail(data) {
  var firstName = String(data['Name']).trim().split(/\s+/)[0];
  var subject = 'Welcome to ' + COMMUNITY_NAME + '!';
  var body =
    'Hi ' + firstName + ',\n\n' +
    'Thank you for joining ' + COMMUNITY_NAME + ' — India\'s community for working recruiters. ' +
    'We\'re glad to have you.\n\n' +
    'One more step: join our WhatsApp community so you don\'t miss anything —\n' +
    WHATSAPP_LINK + '\n\n' +
    'We share career stories, live sessions, and opportunities to connect with recruiters across India ' +
    '— including our founding AI-Enabled Strategic Talent Advisor cohort.\n\n' +
    'Talk soon,\n' +
    'The ' + COMMUNITY_NAME + ' Team';

  MailApp.sendEmail({
    to: data['Email ID'],
    subject: subject,
    body: body
  });
}

// ---- Helpers ------------------------------------------------------------

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

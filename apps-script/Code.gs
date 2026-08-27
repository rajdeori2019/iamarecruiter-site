/**
 * I AM A RECRUITER — Website form backend
 * ------------------------------------------------------------------
 * Deployed as a Web App bound to the community Google Sheet. Receives
 * a POST from the website's forms (Join, and Event registrations),
 * appends a row to the relevant tab, and emails a confirmation.
 *
 * Setup: see README.md in this folder for the exact deployment steps.
 */

// ---- Configuration --------------------------------------------------

var SPREADSHEET_ID = '1T5GUZqQlIPIL_cOgiBrhJtzkzL1u4H7hK6ZB5zsAP6I';
var WHATSAPP_LINK = 'https://chat.whatsapp.com/9lNsbSksZ9F34ojDJxWNC1';
var COMMUNITY_NAME = 'I AM A RECRUITER';

// Each form on the site sends a "Form Type" field identifying which
// config below to use. The Join form omits it (defaults to 'join') so
// existing behaviour is unchanged.
var FORM_CONFIGS = {
  'join': {
    sheetName: 'Master',
    fields: [
      'Name',
      'Email ID',
      'Phone - Mobile',
      'Job Title',
      'Current Company / Organisation Name',
      'Your Current Location',
      'Your LinkedIn Profile URL'
    ],
    requiredFields: [
      'Name',
      'Email ID',
      'Phone - Mobile',
      'Job Title',
      'Current Company / Organisation Name',
      'Your Current Location',
      'Your LinkedIn Profile URL'
    ],
    buildEmail: function (data) {
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
      return {
        subject: 'Welcome to ' + COMMUNITY_NAME + '!',
        body:
          'Hi ' + firstName + ',\n\n' +
          'Thank you for joining ' + COMMUNITY_NAME + ' — India\'s community for working recruiters. ' +
          'We\'re glad to have you.\n\n' +
          'One more step: join our WhatsApp community so you don\'t miss anything —\n' +
          WHATSAPP_LINK + '\n\n' +
          'We share career stories, live sessions, and opportunities to connect with recruiters across India ' +
          '— including our founding AI-Enabled Strategic Talent Advisor cohort.\n\n' +
          'Talk soon,\n' +
          'The ' + COMMUNITY_NAME + ' Team'
      };
    }
  },

  'event-live-sourcing': {
    sheetName: 'Event - Live Sourcing Demo',
    fields: [
      'Name',
      'Email ID',
      'Phone - Mobile',
      'Job Title',
      'Current Company / Organisation Name',
      'Role You Want Sourced Live'
    ],
    requiredFields: [
      'Name',
      'Email ID',
      'Phone - Mobile',
      'Job Title',
      'Current Company / Organisation Name'
    ],
    buildEmail: function (data) {
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
      return {
        subject: 'You\'re registered — Live Sourcing Session, Fri 11 Sept',
        body:
          'Hi ' + firstName + ',\n\n' +
          'You\'re registered for "Your hardest role, sourced live." — Friday, 11 Sept, 4:00–5:00 PM IST, on Zoom.\n\n' +
          'Join here on the day: https://luma.com/nl6gkeb2\n\n' +
          (data['Role You Want Sourced Live'] ? 'The role you shared — "' + data['Role You Want Sourced Live'] + '" — is in the pool we may pick from to source live on the call.\n\n' : '') +
          'What you get:\n' +
          '- 7 days full access to LeadForce, no limitations\n' +
          '- 25% off your first paid month, exclusive to this session\n' +
          '- The recording, sent to everyone who registers — whether you make it live or not\n\n' +
          'See you Friday,\n' +
          'Prafulla Deori, ' + COMMUNITY_NAME
      };
    }
  }
};

// ---- Entry point ------------------------------------------------------

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'No data received.' });
    }

    var data = JSON.parse(e.postData.contents);
    var formType = data['Form Type'] || 'join';
    var config = FORM_CONFIGS[formType];
    if (!config) {
      return jsonResponse({ status: 'error', message: 'Unknown form type: ' + formType });
    }

    // Required-field validation (form-specific)
    var missing = config.requiredFields.filter(function (f) { return !data[f] || String(data[f]).trim() === ''; });
    if (missing.length) {
      return jsonResponse({ status: 'error', message: 'Missing fields: ' + missing.join(', ') });
    }
    if (!isValidEmail(data['Email ID'])) {
      return jsonResponse({ status: 'error', message: 'Invalid email address.' });
    }

    appendToSheet(config, data);
    sendConfirmationEmail(config, data);

    return jsonResponse({ status: 'success' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err && err.message ? err.message : String(err) });
  }
}

// Lets you sanity-check the deployment URL by opening it in a browser.
function doGet(e) {
  return ContentService
    .createTextOutput('I AM A RECRUITER website form endpoint is live. POST JSON to this URL.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ---- Sheet ------------------------------------------------------------

function appendToSheet(config, data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(config.sheetName);
  }

  // Write the header row once, if the sheet is currently empty.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp'].concat(config.fields));
    sheet.setFrozenRows(1);
  }

  var row = [new Date()].concat(config.fields.map(function (f) { return data[f] || ''; }));
  sheet.appendRow(row);
}

// ---- Email --------------------------------------------------------------

function sendConfirmationEmail(config, data) {
  var email = config.buildEmail(data);
  MailApp.sendEmail({
    to: data['Email ID'],
    subject: email.subject,
    body: email.body
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

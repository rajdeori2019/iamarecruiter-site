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
var LOGO_URL = 'https://www.iamarecruiter.in/assets/logo_trimmed.png';
var BRAND_ACCENT = '#E8A400';
var BRAND_INK = '#0E0E10';
var ADMIN_EMAIL = 'prafulladeori@gmail.com';

// ---- Branded HTML email wrapper ---------------------------------------
// bodyHtml is the inner content (already-safe HTML). buttons is an array
// of { text, url } — the first renders as a filled accent button, any
// further ones as outlined secondary buttons. Pass [] to omit buttons.
function wrapEmailHtml(bodyHtml, buttons) {
  buttons = buttons || [];
  var buttonRows = buttons.map(function (btn, idx) {
    var isPrimary = idx === 0;
    var style = isPrimary
      ? ('background:' + BRAND_ACCENT + '; color:' + BRAND_INK + '; border:2px solid ' + BRAND_ACCENT + ';')
      : ('background:transparent; color:' + BRAND_INK + '; border:2px solid ' + BRAND_INK + ';');
    var padBottom = (idx === buttons.length - 1) ? '32px' : '10px';
    return (
      '<tr><td style="padding:8px 40px ' + padBottom + ';">' +
        '<a href="' + btn.url + '" style="display:inline-block; ' + style + ' text-decoration:none; ' +
        'font-family:Arial,Helvetica,sans-serif; font-weight:bold; font-size:14px; letter-spacing:0.5px; ' +
        'padding:14px 28px; text-transform:uppercase; border-radius:2px;">' + btn.text + '</a>' +
      '</td></tr>'
    );
  }).join('');

  return (
    '<div style="background:#F4F3EE; padding:32px 16px; font-family:Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:#FFFFFF; border:1px solid #DAD7CC;">' +
        '<tr><td style="background:' + BRAND_INK + '; padding:28px 40px;">' +
          '<img src="' + LOGO_URL + '" alt="' + COMMUNITY_NAME + '" height="28" style="display:block; height:28px; width:auto;">' +
        '</td></tr>' +
        '<tr><td style="padding:36px 40px 8px; color:' + BRAND_INK + '; font-size:15px; line-height:1.6;">' +
          bodyHtml +
        '</td></tr>' +
        buttonRows +
        '<tr><td style="padding:24px 40px 32px; border-top:1px solid #DAD7CC;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
            '<td style="padding-right:16px; font-family:Arial,Helvetica,sans-serif; font-size:12px;"><a href="https://www.linkedin.com/company/i-am-a-recruiter-community" style="color:' + BRAND_INK + '; text-decoration:none;">LinkedIn</a></td>' +
            '<td style="padding-right:16px; font-family:Arial,Helvetica,sans-serif; font-size:12px;"><a href="https://www.instagram.com/i.am.a.recruiter/" style="color:' + BRAND_INK + '; text-decoration:none;">Instagram</a></td>' +
            '<td style="padding-right:16px; font-family:Arial,Helvetica,sans-serif; font-size:12px;"><a href="https://www.youtube.com/@IAMARECRUITER" style="color:' + BRAND_INK + '; text-decoration:none;">YouTube</a></td>' +
            '<td style="font-family:Arial,Helvetica,sans-serif; font-size:12px;"><a href="' + WHATSAPP_LINK + '" style="color:' + BRAND_INK + '; text-decoration:none;">WhatsApp</a></td>' +
          '</tr></table>' +
          '<p style="margin:16px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#8A8A8E;">' + COMMUNITY_NAME + ' — India\'s community for working recruiters.</p>' +
        '</td></tr>' +
      '</table>' +
    '</div>'
  );
}

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

      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'Welcome to ' + COMMUNITY_NAME + ' — so glad to have you here! You\'re now part of India\'s ' +
        'community for working recruiters, built by recruiters who wanted this to exist.\n\n' +
        'One last step — hop into our WhatsApp community so you don\'t miss anything:\n' +
        WHATSAPP_LINK + '\n\n' +
        'While you\'re at it, come say hello on our other channels too:\n' +
        '- LinkedIn: https://www.linkedin.com/company/i-am-a-recruiter-community\n' +
        '- Instagram: https://www.instagram.com/i.am.a.recruiter/\n' +
        '- YouTube: https://www.youtube.com/@IAMARECRUITER\n' +
        '- Facebook: https://www.facebook.com/I.MA.A.RECRUITER\n\n' +
        'Inside the community, you\'ll find a real peer network, honest career stories on the ' +
        COMMUNITY_NAME + ' podcast, live sessions, and warm introductions — plus our founding ' +
        'AI-Enabled Strategic Talent Advisor cohort if you want to go deeper.\n\n' +
        'A quick heads-up: going forward, we\'ll also reach you by email and phone/SMS — not just ' +
        'WhatsApp — so keep an eye on your inbox too.\n\n' +
        'Glad you\'re here — talk soon,\n' +
        'The ' + COMMUNITY_NAME + ' Team';

      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Welcome, ' + firstName + '! 🎉</p>' +
        '<p style="margin:0 0 16px;">So glad to have you here. You\'re now part of ' + COMMUNITY_NAME +
        ' — India\'s community for working recruiters, built by recruiters who wanted this to exist.</p>' +
        '<p style="margin:0 0 16px;">One last step — hop into our WhatsApp community so you don\'t miss anything. Tap the button below to join.</p>' +
        '<p style="margin:0 0 16px;">While you\'re at it, come say hello on our other channels:<br>' +
        '<a href="https://www.linkedin.com/company/i-am-a-recruiter-community" style="color:' + BRAND_INK + ';">LinkedIn</a> · ' +
        '<a href="https://www.instagram.com/i.am.a.recruiter/" style="color:' + BRAND_INK + ';">Instagram</a> · ' +
        '<a href="https://www.youtube.com/@IAMARECRUITER" style="color:' + BRAND_INK + ';">YouTube</a> · ' +
        '<a href="https://www.facebook.com/I.MA.A.RECRUITER" style="color:' + BRAND_INK + ';">Facebook</a></p>' +
        '<p style="margin:0 0 16px;">Inside the community: a real peer network, honest career stories on the ' + COMMUNITY_NAME +
        ' podcast, live sessions, and warm introductions — plus our founding AI-Enabled Strategic Talent Advisor cohort if you want to go deeper.</p>' +
        '<p style="margin:0; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + '; font-size:13px; color:#55565C;">' +
        'Heads-up: going forward we\'ll also reach you by email and phone/SMS — not just WhatsApp — so keep an eye on your inbox too.</p>';

      return {
        subject: 'Welcome to ' + COMMUNITY_NAME + ', ' + firstName + '! 🎉',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [
          { text: 'Join the WhatsApp Community', url: WHATSAPP_LINK }
        ])
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
      'Your Current Location',
      'Your LinkedIn Profile URL',
      'Will You Be Joining Live',
      'Role You Want Sourced Live',
      'JD File Link'
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
      var roleLine = data['Role You Want Sourced Live']
        ? 'The role you shared — "' + data['Role You Want Sourced Live'] + '" — is in the pool we may pick from to source live on the call.'
        : '';
      var jdLine = data['JD File Link']
        ? 'Got your JD attachment too — thanks for sending it over.'
        : '';
      var notComingLine = (data['Will You Be Joining Live'] && data['Will You Be Joining Live'].indexOf('No') === 0)
        ? 'No worries about missing it live — the recording will land in your inbox right after.'
        : '';

      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'You\'re registered for "Your hardest role, sourced live." — Friday, 11 Sept, 4:00–5:00 PM IST, on Zoom.\n\n' +
        'Join here on the day: https://luma.com/nl6gkeb2\n\n' +
        (roleLine ? roleLine + '\n\n' : '') +
        (jdLine ? jdLine + '\n\n' : '') +
        (notComingLine ? notComingLine + '\n\n' : '') +
        'What you get:\n' +
        '- 7 days full access to LeadForce, no limitations\n' +
        '- 25% off your first paid month, exclusive to this session\n' +
        '- The recording, sent to everyone who registers — whether you make it live or not\n\n' +
        'See you Friday,\n' +
        'Prafulla Deori, ' + COMMUNITY_NAME;

      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">You\'re in, ' + firstName + '. 🎉</p>' +
        '<p style="margin:0 0 16px;">You\'re registered for <strong>"Your hardest role, sourced live."</strong> — ' +
        '<strong>Friday, 11 Sept, 4:00–5:00 PM IST</strong>, on Zoom.</p>' +
        (roleLine ? '<p style="margin:0 0 16px; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + '; font-size:13px; color:#55565C;">' + roleLine + '</p>' : '') +
        (jdLine ? '<p style="margin:0 0 16px; color:#55565C; font-size:14px;">' + jdLine + '</p>' : '') +
        (notComingLine ? '<p style="margin:0 0 16px; color:#55565C; font-size:14px;">' + notComingLine + '</p>' : '') +
        '<p style="margin:0 0 8px; font-weight:bold;">What you get</p>' +
        '<ul style="margin:0 0 16px; padding-left:20px;">' +
          '<li style="margin-bottom:6px;">7 days full access to LeadForce, no limitations</li>' +
          '<li style="margin-bottom:6px;">25% off your first paid month, exclusive to this session</li>' +
          '<li>The recording, sent to everyone who registers — whether you make it live or not</li>' +
        '</ul>' +
        '<p style="margin:0;">See you Friday,<br>Prafulla Deori, ' + COMMUNITY_NAME + '</p>';

      return {
        subject: 'You\'re registered — Live Sourcing Session, Fri 11 Sept',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [
          { text: 'Join on Luma', url: 'https://luma.com/nl6gkeb2' },
          { text: 'Join WhatsApp Community', url: WHATSAPP_LINK }
        ])
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

    // If a JD file was attached (base64), upload it to Drive and store the link.
    if (data['JD File Base64']) {
      data['JD File Link'] = uploadJdFile(data);
    }

    appendToSheet(config, data);
    sendConfirmationEmail(config, data);
    sendAdminNotification(config, data, formType);

    return jsonResponse({ status: 'success' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err && err.message ? err.message : String(err) });
  }
}

// Decodes a base64 JD file sent from the event form, saves it into a
// "JD Uploads" Drive folder (creating it on first use), and returns a
// shareable link. Returns '' if anything about the upload fails — a
// failed upload should never block the registration itself.
function uploadJdFile(data) {
  try {
    var fileName = data['JD File Name'] || ('JD - ' + data['Name']);
    var mimeType = data['JD File MimeType'] || 'application/octet-stream';
    var bytes = Utilities.base64Decode(data['JD File Base64']);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);

    var folders = DriveApp.getFoldersByName('JD Uploads — I AM A RECRUITER');
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('JD Uploads — I AM A RECRUITER');

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return '';
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
  var options = { to: data['Email ID'], subject: email.subject, body: email.body };
  if (email.htmlBody) {
    options.htmlBody = email.htmlBody;
  }
  MailApp.sendEmail(options);
}

// Notifies the site owner of every new submission, with every field that
// was captured. Wrapped so a notification failure never blocks the
// person's own confirmation — their registration already succeeded.
function sendAdminNotification(config, data, formType) {
  try {
    var formLabel = formType === 'join' ? 'Join the Community' : 'Event — Live Sourcing Session';
    var lines = config.fields
      .filter(function (f) { return f !== 'JD File Link' || data[f]; }) // skip empty JD link line noise
      .map(function (f) { return f + ': ' + (data[f] || '—'); });

    var subject = 'New submission — ' + formLabel + ': ' + (data['Name'] || 'Unknown');
    var body =
      'New form submission on the website.\n\n' +
      'Form: ' + formLabel + '\n' +
      'Submitted: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '\n\n' +
      lines.join('\n');

    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: subject, body: body });
  } catch (err) {
    // Swallow — the person's own registration already succeeded regardless.
  }
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

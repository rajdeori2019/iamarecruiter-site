/**
 * I AM A RECRUITER — Website form backend
 * ------------------------------------------------------------------
 * Deployed as a Web App bound to the community Google Sheet. Receives
 * POSTs from website forms, appends rows to the relevant tab, and sends
 * applicant + admin confirmation emails.
 */

// ---- Configuration --------------------------------------------------

var SPREADSHEET_ID = '1T5GUZqQlIPIL_cOgiBrhJtzkzL1u4H7hK6ZB5zsAP6I';
var WHATSAPP_LINK = 'https://chat.whatsapp.com/9lNsbSksZ9F34ojDJxWNC1';
var COHORT_WHATSAPP_LINK = 'https://wa.me/919742944825?text=' + encodeURIComponent('Hi Prafulla, I have submitted my application for the AI-Enabled Strategic Talent Advisor founding cohort.');
var COMMUNITY_NAME = 'I AM A RECRUITER';
var LOGO_URL = 'https://www.iamarecruiter.in/assets/logo_trimmed.png';
var BRAND_ACCENT = '#E8A400';
var BRAND_INK = '#0E0E10';
var ADMIN_EMAIL = 'prafulladeori@gmail.com';

// ---- Branded HTML email wrapper ------------------------------------

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
          '<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#8A8A8E;">' + COMMUNITY_NAME + '</p>' +
        '</td></tr>' +
      '</table>' +
    '</div>'
  );
}

// ---- Form configurations --------------------------------------------

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
        'Welcome to ' + COMMUNITY_NAME + ' — so glad to have you here! You\'re now part of India\'s community for working recruiters.\n\n' +
        'Join the WhatsApp community here:\n' + WHATSAPP_LINK + '\n\n' +
        'Glad you\'re here,\nThe ' + COMMUNITY_NAME + ' Team';
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Welcome, ' + firstName + '! 🎉</p>' +
        '<p style="margin:0 0 16px;">You\'re now part of ' + COMMUNITY_NAME + ' — India\'s community for working recruiters.</p>' +
        '<p style="margin:0;">Use the button below to join the WhatsApp community.</p>';
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
      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'You\'re registered for "Your hardest role, sourced live." — Friday, 11 Sept, 4:00–5:00 PM IST, on Zoom.\n\n' +
        'Join here on the day: https://luma.com/nl6gkeb2\n\n' +
        'See you Friday,\nPrafulla Deori, ' + COMMUNITY_NAME;
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">You\'re in, ' + firstName + '. 🎉</p>' +
        '<p style="margin:0 0 16px;">You\'re registered for <strong>"Your hardest role, sourced live."</strong> — <strong>Friday, 11 Sept, 4:00–5:00 PM IST</strong>.</p>' +
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
  },

  'cohort-application': {
    sheetName: 'Cohort Applications',
    fields: [
      'Name',
      'Email ID',
      'Phone - Mobile',
      'Current Role',
      'Current Company / Organisation Name',
      'Recruiting Experience',
      'Main Capability Gap',
      'Current Challenge',
      'Source',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Application Status',
      'Follow-up Status',
      'Payment Status',
      'Cohort Batch',
      'Consent'
    ],
    requiredFields: [
      'Name',
      'Email ID',
      'Phone - Mobile',
      'Current Role',
      'Recruiting Experience',
      'Main Capability Gap',
      'Current Challenge',
      'Consent'
    ],
    defaults: {
      'Source': 'Website - Cohort Landing Page',
      'Application Status': 'NEW',
      'Follow-up Status': 'NOT STARTED',
      'Payment Status': 'UNPAID',
      'Cohort Batch': 'Batch 01 · Sep 2026'
    },
    buildEmail: function (data) {
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'Your application for the AI-Enabled Strategic Talent Advisor founding cohort has been received.\n\n' +
        'Next step: we will review fit based on your current recruiting experience and the capability gap you shared. If the cohort is a fit, you will receive the payment and onboarding path.\n\n' +
        'Founding cohort: 19 Sep–24 Oct 2026 | Saturdays | 10:30 AM–12:30 PM IST | ₹10,000.\n\n' +
        'You can continue the conversation with Prafulla on WhatsApp:\n' + COHORT_WHATSAPP_LINK + '\n\n' +
        'I AM A RECRUITER';
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Application received, ' + firstName + '.</p>' +
        '<p style="margin:0 0 16px;">Your application for the <strong>AI-Enabled Strategic Talent Advisor</strong> founding cohort is now recorded.</p>' +
        '<p style="margin:0 0 16px;">We\'ll review your recruiting experience and the capability gap you shared. If the cohort is the right fit, you\'ll receive the payment and onboarding path.</p>' +
        '<p style="margin:0; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + '; font-size:13px; color:#55565C;"><strong>Batch 01:</strong> 19 Sep–24 Oct 2026 · Saturdays · 10:30 AM–12:30 PM IST · ₹10,000</p>';
      return {
        subject: 'We received your Strategic Talent Advisor Cohort application',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [
          { text: 'Continue on WhatsApp', url: COHORT_WHATSAPP_LINK }
        ])
      };
    }
  }
};

// ---- Entry point ----------------------------------------------------

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

    applyDefaults(config, data);

    var missing = config.requiredFields.filter(function (f) {
      return !data[f] || String(data[f]).trim() === '';
    });
    if (missing.length) {
      return jsonResponse({ status: 'error', message: 'Missing fields: ' + missing.join(', ') });
    }
    if (!isValidEmail(data['Email ID'])) {
      return jsonResponse({ status: 'error', message: 'Invalid email address.' });
    }

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

function applyDefaults(config, data) {
  var defaults = config.defaults || {};
  Object.keys(defaults).forEach(function (field) {
    if (!data[field] || String(data[field]).trim() === '') {
      data[field] = defaults[field];
    }
  });
}

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

function doGet(e) {
  return ContentService
    .createTextOutput('I AM A RECRUITER website form endpoint is live. POST JSON to this URL.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ---- Sheet ----------------------------------------------------------

function appendToSheet(config, data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(config.sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp'].concat(config.fields));
    sheet.setFrozenRows(1);
  }

  var row = [new Date()].concat(config.fields.map(function (f) {
    return data[f] || '';
  }));
  sheet.appendRow(row);
}

// ---- Email ----------------------------------------------------------

function sendConfirmationEmail(config, data) {
  var email = config.buildEmail(data);
  var options = { to: data['Email ID'], subject: email.subject, body: email.body };
  if (email.htmlBody) options.htmlBody = email.htmlBody;
  MailApp.sendEmail(options);
}

function sendAdminNotification(config, data, formType) {
  try {
    var labels = {
      'join': 'Join the Community',
      'event-live-sourcing': 'Event — Live Sourcing Session',
      'cohort-application': 'Cohort Application — AI-Enabled Strategic Talent Advisor'
    };
    var formLabel = labels[formType] || formType;
    var lines = config.fields
      .filter(function (f) { return f !== 'JD File Link' || data[f]; })
      .map(function (f) { return f + ': ' + (data[f] || '—'); });

    var subject = 'New submission — ' + formLabel + ': ' + (data['Name'] || 'Unknown');
    var body =
      'New form submission on the website.\n\n' +
      'Form: ' + formLabel + '\n' +
      'Submitted: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '\n\n' +
      lines.join('\n');

    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: subject, body: body });
  } catch (err) {
    // A notification failure should never block the applicant submission.
  }
}

// ---- Helpers --------------------------------------------------------

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

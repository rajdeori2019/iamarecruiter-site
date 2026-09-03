/**
 * I AM A RECRUITER — Website form backend
 * ------------------------------------------------------------------
 * Deployed as a Web App bound to the community Google Sheet. Receives
 * POSTs from website forms, appends rows to the relevant tab, and sends
 * applicant + admin confirmation emails.
 */

var SPREADSHEET_ID = '1T5GUZqQlIPIL_cOgiBrhJtzkzL1u4H7hK6ZB5zsAP6I';
var WHATSAPP_LINK = 'https://chat.whatsapp.com/9lNsbSksZ9F34ojDJxWNC1';
var COHORT_WHATSAPP_LINK = 'https://wa.me/919742944825?text=' + encodeURIComponent('Hi Prafulla, I have submitted my application for the AI-Enabled Strategic Talent Advisor founding cohort.');
var PREMIUM_WHATSAPP_LINK = 'https://wa.me/919742944825?text=' + encodeURIComponent('Hi Prafulla, I have submitted my Premium 1:1 application for the Interview Conversion Intensive.');
var COMMUNITY_NAME = 'I AM A RECRUITER';
var LOGO_URL = 'https://www.iamarecruiter.in/assets/logo_trimmed.png';
var BRAND_ACCENT = '#E8A400';
var BRAND_INK = '#0E0E10';
var ADMIN_EMAIL = 'prafulladeori@gmail.com';

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
        '<a href="' + escapeHtmlForEmail(btn.url) + '" style="display:inline-block; ' + style + ' text-decoration:none; ' +
        'font-family:Arial,Helvetica,sans-serif; font-weight:bold; font-size:14px; letter-spacing:0.5px; ' +
        'padding:14px 28px; text-transform:uppercase; border-radius:2px;">' + escapeHtmlForEmail(btn.text) + '</a>' +
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

var FORM_CONFIGS = {
  'join': {
    sheetName: 'Master',
    fields: [
      'Name', 'Email ID', 'Phone - Mobile', 'Job Title',
      'Current Company / Organisation Name', 'Your Current Location', 'Your LinkedIn Profile URL'
    ],
    requiredFields: [
      'Name', 'Email ID', 'Phone - Mobile', 'Job Title',
      'Current Company / Organisation Name', 'Your Current Location', 'Your LinkedIn Profile URL'
    ],
    buildEmail: function (data) {
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'Welcome to ' + COMMUNITY_NAME + ' — so glad to have you here! You\'re now part of India\'s community for working recruiters.\n\n' +
        'Join the WhatsApp community here:\n' + WHATSAPP_LINK + '\n\n' +
        'Glad you\'re here,\nThe ' + COMMUNITY_NAME + ' Team';
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Welcome, ' + escapeHtmlForEmail(firstName) + '! 🎉</p>' +
        '<p style="margin:0 0 16px;">You\'re now part of ' + COMMUNITY_NAME + ' — India\'s community for working recruiters.</p>' +
        '<p style="margin:0;">Use the button below to join the WhatsApp community.</p>';
      return {
        subject: 'Welcome to ' + COMMUNITY_NAME + ', ' + firstName + '! 🎉',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [{ text: 'Join the WhatsApp Community', url: WHATSAPP_LINK }])
      };
    }
  },

  'event-live-sourcing': {
    sheetName: 'Event - Live Sourcing Demo',
    fields: [
      'Name', 'Email ID', 'Phone - Mobile', 'Job Title',
      'Current Company / Organisation Name', 'Your Current Location', 'Your LinkedIn Profile URL',
      'Will You Be Joining Live', 'Role You Want Sourced Live', 'JD File Link'
    ],
    requiredFields: [
      'Name', 'Email ID', 'Phone - Mobile', 'Job Title',
      'Current Company / Organisation Name', 'Your Current Location', 'Your LinkedIn Profile URL'
    ],
    buildEmail: function (data) {
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'You\'re registered for "Your hardest role, sourced live." — Friday, 11 Sept, 4:00–5:00 PM IST, on Zoom.\n\n' +
        'Join here on the day: https://luma.com/nl6gkeb2\n\n' +
        'See you Friday,\nPrafulla Deori, ' + COMMUNITY_NAME;
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">You\'re in, ' + escapeHtmlForEmail(firstName) + '. 🎉</p>' +
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
      'Name', 'Email ID', 'Phone - Mobile', 'Current Role', 'Current Company / Organisation Name',
      'Recruiting Experience', 'Main Capability Gap', 'Current Challenge', 'Source', 'UTM Source',
      'UTM Medium', 'UTM Campaign', 'Application Status', 'Follow-up Status', 'Payment Status',
      'Cohort Batch', 'Consent'
    ],
    requiredFields: [
      'Name', 'Email ID', 'Phone - Mobile', 'Current Role', 'Recruiting Experience',
      'Main Capability Gap', 'Current Challenge', 'Consent'
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
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Application received, ' + escapeHtmlForEmail(firstName) + '.</p>' +
        '<p style="margin:0 0 16px;">Your application for the <strong>AI-Enabled Strategic Talent Advisor</strong> founding cohort is now recorded.</p>' +
        '<p style="margin:0 0 16px;">We\'ll review your recruiting experience and the capability gap you shared. If the cohort is the right fit, you\'ll receive the payment and onboarding path.</p>' +
        '<p style="margin:0; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + '; font-size:13px; color:#55565C;"><strong>Batch 01:</strong> 19 Sep–24 Oct 2026 · Saturdays · 10:30 AM–12:30 PM IST · ₹10,000</p>';
      return {
        subject: 'We received your Strategic Talent Advisor Cohort application',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [{ text: 'Continue on WhatsApp', url: COHORT_WHATSAPP_LINK }])
      };
    }
  },

  'diagnostic': {
    sheetName: 'Diagnostic Leads',
    fields: [
      'Full Name', 'Email ID', 'Mobile', 'Current Role', 'Current Company', 'Recruiting Experience',
      'LinkedIn URL', 'Overall Score', 'Result Level', 'Talent Intelligence', 'Hiring Diagnosis',
      'Hiring Manager Advisory', 'Advanced Sourcing', 'Skills-Based Assessment', 'Recruiting Analytics',
      'AI Capability', 'AI Governance', 'Strongest Capability', 'Gap #1', 'Gap #2', 'Gap #3',
      'Cohort Fit', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'Landing URL',
      'Referrer', 'Lead Status', 'Free Session Status', 'Cohort Interest', 'Follow-up Status',
      'Follow-up Date', 'Last Contact Date', 'Next Action', 'Payment Status', 'Notes'
    ],
    requiredFields: [
      'Full Name', 'Email ID', 'Mobile', 'Current Role', 'Recruiting Experience', 'LinkedIn URL', 'Consent'
    ],
    defaults: {
      'Source': 'Website - Strategic Recruiter Diagnostic',
      'Lead Status': 'NEW',
      'Free Session Status': 'NOT INVITED',
      'Cohort Interest': 'UNKNOWN',
      'Follow-up Status': 'NOT STARTED',
      'Payment Status': 'UNPAID'
    },
    buildEmail: function (data) {
      var firstName = String(data['Full Name']).trim().split(/\s+/)[0];
      var score = data['Overall Score'] || '—';
      var level = data['Result Level'] || 'Strategic Recruiter profile';
      var gap1 = data['Gap #1'] || '—';
      var gap2 = data['Gap #2'] || '—';
      var gap3 = data['Gap #3'] || '—';
      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'You completed the Strategic Recruiter Readiness Diagnostic.\n\n' +
        'Your score: ' + score + '/100\n' +
        'Your current level: ' + level + '\n\n' +
        'Your top development priorities:\n' +
        '1. ' + gap1 + '\n2. ' + gap2 + '\n3. ' + gap3 + '\n\n' +
        'Your full capability breakdown is shown immediately on the diagnostic result page.\n\n' +
        'I AM A RECRUITER';
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Your Strategic Recruiter profile is ready, ' + escapeHtmlForEmail(firstName) + '.</p>' +
        '<p style="margin:0 0 16px;">You completed the <strong>Strategic Recruiter Readiness Diagnostic</strong>.</p>' +
        '<p style="margin:0 0 16px; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + ';"><strong>Score:</strong> ' + escapeHtmlForEmail(score) + '/100<br><strong>Current level:</strong> ' + escapeHtmlForEmail(level) + '</p>' +
        '<p style="margin:0 0 8px;"><strong>Your top development priorities</strong></p>' +
        '<ol style="margin:0 0 16px; padding-left:20px;"><li>' + escapeHtmlForEmail(gap1) + '</li><li>' + escapeHtmlForEmail(gap2) + '</li><li>' + escapeHtmlForEmail(gap3) + '</li></ol>' +
        '<p style="margin:0; color:#55565C; font-size:13px;">Your score is a self-assessment of current recruiting behaviour, not a professional certification or employment guarantee.</p>';
      return {
        subject: 'Your Strategic Recruiter Readiness result — ' + score + '/100',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [{
          text: 'Explore the Strategic Recruiter Cohort',
          url: 'https://www.iamarecruiter.in/cohort.html?utm_source=email&utm_medium=diagnostic_result&utm_campaign=cohort_launch_sep26'
        }])
      };
    }
  },

  'premium-application': {
    sheetName: 'Premium 1:1 Applications',
    fields: [
      'Name', 'Email ID', 'Phone - Mobile', 'LinkedIn URL', 'Current Role', 'Years Experience',
      'Target Role', 'Target Company', 'Interview Scheduled', 'Interview Date', 'Interview Stage',
      'Recent Interview Outcomes', 'Feedback Received', 'Main Difficulty', 'What Have You Tried',
      'Support Needed', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Application Status',
      'Fit Status', 'Payment Status', 'Recommended Package', 'Consent'
    ],
    requiredFields: [
      'Name', 'Email ID', 'Phone - Mobile', 'LinkedIn URL', 'Current Role', 'Years Experience',
      'Target Role', 'Interview Scheduled', 'Interview Stage', 'Recent Interview Outcomes',
      'Main Difficulty', 'What Have You Tried', 'Support Needed', 'Consent'
    ],
    defaults: {
      'Source': 'Website - Premium 1:1 Landing Page',
      'Application Status': 'NEW',
      'Fit Status': 'UNASSESSED',
      'Payment Status': 'UNPAID',
      'Recommended Package': 'UNASSIGNED'
    },
    buildEmail: function (data) {
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
      var roleLine = data['Target Role'] ? ('Target role: ' + data['Target Role'] + '.\n\n') : '';
      var plainBody =
        'Hi ' + firstName + ',\n\n' +
        'Your Premium 1:1 application has been received.\n\n' +
        roleLine +
        'Next step: Prafulla will review whether the problem you described is actually an interview-conversion problem and whether the Interview Conversion Intensive is the right intervention.\n\n' +
        'If there is fit, you will receive the exact scope, commercial terms, payment and onboarding path before committing.\n\n' +
        'Current Interview Conversion Intensive test price: ₹14,999.\n' +
        'This is interview preparation/coaching and does not guarantee an interview, offer, job or employer decision.\n\n' +
        'Continue on WhatsApp:\n' + PREMIUM_WHATSAPP_LINK + '\n\n' +
        'I AM A RECRUITER';
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Application received, ' + escapeHtmlForEmail(firstName) + '.</p>' +
        '<p style="margin:0 0 16px;">Your Premium 1:1 application is now recorded.</p>' +
        '<p style="margin:0 0 16px;">Prafulla will review your target role, interview stage and conversion pattern before recommending a next step.</p>' +
        '<p style="margin:0 0 16px; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + '; font-size:13px; color:#55565C;"><strong>Interview Conversion Intensive:</strong> current test price ₹14,999 · one role/company · role-specific 1:1 preparation.</p>' +
        '<p style="margin:0; color:#55565C; font-size:13px;">No interview, offer, job, promotion or salary outcome is guaranteed.</p>';
      return {
        subject: 'We received your Premium 1:1 application',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [{ text: 'Continue on WhatsApp', url: PREMIUM_WHATSAPP_LINK }])
      };
    }
  }
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'No data received.' });
    }
    var data = JSON.parse(e.postData.contents);
    var formType = data['Form Type'] || 'join';
    var config = FORM_CONFIGS[formType];
    if (!config) return jsonResponse({ status: 'error', message: 'Unknown form type: ' + formType });

    applyDefaults(config, data);

    var missing = config.requiredFields.filter(function (f) {
      return !data[f] || String(data[f]).trim() === '';
    });
    if (missing.length) return jsonResponse({ status: 'error', message: 'Missing fields: ' + missing.join(', ') });
    if (!isValidEmail(data['Email ID'])) return jsonResponse({ status: 'error', message: 'Invalid email address.' });
    if (formType === 'diagnostic' && !isValidLinkedInProfile(data['LinkedIn URL'])) {
      return jsonResponse({ status: 'error', message: 'A valid LinkedIn personal profile URL is required.' });
    }

    if (data['JD File Base64']) data['JD File Link'] = uploadJdFile(data);

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
    if (!data[field] || String(data[field]).trim() === '') data[field] = defaults[field];
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

function appendToSheet(config, data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) sheet = ss.insertSheet(config.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp'].concat(config.fields));
    sheet.setFrozenRows(1);
  }
  var row = [new Date()].concat(config.fields.map(function (f) { return data[f] || ''; }));
  sheet.appendRow(row);
}

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
      'cohort-application': 'Cohort Application — AI-Enabled Strategic Talent Advisor',
      'diagnostic': 'Strategic Recruiter Readiness Diagnostic',
      'premium-application': 'Premium 1:1 Application — Interview Conversion Intensive'
    };
    var formLabel = labels[formType] || formType;
    var submitterName = data['Name'] || data['Full Name'] || 'Unknown';
    var submittedAt = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    var subject = 'New submission — ' + formLabel + ': ' + submitterName;

    var visibleFields = config.fields.filter(function (f) {
      return f !== 'JD File Link' || data[f];
    });
    var lines = visibleFields.map(function (f) { return f + ': ' + (data[f] || '—'); });
    var body =
      'New form submission on the website.\n\n' +
      'Form: ' + formLabel + '\n' +
      'Submitted: ' + submittedAt + '\n\n' +
      lines.join('\n');

    var summaryHtml = '';
    if (formType === 'diagnostic') {
      summaryHtml =
        '<div style="margin:0 0 24px; padding:18px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + ';">' +
          '<div style="font-size:11px; text-transform:uppercase; letter-spacing:.7px; color:#77787D; margin-bottom:8px;">Readiness summary</div>' +
          '<div style="font-size:28px; font-weight:bold; line-height:1.1; margin-bottom:6px;">' + escapeHtmlForEmail(data['Overall Score'] || '—') + '/100</div>' +
          '<div style="margin-bottom:10px;"><strong>' + escapeHtmlForEmail(data['Result Level'] || '—') + '</strong></div>' +
          '<div style="font-size:13px; color:#55565C;">' +
            '<strong>Cohort fit:</strong> ' + escapeHtmlForEmail(data['Cohort Fit'] || '—') + '<br>' +
            '<strong>Strongest:</strong> ' + escapeHtmlForEmail(data['Strongest Capability'] || '—') + '<br>' +
            '<strong>Top gaps:</strong> ' + escapeHtmlForEmail([data['Gap #1'], data['Gap #2'], data['Gap #3']].filter(Boolean).join(' · ') || '—') +
          '</div>' +
        '</div>';
    }

    var rowsHtml = visibleFields.map(function (field) {
      var value = data[field] || '—';
      return '<tr>' +
        '<td style="width:42%; padding:10px 12px; border-bottom:1px solid #E7E4DA; vertical-align:top; color:#77787D; font-size:12px; font-weight:bold;">' + escapeHtmlForEmail(field) + '</td>' +
        '<td style="padding:10px 12px; border-bottom:1px solid #E7E4DA; vertical-align:top; color:' + BRAND_INK + '; font-size:13px; word-break:break-word;">' + adminValueHtml(field, value) + '</td>' +
      '</tr>';
    }).join('');

    var htmlInner =
      '<p style="margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:.8px; color:#77787D;">Website submission</p>' +
      '<p style="margin:0 0 18px; font-size:22px; line-height:1.25; font-weight:bold;">' + escapeHtmlForEmail(formLabel) + '</p>' +
      '<p style="margin:0 0 24px; color:#55565C; font-size:13px;"><strong>Submitted:</strong> ' + escapeHtmlForEmail(submittedAt) + '<br><strong>Lead:</strong> ' + escapeHtmlForEmail(submitterName) + '</p>' +
      summaryHtml +
      '<div style="font-size:11px; text-transform:uppercase; letter-spacing:.7px; color:#77787D; margin:0 0 8px;">Submission details</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #DAD7CC; border-collapse:collapse; margin:0 0 8px;">' + rowsHtml + '</table>';

    var buttons = [];
    var linkedIn = data['LinkedIn URL'] || data['Your LinkedIn Profile URL'];
    if (linkedIn && isValidLinkedInProfile(linkedIn)) {
      buttons.push({ text: 'Verify LinkedIn Profile', url: linkedIn });
    }
    buttons.push({ text: 'Open Lead Tracker', url: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit' });

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: body,
      htmlBody: wrapEmailHtml(htmlInner, buttons)
    });
  } catch (err) {
    // A notification failure should never block the applicant submission.
  }
}

function adminValueHtml(field, value) {
  var safe = escapeHtmlForEmail(value);
  var raw = String(value || '');
  if ((field === 'LinkedIn URL' || field === 'Your LinkedIn Profile URL' || field === 'Landing URL' || field === 'JD File Link') && /^https?:\/\//i.test(raw)) {
    return '<a href="' + escapeHtmlForEmail(raw) + '" style="color:#1A5FB4; text-decoration:underline;">' + safe + '</a>';
  }
  if (field === 'Email ID' && isValidEmail(raw)) {
    return '<a href="mailto:' + escapeHtmlForEmail(raw) + '" style="color:#1A5FB4; text-decoration:underline;">' + safe + '</a>';
  }
  if ((field === 'Mobile' || field === 'Phone - Mobile') && raw) {
    return '<a href="tel:' + escapeHtmlForEmail(raw) + '" style="color:#1A5FB4; text-decoration:underline;">' + safe + '</a>';
  }
  return safe;
}

function escapeHtmlForEmail(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
  });
}

function isValidLinkedInProfile(value) {
  try {
    var text = String(value || '').trim();
    if (!/^https?:\/\//i.test(text)) return false;
    var match = text.match(/^https?:\/\/([^\/]+)(\/[^?#]*)?/i);
    if (!match) return false;
    var host = String(match[1] || '').toLowerCase().replace(/^www\./, '');
    var path = String(match[2] || '').toLowerCase();
    return (host === 'linkedin.com' || /\.linkedin\.com$/.test(host)) && path.indexOf('/in/') === 0 && path.length > 4;
  } catch (err) {
    return false;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

# Strategic Recruiter Diagnostic — Apps Script backend patch

The website diagnostic posts to the existing Apps Script web-app URL with `Form Type = diagnostic`.

The live Apps Script project must recognize that form type before `/diagnostic.html` is merged to production.

## 1) Add this entry inside `FORM_CONFIGS`

Place this block after the existing `cohort-application` entry and before `premium-application`. Keep the separating comma.

```javascript
  'diagnostic': {
    sheetName: 'Diagnostic Leads',
    // Order matters: it matches the existing A:AM columns in Diagnostic Leads.
    // The sheet headers say Full Name / Email, while the backend intentionally
    // consumes Name / Email ID so the shared validation + email functions work.
    fields: [
      'Name',
      'Email ID',
      'Mobile',
      'Current Role',
      'Current Company',
      'Recruiting Experience',
      'LinkedIn URL',
      'Overall Score',
      'Result Level',
      'Talent Intelligence',
      'Hiring Diagnosis',
      'Hiring Manager Advisory',
      'Advanced Sourcing',
      'Skills-Based Assessment',
      'Recruiting Analytics',
      'AI Capability',
      'AI Governance',
      'Strongest Capability',
      'Gap #1',
      'Gap #2',
      'Gap #3',
      'Cohort Fit',
      'Source',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'UTM Content',
      'Landing URL',
      'Referrer',
      'Lead Status',
      'Free Session Status',
      'Cohort Interest',
      'Follow-up Status',
      'Follow-up Date',
      'Last Contact Date',
      'Next Action',
      'Payment Status',
      'Notes'
    ],
    requiredFields: [
      'Name',
      'Email ID',
      'Mobile',
      'Current Role',
      'Recruiting Experience',
      'Consent'
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
      var firstName = String(data['Name']).trim().split(/\s+/)[0];
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
        '1. ' + gap1 + '\n' +
        '2. ' + gap2 + '\n' +
        '3. ' + gap3 + '\n\n' +
        'Your full capability breakdown is shown immediately on the diagnostic result page.\n\n' +
        'I AM A RECRUITER';
      var htmlInner =
        '<p style="margin:0 0 16px; font-size:20px; font-weight:bold;">Your Strategic Recruiter profile is ready, ' + firstName + '.</p>' +
        '<p style="margin:0 0 16px;">You completed the <strong>Strategic Recruiter Readiness Diagnostic</strong>.</p>' +
        '<p style="margin:0 0 16px; padding:14px 16px; background:#F4F3EE; border-left:3px solid ' + BRAND_ACCENT + ';"><strong>Score:</strong> ' + score + '/100<br><strong>Current level:</strong> ' + level + '</p>' +
        '<p style="margin:0 0 8px;"><strong>Your top development priorities</strong></p>' +
        '<ol style="margin:0 0 16px; padding-left:20px;"><li>' + gap1 + '</li><li>' + gap2 + '</li><li>' + gap3 + '</li></ol>' +
        '<p style="margin:0; color:#55565C; font-size:13px;">Your score is a self-assessment of current recruiting behaviour, not a professional certification or employment guarantee.</p>';
      return {
        subject: 'Your Strategic Recruiter Readiness result — ' + score + '/100',
        body: plainBody,
        htmlBody: wrapEmailHtml(htmlInner, [
          { text: 'Explore the Strategic Recruiter Cohort', url: 'https://www.iamarecruiter.in/cohort.html?utm_source=email&utm_medium=diagnostic_result&utm_campaign=cohort_launch_sep26' }
        ])
      };
    }
  },
```

## 2) Add the admin label

Inside `sendAdminNotification`, add this item to the `labels` object:

```javascript
'diagnostic': 'Strategic Recruiter Readiness Diagnostic',
```

## 3) Deploy the Apps Script web app

After saving the live Apps Script project, create a **new web-app version** while keeping the same deployment URL and access settings used by the current website forms.

Do not merge the website feature branch until a test POST returns:

```json
{"status":"success"}
```

and a test row appears in `Diagnostic Leads`.

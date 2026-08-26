# Connecting the Join form to your Google Sheet

This has to be done from **your own Google account** (the one that owns the
Sheet) — I can't deploy Apps Script on your behalf. It takes about 5 minutes.

## 1. Open the script editor

1. Open your Google Sheet:
   `https://docs.google.com/spreadsheets/d/1T5GUZqQlIPIL_cOgiBrhJtzkzL1u4H7hK6ZB5zsAP6I/edit`
2. Make sure a tab named exactly **Master** exists (create it if it doesn't —
   the script will also auto-create it and write the header row on first
   submission if it's missing).
3. Go to **Extensions → Apps Script**. This opens a new tab with a blank
   script editor bound to this Sheet.

## 2. Paste the code

1. Delete any placeholder code in the editor (the default `myFunction() {}`).
2. Copy everything from **`Code.gs`** in this folder and paste it in.
3. Click the save icon (or `Ctrl+S` / `Cmd+S`). Name the project something
   like "Join Form Backend" when prompted.

## 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `Join form v1`
   - **Execute as**: **Me** (your account) — this is what lets the script
     write to the Sheet and send email as you.
   - **Who has access**: **Anyone** — the form is public, so anyone
     submitting it needs to be able to reach this endpoint. (This does NOT
     make your Sheet public — it only allows this specific script function
     to run.)
4. Click **Deploy**.
5. The first time, Google will ask you to **authorize** the script — click
   through the consent screen (you'll see an "unverified app" warning
   because it's your own personal script; click **Advanced → Go to Join
   Form Backend (unsafe)** → **Allow**. This is expected and safe — it's
   your own script.)
6. Copy the **Web app URL** shown after deployment. It looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Wire it into the website

Send me that URL (or drop it in yourself) — it goes into **one line** in
`public/join.html`:

```js
var APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

Replace the placeholder with the URL from step 3.6, save, and redeploy the
site. That's it — submissions will start appending to the **Master** tab
and sending the welcome email.

## 5. Test it

1. Open the deployed join page and submit the form with your own details.
2. Check the **Master** tab — a new row should appear within a few seconds.
3. Check your inbox for the welcome email.

## Updating the script later

If you ever edit `Code.gs` (e.g. to change the email copy), you need to
**Deploy → Manage deployments → edit (pencil icon) → New version → Deploy**
for the change to go live — saving alone does not update the live Web App.

## Notes

- The script sends email via `MailApp`, which uses your own Google
  account's daily sending quota (2,000 emails/day on Workspace, 100/day on
  a free @gmail.com account as of this writing — worth checking Google's
  current quota page if the community grows past that).
- If you ever want to rotate/replace the Web App URL, redeploy as a new
  version (not a new deployment) so the existing URL keeps working — or
  create a new deployment and update the URL in `join.html` to match.

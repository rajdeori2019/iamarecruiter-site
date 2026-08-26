# Deploying this site to Railway (no GitHub needed)

This zip is the whole site: Home, Join (form), and the Cohort page, plus the
Google Apps Script backend for the Join form. You don't need a GitHub repo —
Railway's own CLI can deploy this folder directly.

## 1. Unzip it somewhere on your computer

Unzip `iamarecruiter-site.zip` into its own folder, e.g. `iamarecruiter-site/`.

## 2. Install the Railway CLI (one-time)

- **Mac/Linux**: `curl -fsSL https://railway.app/install.sh | sh`
- **Windows (PowerShell)**: `irm https://railway.app/install.ps1 | iex`
- Or via npm (any OS, if you have Node installed): `npm i -g @railway/cli`

## 3. Log in and deploy

Open a terminal **inside the unzipped folder** and run:

```
railway login
```

This opens a browser to sign into your Railway account (the one already
connected: prafulladeori@gmail.com, workspace "Prafulla Deori").

Then link this folder to a new Railway project:

```
railway init
```

Give it a name when prompted, e.g. `i-am-a-recruiter`.

Then deploy:

```
railway up
```

This uploads the folder as-is and builds/runs it — Railway detects
`package.json`, runs `npm install`, and starts it with `npm start`
(`node server.js`). No GitHub involved.

## 4. Get a public URL

```
railway domain
```

This generates a free `*.up.railway.app` domain and prints it. Open it —
you should see the Home page. A custom domain (e.g. `iamarecruiter.in`) can
be attached later from the Railway dashboard under the service's Settings →
Domains.

## 5. Connect the Join form to your Google Sheet

The site works, but the Join form won't actually save submissions until you
deploy the Google Apps Script backend and paste its URL in. Full steps are
in **`apps-script/README.md`** — takes about 5 minutes, done from your own
Google account. In short:

1. Open the Sheet → Extensions → Apps Script.
2. Paste in `apps-script/Code.gs`.
3. Deploy → New deployment → Web app → Execute as **Me** → Who has access
   **Anyone**.
4. Copy the Web app URL it gives you.
5. Open `public/join.html`, find this line near the top of the `<script>`
   block:
   ```js
   var APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
   and replace the placeholder with the URL you copied.
6. Redeploy: `railway up` again from the same folder.

Until step 5 is done, the form will show "Form isn't connected yet" instead
of submitting — that's expected, not a bug.

## Updating the site later

Whenever you change any file, redeploy with:

```
railway up
```

run from inside the project folder. No GitHub, no pull requests — it just
re-uploads and rebuilds.

## If you'd rather connect GitHub later

If you ever create a GitHub repo for this project and want Railway to
auto-deploy on every push instead of running `railway up` by hand, you can
connect it from the Railway dashboard: open the service → Settings →
Source → Connect Repo. That's entirely optional — `railway up` works fine
on its own.

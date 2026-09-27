# CareerLens College Mailer

A standalone internal tool for preparing and sending one personalized CareerLens India college outreach email at a time.

## Features

- Four branded templates: Professional, Modern Visual, Clean Minimal, and Newsletter
- Personalization for the recipient, college, department, and session interest
- Desktop and mobile preview
- Test email
- Real email sending
- SMTP provider abstraction
- Draft persistence in this browser
- Validation
- Confirmation before a real send

## Architecture

```text
React/Vite
    ↓
Express API
    ↓
Email Service
    ↓
SMTP Provider
```

```text
src/            Frontend, shared templates, and personalization
server/         Validation, email service, and SMTP provider
public/assets/  CareerLens logo, icon, and banner
dist/           Production frontend build
```

Preview and sending use the same `renderEmailHtml()` templates. The preview loads `/assets/...` from the app. A sent message rewrites those images to `CAREERLENS_ASSET_BASE_URL`.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the server values. Do not commit `.env`.

**SMTP credentials are server-side only.** Never put them in a `VITE_` variable.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `PORT` | Server | API port. Default `5000`. |
| `EMAIL_PROVIDER` | Server | Provider id. `smtp` is implemented. |
| `FROM_EMAIL` | Server | Address recipients see as the sender. |
| `FROM_NAME` | Server | Sender name. Default `CareerLens India`. |
| `SMTP_HOST` | Server | SMTP server hostname. |
| `SMTP_PORT` | Server | SMTP port. Default `587`. |
| `SMTP_SECURE` | Server | `true` for implicit TLS, usually port 465. `false` for STARTTLS on 587. |
| `SMTP_USER` | Server | SMTP username, when the server requires authentication. |
| `SMTP_PASSWORD` | Server | SMTP password. Server-side only. |
| `CAREERLENS_WEBSITE` | Server | Website link in the sent email. Defaults to `https://www.career-lens.in/`. |
| `CAREERLENS_CAMPUS_IMPACT` | Server | Campus impact link. Defaults to `https://www.career-lens.in/campus-impact`. |
| `CAREERLENS_ASSET_BASE_URL` | Server | Public HTTPS origin that serves `/assets`. Required before a real send. |
| `FRONTEND_ORIGIN` | Server | Browser origins allowed by CORS. Comma-separated. Production uses only this list. |
| `TRUST_PROXY` | Server | `true` only behind one trusted reverse proxy, so the rate limit sees the client address. Leave `false` otherwise. |
| `VITE_API_BASE_URL` | Frontend | Public API origin baked into the frontend build. Leave empty when the UI and API share an origin. |

## Public assets

Email clients cannot load `/assets/careerlens-logo.png` from the sender’s computer, and a message must not contain a filesystem path or `localhost`.

`CAREERLENS_ASSET_BASE_URL` must be a publicly accessible HTTPS origin that serves the files in `public/assets`, for example `https://mailer.career-lens.in`. A trailing slash is optional. Both of these produce the same image URL:

```text
https://mailer.career-lens.in/assets/careerlens-logo.png
https://mailer.career-lens.in/assets/careerlens-banner.jpg
```

If the variable is missing, local, or not HTTPS, sending stops and nothing is handed to SMTP. Preview still works.

The API serves `/assets/*` from `public/assets`. After `npm run build`, a production start also serves the built UI from `dist/`.

## Development

```bash
npm run dev
```

That starts Vite at `http://localhost:5173` and the API at `http://localhost:5000`. Vite proxies `/api` and `/health` to the API, so `VITE_API_BASE_URL` can stay empty.

Separate processes:

```bash
npm run dev:client
npm run dev:server
```

Other commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Tests mock the mail provider and do not send real email.

To send a test from the app, fill `.env`, set the public asset URL, run `npm run dev`, complete the form, open **Preview Email**, choose **Send Test Email**, confirm the address, and send. The subject starts with `[TEST] `.

## Production

```text
Public HTTPS frontend
        ↓
Public HTTPS API
        ↓
SMTP provider
```

```bash
npm install
npm run build
```

Set `NODE_ENV=production`, the SMTP variables, `CAREERLENS_ASSET_BASE_URL`, and `FRONTEND_ORIGIN` to the public site origin. Then:

```bash
npm start
```

`npm start` runs the API. When `NODE_ENV=production` and `dist/index.html` exists, the same process also serves the built frontend. For a split deployment, host `dist/` yourself and set `VITE_API_BASE_URL` to the public API origin **before** `npm run build`.

No hosting provider is assumed. Put the app behind HTTPS. Set `TRUST_PROXY=true` only when a reverse proxy you control is the single hop in front of the API.

## Current limitations

- One manual send at a time. A comma-separated list is delivered as separate private emails, not one shared To line
- Custom Email is a plain-text message with optional CareerLens branding, not a fifth fixed design
- No database. The daily passcode session lives in memory on this server process
- Sign-in is today's date in India, entered as DDMMYYYY. The server checks it and sets an HTTP-only session cookie
- No CRM
- No bulk campaigns
- No scheduling
- No analytics
- No tracking

Drafts stay in this browser only. **Send Another Email** clears the recipient, college, and department and keeps the last selected template.

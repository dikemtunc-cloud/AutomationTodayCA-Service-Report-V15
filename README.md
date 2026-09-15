# AutomationTodayCA Service Report — V15 FIXED

## GitHub Pages frontend
Upload these files to the repository root:
- `index.html`
- `app.js`
- `style.css`
- `atd-logo.png`

## Google Apps Script backend
The deployable backend is:
- `backend/Code.gs`

Deploy as a Web App:
- Execute as: **Me**
- Who has access: **Anyone**

Keep the existing `/exec` URL when possible.

## Script Properties
Configure these values in Apps Script → Project Settings → Script Properties:
- `COMPANY_EMAIL`
- `ALLOWED_GOOGLE_EMAIL`
- `GOOGLE_CLIENT_ID`
- `ATD_SECRET`

Never put `ATD_SECRET` or any OAuth client secret in GitHub/frontend code.

## V15 FIXED highlights
- Server-side Google ID-token verification.
- Authorized-account enforcement.
- Server-reserved Service Report Number.
- Reservation validation before finalization.
- Report numbers are finalized only after successful delivery.
- Long-lived application authorization proof/session handling.
- Google Drive PDF storage.
- Customer + company email delivery.
- Public QR verification endpoint.

## Important
The frontend `app.js` is configured for the AutomationTodayCA Apps Script `/exec` endpoint. If the deployment URL changes, update `DELIVERY_CONFIG.webAppUrl` in `app.js`.

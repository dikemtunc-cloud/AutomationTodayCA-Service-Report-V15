# AutomationTodayCA Service Report — QR Verification

## GitHub Pages files
Keep these files in the repository root:
- `index.html`
- `app.js`
- `style.css`
- `atd-logo.png`
- `verification.html`

GitHub Pages should publish the repository root.

## Google Apps Script backend
The backend is in:
- `backend/Code.gs`

Deploy the Apps Script as a Web App:
- Execute as: **Me**
- Who has access: **Anyone**

Keep the existing `/exec` deployment URL if possible. The frontend and verification page are already configured for the current endpoint.

## Script Properties
The backend expects these values in Apps Script → Project Settings → Script Properties:
- `COMPANY_EMAIL`
- `ALLOWED_GOOGLE_EMAIL`
- `GOOGLE_CLIENT_ID`
- `ATD_SECRET`

Do not put `ATD_SECRET` or other private credentials in frontend files.

## QR flow
1. Authorized user signs in.
2. Service Report number appears when the form opens.
3. User completes the form.
4. User submits and confirms the report.
5. A random verification token is generated.
6. The authenticated backend stores the limited public verification data.
7. The final PDF contains the QR code.
8. Scanning the QR opens `verification.html?token=...`.
9. The verification page retrieves the public verification record from Apps Script.

## Public verification fields
The QR verification page shows:
- Service Report No.
- Company
- Contact Person
- Service Date
- Technician
- Service Type
- Start Time
- End Time
- Customer Work Order
- Equipment / Machine
- Manufacturer
- Model
- Serial Number
- Service Result
- Verification date/time

It does not expose customer email, phone, address, PO number, technician notes, customer comments, signature, or Google authentication information.

## Important
The existing Google authentication flow is intentionally preserved. Review changes carefully before deploying a new Apps Script version.

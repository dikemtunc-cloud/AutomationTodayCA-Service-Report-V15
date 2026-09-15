# AutomationTodayCA Service Report — V15

## V15 changes
- Keeps the V14 frontend/backend authentication architecture unchanged.
- Google Client ID and server-side authorization remain in the same locations.
- Service Report numbers are now reserved by Apps Script, not localStorage.
- Format: `ATD-SR-YYYY-MMDD-####-XXXXXX` (date + global sequence + unique suffix).
- Sequence starts from 52, so the next successful reservation is 53.
- `LockService` prevents two users from receiving the same sequence number.
- A report number cannot be saved twice to the official Drive archive.
- Each report gets a dynamic QR code. The QR opens the Apps Script verification page.
- Verification checks whether the exact report-number PDF exists in the official Drive archive.
- QR is shown in the form header and embedded in the customer PDF.

## Files
- `index.html`
- `app.js`
- `style.css`
- `atd-logo.png`
- `Code.gs`

## Deployment
1. Upload the five frontend files to the V15 GitHub Pages repository.
2. Deploy the supplied `Code.gs` as a new Apps Script version.
3. Keep the existing Script Properties, especially `ALLOWED_GOOGLE_EMAIL`, `COMPANY_EMAIL`, `GOOGLE_CLIENT_ID`, and `ATD_SECRET`.
4. The frontend is already pointed to the current `/exec` URL supplied for this V15 deployment.
5. Test with the authorized Google account first. Then test an unauthorized account.
6. Create a report and confirm that the report number, QR, Drive PDF, email delivery, and QR verification all work.

## Security
Do not move `ATD_SECRET`, `ALLOWED_GOOGLE_EMAIL`, or `COMPANY_EMAIL` into GitHub/frontend code. The Google Client ID is public configuration.

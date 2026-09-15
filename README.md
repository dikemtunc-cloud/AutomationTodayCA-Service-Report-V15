# AutomationTodayCA Service Report V15

## V15 additions
- Backend-issued global Service Report sequence using Apps Script LockService.
- Format: `ATD-SR-YYYY-MMDD-####-XXXXXX` (example: `ATD-SR-2026-0915-0053-A1B2C3`).
- QR code in the generated customer PDF points to the Apps Script verification endpoint.
- Public verification page confirms whether the exact report PDF exists in the official Drive archive.
- Dynamic customer email and phone rows, start/end service time, and existing form status highlighting retained.

## Deployment
1. Deploy Code.gs as a new Google Apps Script Web App.
2. Execute as: Me.
3. Who has access: Anyone.
4. Keep the existing Script Properties: `ALLOWED_GOOGLE_EMAIL`, `COMPANY_EMAIL`, `GOOGLE_CLIENT_ID`, `ATD_SECRET`.
5. In `app.js`, update only `DELIVERY_CONFIG.webAppUrl` to the new `/exec` URL.
6. Do not place any secret in GitHub.

## Sequence
The initial V15 sequence fallback is 52, so the first new reservation becomes 0053. After deployment, `ATD_REPORT_SEQUENCE` is stored in Script Properties and protected by LockService.

## Verification
The QR URL is generated from the same Apps Script Web App URL used for authentication/delivery. Update `webAppUrl` after creating the new deployment.

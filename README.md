# Yetipsy Ambassador V1

GitHub Pages + Google Apps Script + Google Sheets MVP.

## Current V1 flow

1. Ambassador logs in and issues an Individual or Group Guest Pass QR.
2. Customer has no account / customer portal; they only receive the QR image.
3. Staff scans the QR.
4. Staff can record actual arrival data, including a different pax / male / female split from the ambassador's original plan.
5. Group passes support repeated Partial Redeem / Check-in. Planned pax is not a hard limit.
6. Staff enters final sales at checkout.
7. Only checkout creates Sales and credits Commission into the Ambassador Wallet.
8. A checkout can be partial or final. Final checkout closes the pass.

## Google Sheets / Apps Script setup

1. Create a new Google Sheet.
2. Extensions -> Apps Script.
3. Paste `Code.gs` into the script project.
4. Run `setupSheets()` once.
5. Run `seedDemoUsers()` once.
6. Deploy -> New deployment -> Web app.
   - Execute as: Me
   - Who has access: Anyone
7. Copy the Web App URL.
8. Put that URL into `config.js`.
9. Push the frontend files to GitHub Pages.

## Demo logins

After `seedDemoUsers()`:

- Admin: `owner` / `ChangeMe123!`
- Staff: `staff1` / `ChangeMe123!`

Change these immediately before production use.

## Create the first Ambassador

Login as Admin and use the Create Ambassador form.

## Notes before production

- Treat this as an MVP. Add rate limiting, stronger session invalidation, payout workflows, void/reversal tools, and backup procedures before relying on it for real money at scale.
- Google Sheets is acceptable for a small venue MVP, but simultaneous writes are protected only with Apps Script locks and will not scale like a real database.
- Commission is calculated on the Apps Script backend. The frontend never submits the commission amount.
- Wallet is transaction-based; each confirmed checkout writes a commission transaction.

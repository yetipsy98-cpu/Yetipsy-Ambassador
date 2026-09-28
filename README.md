# Yetipsy Ambassador System — Production V1

GitHub Pages frontend + Google Apps Script API + Google Sheets database.

## Final business flow

1. Ambassador logs in and creates a reservation/pass.
2. Reservation Date and Pax are mandatory. Ambassador does **not** enter male/female.
3. Ambassador shares the QR directly with the customer. There is no customer portal.
4. Before any Staff Check-in, Ambassador can edit Date, Pax, Type, Label and Remark.
5. Once Staff starts Check-in / Partial Redeem, the Ambassador reservation becomes locked.
6. Staff scans the QR and records the **actual** arriving Pax, Male and Female. Repeated Partial Redeem is supported and actual pax can be higher or lower than the original reservation.
7. Admin configures a different `Price / Pax` for each date in the Daily Price calendar.
8. Staff automatically sees the price matching the reservation date. Amount is calculated as `Actual Pax × Daily Price`.
9. Checkout only charges the unpaid difference. Example: 4 pax paid first, 2 more arrive later, the next checkout only charges the additional 2 pax.
10. Only a confirmed Checkout writes Sales and credits Commission into the Ambassador Wallet.

## Google Sheets setup / migration

1. Create or open the Google Sheet used by the system.
2. Extensions → Apps Script.
3. Replace the project code with `Code.gs`.
4. Run `setupSheets()` once. It will create missing sheets and append missing columns to an older V1 sheet.
5. If this is a new installation, run `seedDemoUsers()` once.
6. Deploy → Manage deployments → edit/new Web App deployment.
   - Execute as: Me
   - Who has access: Anyone
7. Copy the deployed Web App URL to `config.js`.
8. Upload the frontend files to GitHub Pages.

## Initial test accounts

Only when `seedDemoUsers()` is run:

- Admin: `owner` / `ChangeMe123!`
- Staff: `staff1` / `ChangeMe123!`

Change test passwords before real operation.

## Sheets

- `Users` — Admin / Staff / Ambassador users and commission rate
- `QR_Passes` — reservation/pass, planned pax, actual pax and sales
- `Checkins` — each Partial Redeem / actual arrival batch
- `Redeem_Log` — confirmed payment / sales records
- `Wallet` — immutable commission transaction history
- `Daily_Pricing` — per-date price per pax
- `Sessions` — login sessions
- `Audit_Log` — important actions

## Important rules enforced by backend

- Price and commission are never accepted from the browser as authoritative values.
- Daily price is read again by Apps Script during Checkout.
- Commission is calculated by Apps Script using the Ambassador's stored commission rate.
- Ambassador edits are blocked after Staff begins Check-in.
- Male + Female must equal the actual check-in pax for each Partial Redeem.
- A checkout cannot happen until actual pax exists and a price has been set for that reservation date.
- Repeated check-ins and repeated checkout are supported; only the unpaid amount is charged each time.

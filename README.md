# Yetipsy Ambassador System — V1.2

## Latest logic
- Ambassador: date + pax required; no gender input
- Staff: scan QR and pass info loads automatically
- If QR fails, Staff can search by Ref printed on invitation
- Staff enters Male + Female; Pax auto-sums
- Partial Redeem supported
- Price is split by gender
  - Normal Day Male / Female (Sun–Thu)
  - Weekend Male / Female (Fri–Sat)
  - Special Date Male / Female override
- Checkout calculates uncharged gender counts only
- Commission enters Ambassador wallet only after confirmed payment
- Ambassador reservation can be edited only before first Staff check-in
- Invitation image includes QR + date + Ref

## Install / upgrade
1. Replace Apps Script code with `Code.gs`
2. Run `setupSheets()` once — it appends any missing columns for V1.2
3. Redeploy the Apps Script Web App
4. Replace GitHub Pages frontend files with this package
5. Keep your existing `config.js` GAS URL, or paste the deployed URL again

## Demo accounts
If you run `seedDemoUsers()`:
- Admin: `owner / ChangeMe123!`
- Staff: `staff1 / ChangeMe123!`

Change demo passwords before real operation.

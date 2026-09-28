# Yetipsy Ambassador System — Complete Version

## Included features
- Ambassador creates pass with **date + pax mandatory**
- Ambassador does **not** fill male / female
- Staff records **actual** pax + male + female
- Group QR supports **partial redeem**
- Commission enters wallet **only after checkout/payment**
- Price logic:
  - **Normal Day default** = Sunday to Thursday
  - **Weekend default** = Friday and Saturday
  - **Special date override** takes priority over defaults
- Invitation image for customer:
  - uses `assets/invitation-template.png`
  - auto inserts **QR + Date + Ref**
  - if QR fails, Staff can manually search by **Ref**

## Files
- `index.html` — login
- `ambassador.html` — Ambassador dashboard + pass issue + invitation preview/download
- `staff.html` — Staff scan / partial redeem / checkout
- `admin.html` — Admin pricing defaults + date override + create ambassador + dashboard
- `app.js` — shared frontend helpers
- `styles.css` — styles
- `config.js` — put your Apps Script Web App URL here
- `Code.gs` — Google Apps Script backend
- `assets/invitation-template.png` — invitation background template

## Install steps
1. Create a Google Sheet
2. Open **Extensions → Apps Script**
3. Paste `Code.gs`
4. Run `setupSheets()` once
5. Run `seedDemoUsers()` once if you want the demo accounts
6. Deploy Apps Script as Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the Web App URL into `config.js`
8. Upload the frontend files to GitHub Pages

## Demo accounts
Only if you ran `seedDemoUsers()`:
- Admin: `owner / ChangeMe123!`
- Staff: `staff1 / ChangeMe123!`

## Notes
- Change demo passwords before real use
- Staff can manually type **Pass Ref** if QR cannot be scanned
- Ambassador reservations can be edited **only before first check-in**
- Frontend never decides the final commission or price; backend recalculates it

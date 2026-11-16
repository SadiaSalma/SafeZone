# SafeZone Simple

Verified theft reports, area alerts, a safety map and GD copy OCR for Dhaka.
GD copies (photo or PDF) are read in the victim's browser and never uploaded or stored:
only the GD number, date and thana that were read are saved with the report.
Plain HTML + Bootstrap 5 pages, a small Node.js + Express backend, MongoDB with Mongoose.
The full plan is `docs/SafeZone_Simple_Plan.pdf` in the main project.

## Run it

You need Node.js 22 or newer and a MongoDB database (a free MongoDB Atlas cluster, see plan section 12).

1. Install the packages:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill it in:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/safezone
   SESSION_SECRET=any-long-random-text
   ADMIN_PHONE=01XXXXXXXXX
   ADMIN_PASSWORD=a-password-for-the-first-admin
   ```
   Never put `.env` on GitHub. It is already in `.gitignore`.
3. Load the 49 thanas and make the first admin (safe to run again):
   ```
   npm run seed
   ```
4. Start the server and open http://localhost:3000:
   ```
   npm start
   ```

Log in with ADMIN_PHONE and ADMIN_PASSWORD, then add verifiers on the Admin page.

## Files

```
server.js            starts Express and plugs in the routes
database.js          connects to MongoDB
seed.js              loads the thanas and the first admin
checks.js            the four automatic checks on each report
theftTypes.js        the theft types (the pages have the same list in public/js/common.js)
models/              one file per collection: User, Thana, Report, Alert
middleware/auth.js   mustBeLoggedIn, mustBeStaff, mustBeAdmin
routes/auth.js       sign up, log in, log out, who am I
routes/reports.js    send a report, my reports
routes/review.js     the verifier's queue, approve, reject
routes/public.js     thanas, alerts, map points, area numbers
routes/admin.js      staff, all reports, thana addresses
data/thanas.json     the 49 DMP thanas
public/              the pages, css/style.css and one script per page in js/
```

Every page loads Bootstrap, `css/style.css`, `js/common.js` (talking to the server, showing errors,
dates, the theft types), `js/navbar.js` (the top bar) and its own script.

## Follow one report

1. **public/report.html + js/report.js**: the victim fills the form. If they add a photo or PDF of
   the GD copy, `js/ocr.js` reads it in the browser and fills in the GD number, date and thana.
   The copy is never uploaded: the form is sent with `postJSON()`, together with what OCR read.
2. **routes/reports.js**: `POST /api/reports` checks the input, runs the four checks in `checks.js`
   and saves a Report with status `waiting`. `readFromGdCopy` keeps what OCR read.
3. **public/review.html + js/review.js**: the verifier opens the report and sees what was read from
   the GD copy next to what is in the form (Same / Different), the four checks and the exact place.
4. **routes/review.js**: `POST /api/review/:id/approve` sets status `approved`, moves the point
   about 150 m into `publicPlace`, and creates an Alert.
5. **routes/public.js**: `GET /api/alerts` and `GET /api/map` send only approved data, with no names
   and no GD numbers.
6. **index.html, map.html, area.html**: everyone sees the alert, the point on the map and the area numbers.

## Addresses (API)

Errors always look like `{ "error": "A sentence a person understands." }`.

| Method and address | Who | Sent | Answer |
|---|---|---|---|
| GET /api/me | everyone | | `{ user }`, or `{ user: null }` |
| POST /api/register | everyone | `{ name, phone, password }` | `{ user }`, and logged in |
| POST /api/login | everyone | `{ phone, password }` | `{ user }` |
| POST /api/logout | everyone | | `{ ok: true }` |
| GET /api/thanas | everyone | | the 49 thanas, A to Z |
| GET /api/alerts?thana=ID | everyone | | the latest 30 alerts |
| GET /api/map?days=30&type=KEY | everyone | | approved thefts with `publicPlace` only |
| GET /api/areas/:id | everyone | | `{ thana, total, byType, byHour, alerts }` |
| POST /api/reports | logged in | `{ gdNumber, gdDate, thana, theftType, happenedAt, description, lat, lng, readFromGdCopy }` | `{ _id }` |
| GET /api/my-reports | logged in | | your reports |
| GET /api/review | verifier | | waiting reports with `checks` |
| POST /api/review/:id/approve | verifier | `{ note }` | `{ ok: true }` |
| POST /api/review/:id/reject | verifier | `{ note }` (needed) | `{ ok: true }` |
| GET, POST /api/admin/staff | admin | `{ name, phone, password }` | staff list / `{ ok: true }` |
| GET /api/admin/reports | admin | | every report |
| PUT /api/admin/thanas/:id | admin | `{ address, phone }` | the thana |

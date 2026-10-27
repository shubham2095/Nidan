# NIDAN Mother & Child Clinic - Website + Clinic CRM

Full-stack replacement for <https://nidanmotherandchildcare.com/>: a public website with real online appointment
booking, and a CRM / admin panel for doctors and reception staff. One Node.js app: Express serves the API
(`/api/...`) and, in production, the built React site.

**Stack:** React 18 + Vite + Tailwind CSS · Express 5 · MySQL/MariaDB via Sequelize · JWT in an httpOnly cookie.

## Build status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffold, DB config, migrations, seeders, auth | Done |
| 2 | Public website pages | Done |
| 3 | Booking engine (slots, double-booking protection, emails) | Done |
| 4 | CRM: dashboard, appointments, patients, leads, follow-ups | Done |
| 5 | Vaccination tracker, doctors and timetables, content management, settings, users, activity log | Done |
| 6 | SEO, security hardening, performance, deployment guide | Done |

Jump to: [local setup](#local-setup-on-windows-with-xampp) · [deploying to Hostinger](#deploying-to-hostinger) ·
[moving the database with phpMyAdmin](#moving-the-database-with-phpmyadmin) ·
[everyday tasks in the admin panel](#everyday-tasks-in-the-admin-panel) · [launch checklist](#launch-checklist) ·
[assumptions](#assumptions)

---

## Local setup on Windows with XAMPP

1. **Start MySQL.** Open the XAMPP Control Panel and click **Start** next to **MySQL** (Apache is only needed if you
   want phpMyAdmin).
2. **Create the database** (either way works):
   - phpMyAdmin (<http://localhost/phpmyadmin>) → **New** → name `nidan_crm`, collation `utf8mb4_unicode_ci`, or
   - after step 4, run `npm run db:create`.
3. **Copy the environment file:**
   ```bash
   copy .env.example .env
   ```
   Then edit `.env`: set `JWT_SECRET` to a long random string, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for your first login.
   The XAMPP database defaults (`root`, empty password, `127.0.0.1:3306`, `nidan_crm`) are already in the example file.
   Generate a secret with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. **Install dependencies** (installs both the root and `client/` packages):
   ```bash
   npm install
   npm install --prefix client
   ```
5. **Create tables and seed data:**
   ```bash
   npm run db:create
   npm run db:migrate
   npm run db:seed
   ```
6. **Run everything:**
   ```bash
   npm run dev
   ```
   - Website (Vite): <http://localhost:5173>
   - API: <http://localhost:5000/api/health>

Tables are created **only by migrations**: never by hand and never with `sequelize.sync()`.

### Default admin login

The first super admin is created by `npm run db:seed` from your `.env`:

- Email: the value of `ADMIN_EMAIL`
- Password: the value of `ADMIN_PASSWORD`

Seeding never overwrites an existing user, so changing these values later does not change an account that already
exists. Change the password from the admin panel (or with the forgot-password flow) instead.

### Useful scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | API (nodemon) + Vite together |
| `npm run build` | Installs client deps and builds `client/dist` (what Hostinger runs) |
| `npm start` | Production server: API + built site |
| `npm run db:create` | Creates the database if it does not exist |
| `npm run db:migrate` | Runs pending migrations |
| `npm run db:seed` | Runs pending seeders (safe to re-run: existing rows are never overwritten) |
| `npm run db:reset` | **Drops all tables**, then migrates and seeds again. Blocked when `NODE_ENV=production` |

### Common XAMPP issues

- **MySQL will not start / "port 3306 already in use".** Another MySQL (or a previous XAMPP run) is using the port.
  Stop the other service in `services.msc`, or change the port in XAMPP (**Config → my.ini → `port=3307`**) and set
  `DB_PORT=3307` in `.env`.
- **`ECONNREFUSED 127.0.0.1:3306`.** MySQL is not running. Start it in the XAMPP Control Panel.
- **`Access denied for user 'root'`.** You set a root password in XAMPP. Put it in `DB_PASSWORD` in `.env`.
- **`Unknown database 'nidan_crm'`.** Run `npm run db:create` or create it in phpMyAdmin.
- **XAMPP ships MariaDB, not MySQL.** That is fine: migrations avoid features that differ between the two.
- **Vite starts on 5174 instead of 5173.** Something else is using 5173. Stop it, or update `CLIENT_URL` in `.env`.

---

## Folder structure

```
.
├── client/                  React app (Vite)
│   ├── public/              Static files: favicon.png, apple-touch-icon.png, images/ (the logo, the two doctor
│   │                        photos, gallery/ and services/ pictures from the old website; replace a file, keeping its
│   │                        name, to change it)
│   ├── src/
│   │   ├── components/      Shared UI (public/ for the website, admin/ for the CRM)
│   │   ├── context/         SiteContext (public site data); AuthContext + ToastContext (CRM)
│   │   ├── hooks/           useFetch (data loading with cancel + retry)
│   │   ├── layouts/         PublicLayout: header, footer, floating call/WhatsApp
│   │   ├── pages/           public/ and admin/ pages
│   │   ├── services/        axios instance + API calls
│   │   ├── utils/           formatting, schedule grouping, form schemas, JSON-LD
│   │   ├── App.jsx, main.jsx
│   └── vite.config.js       Dev proxy: /api and /uploads -> the API server
├── server/                  Express + Sequelize
│   ├── config/              env.js (typed env vars), db.js (Sequelize instance)
│   ├── controllers/         Thin: parse request, call a service, send response
│   ├── middleware/          auth + roles, validation, rate limits, error handler
│   ├── migrations/          Schema (Umzug). Applied files are tracked in schema_migrations
│   ├── models/              Sequelize models; associations are in models/index.js
│   ├── routes/              /api route definitions
│   ├── seeders/             Real clinic content. Tracked in schema_seeders
│   ├── services/            Business logic (auth, mail, activity log, ...)
│   ├── utils/               Helpers and the db CLI (dbTasks.js)
│   ├── validators/          zod schemas
│   └── server.js            Entry point
├── .env.example             Every environment variable, documented
└── package.json             Backend deps + build/start/db scripts
```

---

## How it works

### API conventions

- All routes live under `/api`. The client only ever calls relative URLs (`/api/...`).
- Request bodies are validated with zod; errors come back as
  `{ "message": "...", "details": [{ "field": "...", "message": "..." }] }`.
- Roles are enforced **on the API** (`requireRole(...)`); `super_admin` can do everything.

### Auth (`/api/auth`)

| Method & path | Purpose |
|---------------|---------|
| `POST /login` | Email + password → sets the `nidan_session` httpOnly cookie. Strictly rate limited (10 failed tries / 15 min / IP) |
| `POST /logout` | Clears the cookie |
| `GET /me` | The signed-in user |
| `POST /forgot-password` | Emails a one-hour reset link. The reply is identical whether or not the email exists |
| `POST /reset-password` | Sets a new password from the emailed token. Signs out all older sessions |
| `POST /change-password` | For the signed-in user. Signs out all other sessions |

Passwords are hashed with bcrypt (cost 12). Reset tokens are stored only as a SHA-256 hash. Without `SMTP_HOST` set,
emails are skipped with a log line (no content is logged).

### Public website (`/api/public`)

Read-only content endpoints (cached for 60 seconds) feed the React pages. They only return whitelisted fields, never
patient data, and admin-written HTML (bios, service pages, blog posts) is sanitised before it is sent.

| Endpoint | Used by |
|----------|---------|
| `GET /site` | Header, footer, announcement bar, SEO defaults (clinic details, social links, locations) |
| `GET /home` | Home page in one request (services, doctors, specialties, testimonials, gallery preview, latest posts) |
| `GET /doctors`, `/doctors/:slug` | Doctor pages, with timings grouped by location |
| `GET /services`, `/services/:slug` | Service pages |
| `GET /testimonials`, `POST /testimonials` | Approved testimonials; visitor submissions are saved as `pending` for moderation |
| `GET /gallery` | Gallery (only categories that have images) |
| `GET /blog`, `/blog/categories`, `/blog/:slug` | Blog list (search, category, pagination) and articles |
| `POST /contact` | Contact form: creates a **Lead** (source `website`, status `new`) and emails `CLINIC_NOTIFY_EMAIL` |

The two `POST` endpoints are rate limited (8 requests / 15 min / IP), require the consent box, validate the phone
number (stored normalised as `+91XXXXXXXXXX`) and include a hidden honeypot field that silently drops bot submissions.

Pages: `/`, `/about-us`, `/doctors`, `/doctors/:slug`, `/services`, `/services/:slug`, `/gallery`, `/testimonials`,
`/blog`, `/blog/:slug`, `/contact-us`, `/book-appointment`, `/privacy-policy`. Home page sections that have no content
yet (testimonials, gallery, blog) are hidden automatically, so the site never shows empty placeholders. Each page sets
its own title, description, canonical URL and Open Graph tags; the home and contact pages add `MedicalClinic`
structured data, doctor pages add `Physician`, and blog posts add `BlogPosting`.

### Online booking (`/api/public/booking`)

The booking page (`/book-appointment`) is a six-step flow: doctor, location, date, time, patient details, confirmation.
Links such as `/book-appointment?doctor=dr-rajeev-ranjan&location=nidan-sector-51` start part-way through (the
"Book with this doctor" buttons use them). Every step shows Call, WhatsApp and "Request a call back" (which saves a
lead with source `booking_dropoff`).

| Endpoint | Purpose |
|----------|---------|
| `GET /dates?doctorId&locationId` | Days in the doctor's booking window that still have a free slot |
| `GET /slots?doctorId&locationId&date` | Free slots for one day (never cached) |
| `POST /` | Create the appointment (rate limited, consent required, honeypot) |

How slots are worked out (`server/services/slots.service.js`, pure logic with no database access):

- Start from the doctor's weekly schedule **at that location** and cut it into slots of `doctors.slot_minutes`
  (default 15; set per doctor).
- Remove whole-day and part-day **leaves** (`doctor_leaves`; a leave with no location applies everywhere).
- Remove slots that overlap an active booking of the same doctor **at any location**, because a doctor cannot be in
  two places at once.
- Hide the past, anything sooner than `doctors.min_notice_minutes` from now (default 60), and anything beyond
  `doctors.booking_window_days` (default 30). "Now" is always Asia/Kolkata time.

Booking rules:

- The chosen time must still be a free slot when the request arrives; if not, the visitor gets a friendly
  "no longer available" message and the slot list refreshes.
- Two people can still click the same slot in the same instant. The database unique index on
  `(doctor_id, appointment_date, start_time, slot_lock)` lets exactly one win; the others get the same friendly message.
  This is tested with 10 simultaneous bookings.
- The same patient cannot hold two active bookings with the same doctor on the same day.
- **Patients are matched by phone number + name** (case and spacing ignored). A child's age can be entered instead of a
  date of birth (the birth date is then estimated). When exactly one mother uses a phone number, the children booked
  under that number are linked to her automatically.
- New online bookings start as **`pending`**; staff confirm them in the CRM (Phase 4). The patient sees "Awaiting
  confirmation" and gets a "request received" email (if they gave an address); `CLINIC_NOTIFY_EMAIL` gets the details.
  Emails are sent in the background, so a mail problem never blocks or fails a booking.
- Booking IDs look like `APT-7K4P9X` (no look-alike characters such as 0/O or 1/I).

### Clinic CRM (`/admin`)

Staff sign in at `/admin` (forgot / reset password by email; "Change password" is in the sidebar). The CRM is a
separate lazy-loaded bundle, so website visitors never download it, and `/admin` is marked `noindex`. The seeded super
admin creates the other logins on the **Users** screen.

| | Super admin | Reception | Doctor |
|---|---|---|---|
| Dashboard | everything | everything | own appointments and tasks only |
| Appointments | all; book, reschedule, change status | all; book, reschedule, change status | own only; change status |
| Patients | all; add, edit, **delete** | all; add, edit, link family | only patients they have seen; edit |
| Visit notes | read all, cannot write | **no access** | read and write their own |
| Patient files | yes | yes | for their own patients |
| Leads | yes | yes | no |
| Follow-ups | all | all | only tasks assigned to them |
| Vaccinations | everything, including the schedule | record doses, view the schedule | record doses, edit the schedule |
| Doctors | all profiles and timetables | view; manage leave dates | edit own profile and timetable; manage leave |
| Locations, services, specialties, testimonials, gallery, blog, site settings | yes | no | no |
| Users and activity log | yes | no | no |

Roles are enforced **on the API** (`requireRole`) and again in the services (doctor scoping). A doctor asking for
someone else's patient or appointment gets a plain 404, so existence is not revealed.

What each screen does:

- **Dashboard:** today's appointments grouped by doctor, awaiting-confirmation count, new leads, follow-ups due and
  overdue, a 14-day appointment chart and lead sources for the last 30 days.
- **Appointments:** list (search by name, phone or booking ID; filters for doctor, location, status and date range)
  and a day / week calendar. Staff can book phone and walk-in appointments (same-day allowed, up to 120 days ahead),
  reschedule, cancel with a reason, and mark completed / no-show. Print the list, export it as CSV, or message the
  patient on WhatsApp with the confirmation text already typed in.
  Status flow: `pending → confirmed → completed`, with `cancelled` and `no_show` as exits. Cancelled is final (its slot
  may already be re-booked); completed and no-show visits can be re-opened.
- **Patients:** search by name, phone, patient ID or tag; profile with appointment history, tags, family links
  (mother ↔ child, sibling, guardian), visit notes, private files and follow-ups. Booking from the website creates and
  links patients automatically.
- **Leads:** from the contact form, booking call-back requests and manual entry. Status `new → contacted →
  converted / lost` (a lost lead needs a reason), assignee, next follow-up date, a notes timeline, and **Convert to
  patient**. Adding the first note moves a new lead to contacted.
- **Follow-ups:** tasks with a due date linked to a lead, patient or appointment, grouped as overdue / today /
  upcoming / done.
- **Emails to patients** (only when an email address is on file): appointment confirmed, rescheduled and cancelled.

Patient files (reports, scans) are stored in `UPLOAD_DIR/private/`, which is never served as static files. They download
only through `GET /api/attachments/:id/download`, which checks the session and the doctor's access to that patient.
Uploads are limited to PDF, JPEG, PNG and WebP up to 10 MB, identified from the file's first bytes (a renamed `.exe`
is refused) and stored under a random name. `src/services/storage.service.js` is the only code that touches the disk, so
it can later be swapped for S3 or Cloudinary.

Privacy: visit-note text and passwords are never written to the activity log; the CSV export neutralises spreadsheet
formulas (a patient named `=HYPERLINK(...)` cannot run code in Excel).

### Vaccinations, doctors, website content and administration

- **Vaccinations** (`/admin/vaccinations`). Every child patient gets one dose row per vaccine in the schedule, due on
  *date of birth + the vaccine's age in days*. The **Due doses** tab lists overdue, next 7 days, next 30 days or all
  pending doses, with a WhatsApp reminder link and a **Record** button (date given, optional note and doctor). The
  **Schedule** tab is the master vaccine list: adding a vaccine creates the dose for every existing child, changing its
  age moves only the doses that are still pending, and a vaccine that has been given to anyone can be switched off but
  not deleted. Doses already recorded as given are never changed. A child's vaccination history is also on their
  patient page (Vaccinations tab), and the dashboard counts doses due this week and overdue.
- **Doctors** (`/admin/doctors`). Profile (photo, qualifications, areas of focus, quote, "About" text, search title and
  description, appointment length), a **weekly timetable** (blocks of location + from/to + weekdays) and **leave and
  blocked dates** (whole days or part of a day, at one location or everywhere). The booking page and website use these
  within a minute. Two ranges at the same location on the same weekday cannot overlap. Overlap across *different*
  locations is allowed with a warning. Adding leave never cancels anything: it warns how many existing
  appointments fall in the blocked time so reception can reschedule or cancel them. Only the super admin changes a doctor's
  web address, visibility, booking window and minimum notice.
- **Website content** (super admin): **Locations** (map links are generated from the address unless you paste your own),
  **Services** (formatted description, icon, order, visible/hidden), **Specialties** (the "known for" cards),
  **Testimonials** (visitor submissions wait under *To review* until approved; staff can also add one), **Gallery**
  (albums and pictures with required alt text, reorder, hide) and **Blog** (categories; each article is a draft,
  published, or scheduled by giving it a future publish date; cover picture, summary, search title/description and web
  address). Pictures must be JPEG, PNG or WebP up to 5 MB and are identified from the file's first bytes. Everything
  rich-text is sanitised on the server before it is stored.
- **Site settings** (`/admin/settings`): clinic name, phone numbers, WhatsApp number and email; social links; home page
  banner text and picture; the announcement bar; the "Why choose us" list; the home page FAQ (add, remove and reorder
  questions; seven starter questions are included, so read and adjust them); the About page text; default search title and
  description. Each section is saved on its own and shows on the website within a minute.
- **Users** (`/admin/users`): add a login with a starting password (8+ characters, a letter and a number), choose the
  role, switch a login on or off, set a new password (the person is signed out everywhere) or email them a reset
  link. A doctor login must be linked to a doctor profile that has no login yet. You cannot switch off or change the
  role of your own account, and the last active super admin can never be demoted or switched off.
- **Activity log** (`/admin/activity`): who did what and when, filterable by person, area, action, date range and
  text. Expandable rows show the before and after of changed fields. Passwords, tokens and notes are never recorded.

### Database notes

- Charset `utf8mb4`, collation `utf8mb4_unicode_ci`; indexed strings are `VARCHAR(191)`.
- `created_at` / `updated_at` are UTC. **Appointment dates and times are clinic wall-clock time (Asia/Kolkata)** stored
  as `DATE` + `TIME`, so no timezone conversion can shift a booking.
- Soft deletes (`deleted_at`) on patients, leads and appointments.
- **Double booking is blocked by the database.** `appointments.slot_lock` is `1` while an appointment holds its slot
  (pending / confirmed / completed) and `NULL` once it is cancelled, a no-show or deleted. A unique index on
  `(doctor_id, appointment_date, start_time, slot_lock)` therefore rejects a second active booking for the same
  doctor and time, while still allowing the slot to be re-booked after a cancellation. The model hooks maintain
  `slot_lock`, so always change status through model instances (`appointment.update({ status })`), not bulk `UPDATE`s.
- JSON-like fields (tags, specialities, settings, audit changes) are stored as plain `TEXT` holding JSON, because
  MariaDB and MySQL treat the `JSON` type differently.

### Search engines and link previews

- **Per-page `<head>` from the server.** In production every page request returns `index.html` with that page's own
  title, description, canonical URL and Open Graph / Twitter tags already filled in (`server/services/seo.service.js`),
  built from the database. WhatsApp, Facebook and Google therefore see the right text without running JavaScript. Once
  the page loads, React takes over and replaces those tags with its own (no duplicates).
- **Real 404s.** Unknown addresses, switched-off doctors and services, drafts and scheduled articles answer HTTP 404 with
  `noindex`, so search engines never keep empty pages.
- **`/sitemap.xml`** lists the public pages, active doctors and services and published articles, built live with
  `lastmod`. **`/robots.txt`** blocks `/admin` and `/api` and points to the sitemap. Outside production it blocks
  everything, so a staging copy is never indexed.
- **One address per page.** `/about-us/` redirects (301) to `/about-us`; `/admin` and `/api` send `X-Robots-Tag: noindex`.
- All of this uses `CLIENT_URL` as the site address, so set it to the real `https://` domain in production.
- Structured data (`MedicalClinic`, `Physician`, `BlogPosting`) is added by the pages themselves. Google runs
  JavaScript and reads it; link-preview crawlers do not need it.

### Security notes

- Passwords: bcrypt (cost 12). Sessions: signed JWT in an `httpOnly`, `Secure` (in production), `SameSite=Lax` cookie;
  changing a password signs out every older session. Roles are checked on the API, not just hidden in the screens.
- Rate limits: 10 failed sign-ins and 5 password-reset requests per IP, 8 public form posts per 15 minutes, and a
  general ceiling on the API. Forms also have a hidden honeypot field.
- Helmet sets a strict Content-Security-Policy (scripts only from the site itself), HSTS and the other standard
  headers. All input is validated with zod; database access goes through Sequelize (parameterised queries); rich text is
  sanitised on the server; uploads are type-checked from their first bytes and stored under random names; patient
  files are never served as static files.
- The server **refuses to start in production** if `JWT_SECRET` is missing, shorter than 32 characters or still the
  example value, and the seeder refuses the example admin email / password. `db:reset` is blocked in production.
- `npm audit` (as of this release): the website bundle has no known issues. The server reports moderate advisories in
  two indirect packages (`uuid` inside Sequelize, `sprintf-js` inside Umzug's command-line helper). Neither is reachable
  here (the affected functions are not used, and nothing user-supplied reaches them), and the suggested "fix" would
  downgrade Sequelize to a 2016 version, so they are left alone. A further high advisory is in `braces`, used only by
  `nodemon` during development. Re-run `npm audit` now and then and update when Sequelize / Umzug publish fixes.

### Performance notes

- Public pages and settings are cached for 60 seconds; built files in `/assets` are cached for a year (they are
  fingerprinted); uploads for a week; responses are gzip-compressed.
- The website's first JavaScript file is about 210 kB (65 kB compressed); every page, and the whole CRM, loads on demand.
  The rich-text editor (about 130 kB compressed) only downloads when staff open an article or content editor.
- Pictures below the fold load lazily, fonts use `display=swap`, and the footer has no embedded map (only "Get directions" links).
- **First screen without waiting for the API.** For public pages the server puts the data the page asks for on start-up
  (site settings, plus home, doctors, services or gallery content) inside `index.html` as a JSON block
  (`id="nidan-preload"`, see `seo.service.js`). The website uses it for the first draw and fetches fresh data for every
  later page. It also asks the browser to start downloading the banner picture and the two fonts straight away.
- **Fonts are served from this site** (`client/public/fonts`, Inter and Nunito, both under the SIL Open Font License),
  so nothing has to be fetched from Google before text can be drawn.
- **Development server.** `vite.config.js` points the name `lucide-react` at `client/src/icons.js`, a short list of the
  icons the site uses, because the library's own entry point is 5 MB in development. If a page needs an icon that is not
  listed, add one line to `icons.js` (the file name is under `node_modules/lucide-react/dist/esm/icons`); `npm run build`
  and `npm run dev` both fail with a clear "is not exported" message until you do.
- Pictures are kept light: the banner is 900 px wide (about 115 kB). Resize any large photo before uploading it.
- **Lazy loading.** Below-the-fold content is built only when the visitor is about to see it:
  - pictures use `loading="lazy"` and `decoding="async"` (only the banner and the logo load straight away);
  - on the home and Contact pages the lower bands (doctors, clinics and map, specialties, testimonials, gallery,
    blog, FAQ, contact band) are built when they come within about 700 px of the screen, or in idle time four
    seconds after the page opened (`components/public/LazyMount.jsx`; give a band `lazy="40rem"` on `<Section>`, with
    a height close to its real one, to use it elsewhere);
  - the code for the clinic picker and the testimonial slider is fetched at that moment, not with the first page;
  - the Google Map is only requested when its frame is about to scroll into view;
  - every page's own code is loaded on demand, and the admin area and rich-text editor only for signed-in staff.
  On a modest phone this cut the home page's start-up work by about a third and its page size from 1,528 to 885 elements.

### Phones and tablets

- The public site and the CRM were checked at 320, 360, 390, 412, 568, 768, 820 and 1024 px wide. On every page the
  content is exactly as wide as the screen, with no sideways scrolling or zooming out.
- Sideways slide-in animations only run from 1024 px up. On smaller screens they rise instead, because an element waiting
  off to the right would make the page wider than a phone until it is revealed. Each page band also clips anything
  that sticks out sideways, and grid columns may shrink below their longest word, so one long email address cannot
  stretch a page.
- Service cards are compact rows on phones, links and tabs have larger tap areas, and the floating contact button is a
  little smaller on phones.
- After changing a layout, check it at 360 px: open the page in the browser's device mode, reload it without
  scrolling, and confirm the page does not move sideways.

---

## Deploying to Hostinger

The repository is built and started by Hostinger's **Node.js web app** feature (GitHub import). The commands are the
ones in `package.json`:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Start / entry file | `server/server.js` (`npm start`) |
| Node.js version | 20 or newer (22 is fine) |
| Output / static folder | not needed: Express serves `client/dist` itself |

Menu names in hPanel change from time to time, so follow the idea if a label differs.

1. **Push the code to GitHub** (once):
   ```bash
   git remote add origin https://github.com/<your-account>/<your-repo>.git
   git push -u origin main
   ```
   After that, `git push origin main` deploys again.
2. **Create the database.** hPanel → **Databases → Management** → create a MySQL database and user. Note the full
   names (Hostinger adds a prefix such as `u123456789_`), the password and the host (usually `localhost`).
3. **Create the app.** hPanel → **Websites → Add website → Node.js Apps → Import Git repository**, pick the repo and
   branch, and enter the build and start settings above.
4. **Add the environment variables** (same screen). Copy every line from `.env.example` and set:

   | Variable | Production value |
   |----------|------------------|
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://nidanmotherandchildcare.com` (the real domain, no trailing slash) |
   | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | from step 2 |
   | `JWT_SECRET` | a new random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `COOKIE_SECURE` | `true` |
   | `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the real owner's details (first login only) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | a Hostinger mailbox: `smtp.hostinger.com`, port `465` |
   | `CLINIC_NOTIFY_EMAIL` | who is told about new bookings and enquiries |
   | `UPLOAD_DIR` | a folder **outside** the app, e.g. `/home/u123456789/nidan-uploads` |
   | `RUN_MIGRATIONS`, `RUN_SEEDS` | `true` for the first deploy only (see below) |

   Never put these in git. `.env` is ignored by `.gitignore`.
5. **First deploy.** With `RUN_MIGRATIONS=true` and `RUN_SEEDS=true` the server creates the tables, the clinic content
   and the first super admin when it starts, so no SSH is needed. Open the site, sign in at `/admin`, then **set both
   flags back to `false`** and restart. (With SSH you can run `npm run db:migrate` and `npm run db:seed` instead.)
   The seeders are safe to repeat: they never overwrite rows that exist.
6. **Domain and HTTPS.** Point the domain at the app in hPanel and switch on the free SSL certificate and the
   "force HTTPS" option. Choose one of `www` / non-`www` and redirect the other to it, to match `CLIENT_URL`.
7. **Check it:** `https://your-domain/api/health` should say `"status":"ok"`; `/robots.txt` and `/sitemap.xml` should
   show your domain; the site, booking and `/admin` login should all work.
8. **Tell Google.** Add the site to Google Search Console and submit `https://your-domain/sitemap.xml`.

**Updating the live site:** change code, `git push origin main`, and let Hostinger rebuild (or press **Redeploy**).
New database changes ship as new files in `server/migrations`; set `RUN_MIGRATIONS=true` for one deploy to apply them.

**If something goes wrong**

- *"The website has not been built yet"*: the build did not run. Check the build log; the build command must be `npm run build`.
- *Server stops at start with "Invalid environment configuration"*: read the message; usually `JWT_SECRET`.
- *Every page says "Something went wrong" and the log shows `TypeError: Invalid URL`*: `CLIENT_URL` was typed without
  `https://`. Set it to the full address, e.g. `https://your-domain.com`, and redeploy.
- *The page shows "504 Gateway Time-out" (nginx)*: the app started but the request got no answer. Open
  `https://your-domain/api/health` first: if that answers `"status":"ok"` the app is fine and only the page route is slow
  or stuck (database); if it also times out, the app is not reachable (check the app status and the port in hPanel).
- *No admin account or no content after the first deploy*: the log must show both "RUN_MIGRATIONS=true - applying
  pending migrations" and "RUN_SEEDS=true - applying pending seeders". If the seeders line is missing, `RUN_SEEDS` is
  not set to `true` (exactly that word, in lower case); fix it and redeploy once.
- *`ECONNREFUSED` / "Access denied" for the database*: re-check `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  against hPanel (names include the prefix).
- *Staff cannot stay signed in*: the site must be served over HTTPS while `COOKIE_SECURE=true`.
- *Emails are not sent*: check the `SMTP_*` values and that the mailbox exists. Without `SMTP_HOST` emails are skipped
  (with a log line); bookings still work.
- *Uploaded pictures disappear after a deploy*: `UPLOAD_DIR` points inside the app folder. Move it outside and re-upload.
- *"Too many requests" (429)*: a rate limit was hit (for example many failed sign-ins). Wait 15 minutes.

---

## Moving the database with phpMyAdmin

**Export (backup, or to copy a database elsewhere):**

1. Open phpMyAdmin (XAMPP: <http://localhost/phpmyadmin>; Hostinger: hPanel → Databases → **phpMyAdmin**).
2. Click the database (`nidan_crm`) in the left list → **Export** tab.
3. Method **Quick**, format **SQL** → **Export**. Save the `.sql` file somewhere private: it contains patient data.

**Import:**

1. Create the empty database first (see the setup steps above) and click it in phpMyAdmin.
2. **Import** tab → choose the `.sql` file → leave the character set as `utf8mb4` → **Import**.
3. The dump includes the `schema_migrations` and `schema_seeders` tables, so the app knows nothing is left to run:
   keep `RUN_MIGRATIONS` and `RUN_SEEDS` on `false` after importing.

Do **not** use both a seeded start and an import on the same database. Never import a development database that holds
test patients into the live clinic's database, and keep dumps out of git (`*.sql` files should not be committed).
Take a fresh export before every risky change, and keep Hostinger's own backups switched on.

---

## Everyday tasks in the admin panel

Sign in at `/admin`. Only a super admin sees Website, Users and Activity log. Changes reach the public site within a
minute.

**Add a doctor**
1. **Doctors → Add doctor**: enter name, designation and qualifications → you land on the doctor's page.
2. Upload a photo, add the "About" text and areas of focus, choose the appointment length, tick
   *Show this doctor on the website and allow online booking*, and **Save profile**.
3. Build the **Weekly timetable**: add a time range for each location (pick the location, from / to, tick the weekdays)
   → **Save timetable**. Patients can book as soon as a timetable exists.
4. Optional: **Users → Add login**, role *Doctor*, linked to this doctor, so they can sign in and see their own patients.

**Add a location**
1. **Locations → Add location**: name, address, phone, whether it is one of your own clinics or a partner hospital.
   A map link is created from the address (paste your own link if you prefer).
2. Add timetable ranges for it on each doctor's page. Patients can book a location once a doctor has a timetable there.

**Add a service**
1. **Services → Add service**: name, short description (for the cards), icon, the page content, an optional picture and
   search title / description.
2. Leave *Web address* empty to create it from the name. Use the arrows to change the order. Untick
   *Show this service on the website* to hide it without deleting it.

**Publish a blog post**
1. **Blog → New article**: title, summary, cover picture, category, author, and the article text (use the toolbar for
   headings, lists, links and pictures).
2. **Save draft** to keep working. When ready, set the status to *Published* and **Publish**.
   To schedule it, choose *Published* and a future date and time.
3. Categories are managed at the bottom of the Blog screen.

**Other common jobs**
- *Change phone numbers, WhatsApp, email, banner text or the announcement bar:* **Site settings**.
- *Edit the home page questions and answers:* **Site settings → Frequently asked questions**. Removing every question
  hides the section.
- *Put a real photo on the home page banner:* **Site settings → Home page banner → Banner picture**. Portrait or square
  works best. It is also the picture shown when the site is shared on WhatsApp. Remove it to go back to the illustration.
- *Approve a visitor's testimonial:* **Testimonials → To review → Approve**.
- *Block a doctor's leave dates:* **Doctors →** the doctor **→ Leave and blocked dates**.
- *Reset a staff member's password:* **Users → Password** (or **Email link**).
- *See who changed something:* **Activity log**.

---

## Launch checklist

- [ ] All environment variables set (above), `NODE_ENV=production`, `COOKIE_SECURE=true`, real `JWT_SECRET`.
- [ ] `RUN_MIGRATIONS` / `RUN_SEEDS` back to `false` after the first start; `UPLOAD_DIR` outside the app folder.
- [ ] Signed in as the super admin and changed the password from the sidebar.
- [ ] Replaced the three `TODO` placeholder testimonials (they never show until approved) with real ones, with consent.
- [ ] Checked both doctors' photos and "About" text, and each doctor's timetable (assumption 4).
- [ ] The map on the Contact page points at the clinic
      (**Locations**: paste the exact Google Maps embed link if the automatic one is off).
- [ ] Dr. Rajeev Ranjan reviewed the vaccination schedule (**Vaccinations → Schedule**).
- [ ] Privacy policy reviewed (it has a `TODO` for the record-retention period).
- [ ] Home page FAQ answers read and adjusted to the clinic's real practice (**Site settings → Frequently asked questions**).
- [ ] Gallery reviewed (**Gallery**): consent confirmed for the photos of patients and babies, and the 15 switched-off
      photos either shown or deleted (assumptions 30 and 31).
- [ ] Sent a test booking and a test contact message; both emails arrived; reception can confirm the booking.
- [ ] `/robots.txt` and `/sitemap.xml` show the live domain; sitemap submitted in Google Search Console.
- [ ] Shared a page on WhatsApp and checked the preview.
- [ ] A first database backup taken (phpMyAdmin export) and Hostinger backups on.

---

## Assumptions

Decisions I made where the brief was open or ambiguous. Tell me if any should change.

1. **Project root** is this folder itself (`client/`, `server/` at the top level), not a nested `my-mern-app/`.
2. **`bcryptjs`** (pure JavaScript bcrypt) is used instead of the native `bcrypt` package. It produces standard bcrypt
   hashes but needs no compiler, which avoids build failures on shared hosting.
3. **Old site URLs.** The current WordPress site has no per-service or per-doctor pages (`/services/` returns 404 and
   the doctors page has no profile links), so there are no old slugs to preserve for those. New slugs:
   `/doctors/dr-manisha-ranjan`, `/doctors/dr-rajeev-ranjan`, `/services/maternity`, etc.
4. **Two clinics.** NIDAN Mother & Child Clinic has two clinics: Sector 51 (Basement B, 170, Block B, Sector 51, Noida
   201303) and Gaur City (S-219, Aarza Square 2, Gaur City 1, Greater Noida 201318). They appear on the home page,
   Contact page, About page, footer and top bar. Cloudnine Hospital (where Dr. Manisha Ranjan had been listed) is not a
   Nidan clinic and has been removed completely; the seeder `019-remove-cloudnine.js` deletes it from an existing
   database. If a partner hospital is ever needed again, add it in Admin > Locations with "This is one of our own
   clinics" switched off: it then appears only in the booking steps, not in the clinic lists or the doctors' timing lists.

   The site shows no general "opening hours", only each doctor's own timings (the old Site settings row was removed by
   the seeder `022-remove-opening-hours.js`). Doctor timings are per doctor and per clinic, and they drive online
   booking (15-minute slots):
   - Dr. Rajeev Ranjan: Sector 51 Monday to Friday 8:30 am-1:30 pm, Saturday and Sunday 10:30 am-1:30 pm, every day
     6-9 pm; Gaur City 3-5 pm with Tuesday and Thursday off (seeder `012-rajeev-timings.js`).
   - Dr. Manisha Ranjan: Sector 51 every day 6-9 pm plus Sunday 12-2 pm; Gaur City 3-5 pm with Tuesday and Thursday off
     (seeder `013-manisha-timings.js`).

   Timings can be changed any time in Admin > Doctors. The Gaur City clinic comes from the seeder `011-more-clinics.js`;
   any location can also be added or edited in Admin > Locations.
5. **Uploads.** `UPLOAD_DIR` has two sub-folders: `public/` (gallery, blog, doctor photos) is served at `/uploads`,
   and `private/` (patient reports) is never served directly and will be streamed only through authenticated routes.
6. **Patient de-duplication** matches on normalised phone number plus name. The same phone with a different name
   creates a new patient linked as family (a mother's number is often used for her child).
7. **CSRF** protection relies on the `SameSite=Lax` session cookie plus a JSON-only API, rather than separate tokens.
8. **Vaccination schedule** is a standard Indian paediatric starter list. Dr. Rajeev Ranjan should review it; every
   row is editable in the admin panel.
9. **Content placeholders.** No images are copied from the old site. Doctor photos and the gallery are empty, and the
   three sample testimonials are marked `TODO` and stay `pending`, so they never appear publicly. Years of
   experience, awards and patient counts are deliberately not stated anywhere.
10. **WhatsApp number** defaults to +91 97735 07333 (editable in site settings).
11. **Login session length** defaults to 12 hours (`JWT_EXPIRES_IN`).
12. **No static content layer.** The seeded database already holds the real clinic content, so the public pages read
    from the API directly instead of from a throwaway static copy. Only the clinic name and phone/WhatsApp numbers
    have a built-in fallback (`client/src/utils/siteDefaults.js`) so Call and WhatsApp keep working if the API is down.
13. **Privacy policy** (`/privacy-policy`) is a plain-language draft for the DPDP Act with a `TODO` for the record
    retention period. Have it reviewed before launch.
14. **No default share image.** Pages only emit an Open Graph image when a doctor photo, blog cover or service image
    exists. Add a branded image later if you want link previews on pages without one.
15. **No map in the footer.** Each clinic card in the footer has a "Get directions" link instead, so third-party map
    code does not slow down every page. The home and Contact pages load their maps only when scrolled into view.
16. **Bookings are not auto-confirmed.** They start as `pending` (the brief's workflow is pending → confirmed) and the
    confirmation screen says so. There is no lookup-by-booking-ID page for patients, so booking details are never
    exposed publicly; changes and cancellations go through the clinic by phone or WhatsApp.
17. **Booking defaults** (15-minute slots, 30-day window, 60-minute notice) are columns on each doctor and are
    editable on the doctor's page in the admin panel.
18. **"Own patients" for a doctor** means patients who have (or had) an appointment with that doctor. A newly
    registered patient with no appointment is visible to reception and the super admin only.
19. **Reception cannot read visit notes.** They are medical records, so only the writing doctor and the super admin see
    them. Reception can still upload and see files for patients (reports are usually filed by the front desk).
20. **Doctors cannot book or reschedule.** They confirm, complete, mark no-show or cancel their own appointments;
    booking and moving appointments is a reception task. Easy to change in `appointment.routes.js` if you disagree.
21. **Staff bookings are confirmed immediately** (the patient is told by email when an address is on file) unless
    "Pending" is chosen in the form.
22. **Search engines and social previews.** The site is a single-page app, so the server fills in each page's title,
    description and Open Graph tags itself (see "Search engines and link previews"). The text for the fixed pages
    (About, Services, ...) is written in two places: `client/src/pages/public/*` and `server/services/seo.service.js`.
    If you reword one, reword the other.
23. **Website content, settings, users and the activity log are super admin only.** Doctors edit their own profile,
    photo, timetable and leave; reception can add or remove leave dates for any doctor.
24. **"Due soon" for a vaccine means due within the next 7 days.** Children registered after their early vaccines were
    due start with those doses overdue; reception records the ones already given.
25. **New logins get an admin-set password** (optionally followed by an emailed reset link). Public pages and settings
    are cached for up to 60 seconds, so a change can take that long to appear for visitors.
26. **The site's public address is `CLIENT_URL`.** Canonical links, the sitemap, Open Graph URLs and emailed links all
    use it, so it must be the live `https://` domain in production.
27. **Removed content answers 404**, not 410 ("gone"). Search engines drop such pages on their own after a while.
28. **Deployment targets Hostinger's Node.js web app with a GitHub import.** I could not test on Hostinger itself; the
    production build, start-up, first-deploy flags (`RUN_MIGRATIONS` / `RUN_SEEDS`) and the SEO / security behaviour
    were tested locally in `NODE_ENV=production`, including a first start on an empty database.
29. **One production build quirk fixed:** the root `.env` contains `NODE_ENV=development`, which used to make
    `vite build` produce a slower development bundle on a developer machine. `client/vite.config.js` now reads only
    `PORT` from that file. (On a server where the variables are set in a control panel there is no `.env`, so it was
    most likely unaffected, but the fix removes the risk.)
30. **Pictures from the old website.** The gallery photos, the twelve round service pictures and the home banner photo
    were copied from nidanmotherandchildcare.com (the clinic's own site), resized to WebP and stored in
    `client/public/images` (so they deploy with the code, unlike admin uploads). Theme placeholders, stock banners,
    icons and the old logo were left out. Fifteen of the 49 gallery photos are added **switched off**: eight with
    graphic surgical views or very personal newborn photos, and five 3D design renders that carry an interior
    designer's watermark (plus two more theatre photos that show a surgical field). Turn any of them on in
    **Gallery** if the clinic wants them public. Alt text for each picture was written from the picture itself.
31. **Patient consent for photos.** Many photos show mothers, babies and families. Confirm that the clinic has
    consent for every one it publishes (DPDP Act), and delete the ones it does not.
32. **Clinic name.** The website, e-mails and page titles say "NIDAN Mother & Child Clinic" in full and never just
    "Nidan", as you asked. Its main source is Site settings > Clinic name, and the seeder `014-clinic-full-name.js`
    updated the saved texts, doctor bios and clinic names. The logo picture itself still reads "NIDAN Mother & Child
    Care", because it is an image; replace `client/public/images/nidan-logo.webp` (and the favicons) if it should match.
    Technical names such as the e-mail address, web address, database and file names keep "nidan" in lower case.
33. **One YouTube link.** The site links to one YouTube channel, Dr. Rajeev Ranjan's (`@dr.rajeevranjan-nidanmothe1260`),
    in the top bar, footer and mobile menu. Dr. Manisha Ranjan's link was removed (seeder `021-single-youtube.js`). Change
    it in Site settings > Social media; leave it empty to hide the icon.
34. **Google reviews as testimonials.** Nineteen reviews that patients posted on the clinic's Google listing are published
    as testimonials (seeder `016-google-reviews.js`, labelled "Google review", shown word for word including spelling and
    the old clinic name). No star ratings are shown because the copied text had none, and the website never invents
    them. Left out: reviews with no text, one for another hospital, one that names a different doctor, a translation
    error ("Go") and one that describes a surgery in detail. They are public posts, so there is no separate consent
    record; staff can hide, reorder or edit any of them in Admin > Testimonials. The three "TODO" placeholders stay
    hidden. Doctors in India are limited in how they may advertise, so have the clinic confirm that showing patient
    reviews is acceptable for it.
35. **About page picture.** A photo of the clinic building (from the old website's gallery) sits beside the About text. Change
    it, or remove it to centre the text again, in Site settings > About page (the seeder `017-about-picture.js` set the
    first one).
36. **Exact maps for the two clinics.** The maps on the home and Contact pages, and the "Get directions" links, use the
    clinics' own Google Maps listings (the embed codes you sent), not a search made from the written address. Sector 51 is
    the listing "Dr Rajeev Ranjan - Best Pediatrician and Child Specialist in Noida" and Gaur City is "Nidan Mother &
    Child Care"; they are kept in `server/utils/clinicMaps.js` and applied by `020-clinic-maps.js`. To change one, open
    Admin > Locations, then in Google Maps choose Share > Embed a map > Copy HTML and paste the whole code into "Map on
    the website" (it keeps only the link inside it). Only Google Maps addresses starting with https:// are accepted.
37. **"Powered by" credit.** The bottom right of the footer says "Powered by Heltog Technologies Pvt. LTD." with the company
    name in gold, linking to https://heltog.com (opens in a new tab). It is written in `Footer.jsx` (the gold shades are
    `gold-300` to `gold-500` in `index.css`), not in Site settings.
38. **Footer.** There is no "Back to top" button any more. Under the logo, links and phone/email, the footer shows one
    card for each of your own clinics (partner hospitals are left out): the full address, "Get directions" and "Call"
    buttons, and which doctor sits there and when. The doctor timings are read live from the doctors' weekly timetables (Admin > Doctors), so they stay correct when
    you change a timetable; doctors with the same timings at a clinic are listed together ("Dr. A & Dr. B"). The
    `GET /site` response carries them in `locations[].doctors`. The Google rating (3.9, 66 reviews) is not shown
    because Google can change it; add it by hand in `Footer.jsx` if you want it.
39. **Services pages.** Everything on them comes from Admin > Services (name, short text, picture, long text), so nothing
    needs editing in the code.
    - The list page (`/services`) has Book Appointment and Call buttons, a search box that filters by name and short
      text (the number on each card stays fixed while you search), numbered cards, and a "Booking is simple" band.
      The three steps in that band are written in `ServicesPage.jsx`.
    - Each service page has a large picture beside the title (tablet and up), the long text, a "Visit us" card with both
      clinics (directions and call buttons; it points to the Contact page for doctor timings, because a service is not
      tied to one doctor or clinic), previous / next links, a booking card with WhatsApp, and the list of all services.
    - The home page keeps its smaller service cards; the larger card is `ServiceCard` with a `number`.
40. **No "Blog" link in the menus (for now).** The blog is still empty, so "Blog" is not in the top menu, the phone
    menu or the footer's Explore list. The blog itself still works: `/blog` opens, the Admin > Blog screen is
    unchanged, and the home page shows "From our blog" as soon as one article is published. When you publish articles,
    put the link back by adding `{ to: '/blog', label: 'Blog' },` before the Contact line in
    `client/src/components/public/navLinks.js` (one list feeds all three menus).
41. **About page.** The heading, the text and the picture still come from Site settings > About page; the first paragraph is
    shown a little larger as the opening line. Around them the page builds itself from live data, so nothing here needs
    editing in the code:
    - a band with the number of doctors, clinics and services;
    - "Care that grows with your family" (Pregnancy, Birth, Newborn, Childhood), whose four cards link to the Maternity,
      Neonatology and Paediatrics service pages, or to the Services list if one of those has been removed (the wording is
      in `AboutPage.jsx`);
    - a card for each doctor (photo, achievement, quote, focus areas, Book and View profile buttons) from Admin > Doctors;
    - "What you can expect" from Site settings > Why choose us;
    - the own clinics with directions, a Call button and the doctors who sit there.
42. **Dependency security scan (hPanel > Security > Vulnerabilities).** Hostinger scans the deployed app. Two findings were
    patched: `body-parser` (comes with Express) is now 2.4.0 through a normal `npm update`, and `uuid` (comes with
    Sequelize, which still asks for 8.x) is forced to 11.1.1 by the `"overrides"` block in `package.json`. Keep that block,
    and the committed `package-lock.json`, so a fresh install on Hostinger gets the patched versions. Run `npm audit
    --omit=dev` to check; it should say "found 0 vulnerabilities".

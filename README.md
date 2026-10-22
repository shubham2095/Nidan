# Nidan Mother & Child Care - Website + Clinic CRM

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
| 6 | SEO, security hardening, performance, deployment guide | Planned |

This README grows with each phase. Hostinger deployment and the "how to add a doctor / location / service / blog
post" guides are written in Phase 6.

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
│   ├── public/              Static files (favicon, ...)
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
  locations is allowed with a warning (see assumption 4). Adding leave never cancels anything: it warns how many existing
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
  banner text; the announcement bar; the "Why choose us" list; the About page text; default search title and
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

---

## Assumptions

Decisions I made where the brief was open or ambiguous. Tell me if any should change.

1. **Project root** is this folder itself (`client/`, `server/` at the top level), not a nested `my-mern-app/`.
2. **`bcryptjs`** (pure JavaScript bcrypt) is used instead of the native `bcrypt` package. It produces standard bcrypt
   hashes but needs no compiler, which avoids build failures on shared hosting.
3. **Old site URLs.** The current WordPress site has no per-service or per-doctor pages (`/services/` returns 404 and
   the doctors page has no profile links), so there are no old slugs to preserve for those. New slugs:
   `/doctors/dr-manisha-ranjan`, `/doctors/dr-rajeev-ranjan`, `/services/maternity`, etc.
4. **Dr. Manisha Ranjan's timetable overlaps.** As specified, she is at Cloudnine (Mon-Sat 9 am-3 pm) and at the
   Noida Extension clinic (Mon/Wed/Fri 1-3 pm) at the same time. The seed keeps your values. The database still
   prevents a double booking (a slot booked at one location disappears from the other), but please confirm the real
   timings and edit them in the admin panel.
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
15. **Maps in the footer** load on click (a placeholder button swaps in the Google Maps iframe), so third-party map
    code does not slow down every page. The Contact page loads its maps directly.
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
22. **Search engines and social previews.** The site is a single-page app: Google renders it fine, but link previews
    (WhatsApp, Facebook) do not run JavaScript. Phase 6 will inject per-page meta tags on the server for blog posts and
    doctor pages.
23. **Website content, settings, users and the activity log are super admin only.** Doctors edit their own profile,
    photo, timetable and leave; reception can add or remove leave dates for any doctor.
24. **"Due soon" for a vaccine means due within the next 7 days.** Children registered after their early vaccines were
    due start with those doses overdue; reception records the ones already given.
25. **New logins get an admin-set password** (optionally followed by an emailed reset link). Public pages and settings
    are cached for up to 60 seconds, so a change can take that long to appear for visitors.

# Nidan Mother & Child Care - Website + Clinic CRM

Full-stack replacement for <https://nidanmotherandchildcare.com/>: a public website with real online appointment
booking, and a CRM / admin panel for doctors and reception staff. One Node.js app: Express serves the API
(`/api/...`) and, in production, the built React site.

**Stack:** React 18 + Vite + Tailwind CSS · Express 5 · MySQL/MariaDB via Sequelize · JWT in an httpOnly cookie.

## Build status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffold, DB config, migrations, seeders, auth | Done |
| 2 | Public website pages | Planned |
| 3 | Booking engine (slots, double-booking protection, emails) | Planned |
| 4 | CRM: dashboard, appointments, patients, leads, follow-ups | Planned |
| 5 | Vaccination tracker, content management, settings, users, activity log | Planned |
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
│   │   ├── components/      Shared UI (public/ and admin/)
│   │   ├── pages/           public/ and admin/ pages
│   │   ├── services/        axios instance + one file per API resource
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

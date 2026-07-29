# Job India — Admin Panel

A modern, production-ready admin panel for the Job India (job-marketplace) backend, built with React + Vite, Tailwind CSS v4, and hand-built shadcn-style UI components.

## Stack

- **React 19 + Vite** — fast dev/build tooling
- **Tailwind CSS v4** — premium black & white design system (light + dark tokens included)
- **shadcn/ui-style components** — Radix UI primitives + Tailwind, hand-authored in `src/components/ui`
- **TanStack React Query** — server state, caching, pagination
- **Zustand** — auth/session state
- **React Router v7** — routing
- **Recharts** — dashboard charts
- **Sonner** — toasts

## Getting started

```bash
npm install
cp .env.example .env
# edit .env and point VITE_API_BASE_URL at your backend
npm run dev
```

Open http://localhost:5173

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, **including** `/api/v1` | `http://localhost:4000/api/v1` |
| `VITE_ASSET_BASE_URL` | Base URL used to resolve relative upload paths returned by the backend (e.g. `/uploads/...`). Optional — auto-derived from `VITE_API_BASE_URL` by stripping `/api/v1` if not set. | — |

## Authentication

The backend uses **OTP-based login for admins** (no passwords):

1. `POST /auth/send-otp-admin` with `{ phone }`
2. `POST /auth/verify-otp-admin` with `{ phone, otp }`

Only users with role `admin` or `superadmin` are allowed into the panel — the login page checks this and blocks other roles. Access/refresh tokens are stored in `localStorage`, and access tokens are refreshed automatically on 401 via `src/api/client.js`.

**Note:** to log in, the phone number must already exist in the `users` collection with role `admin` or `superadmin`. Seed one directly in MongoDB if you don't have one yet, e.g.:

```js
db.users.insertOne({
  phone: "+919999999999",
  role: "superadmin",
  name: "Super Admin",
  isActive: true,
  isPhoneVerified: true,
})
```

In development, if `NODE_ENV=development` on the backend, the OTP is echoed back in the `send-otp` response for convenience — check `otp.service.js` on the backend if you need the dev bypass.

## Project structure

```
src/
  api/            # one file per backend resource — axios calls only, no UI logic
  components/
    ui/            # shadcn-style primitives (button, dialog, table, select, ...)
    layout/        # sidebar, topbar, app shell, protected route
    shared/        # reusable cross-page bits (pagination, empty states, image upload, ...)
  config/          # sidebar navigation config
  lib/             # cn() + formatting helpers
  pages/           # one folder per module, matches the sidebar
  store/           # zustand auth store
```

## Modules covered

Every route exposed by the backend is wired up:

- **Dashboard** — user/KYC/job stats, charts
- **Users** — list, filters, activate/deactivate, profile edit
- **Jobseekers** — candidate search, profile edit, education/experience view
- **Employers** — list, verify/reject, company profile edit + logo upload
- **Drivers** — list + status (driver-specific edit endpoints aren't exposed by the backend beyond `/drivers/me`, so admin editing goes through the generic user profile)
- **KYC** — pending queue, document review (approve/reject/under review)
- **Jobs** — list, filters, full detail with applications + saved-by tabs, application status updates, Excel export, job editing
- **Categories** — full CRUD with image upload
- **CMS Pages** — create/edit static content pages
- **Onboarding Screens** — full CRUD with image upload
- **FAQs** — full CRUD
- **Home Sliders** — full CRUD with image upload
- **Subscription Plans** — create/edit
- **App Settings** — key/value settings CRUD
- **Dynamic Form Fields** — CRUD for the backend's configurable form-field system
- **Role Options** — CRUD for the app's role-selection screen
- **Notifications** — send to one user, broadcast by role, or send to a hand-picked list of users
- **Support Tickets** — list, thread view, admin reply, status updates
- **Payments** — read-only view (the backend only exposes `/payments/me` — there's no platform-wide payments-listing endpoint to wire up)

## ⚠️ Required backend patch (drivers)

Your backend only exposes `/drivers/me` (self-service) — there is no admin
route to list, view, or edit a specific driver's profile. The **Drivers**
and **Driver detail** pages in this panel call:

- `GET /drivers`
- `GET /drivers/:id`
- `PUT /drivers/:id`

These don't exist on your backend yet. A small patch (`driver.routes.js` +
new controller functions, no schema changes) is included alongside this
project as `backend-patch/`. Apply it and restart your API before using the
Drivers section — every other module works against your backend as-is.

The same patch also extends the existing employer admin-update endpoint to
accept `verificationStatus`, `subscriptionPlan`, `subscriptionExpiry`,
`jobPostLimit`, and a `documentReviews` array, so the expanded Employer
detail page (subscription controls + per-document approve/reject) works
too.

## Admin job posting

`POST /jobs` already allows `role: admin | superadmin`, but the backend's
`createJob` controller always sets `employerId` to the **logged-in user's own
id** — there's no field to post a job "on behalf of" another employer. So
when you post a job from this panel, your admin account becomes the employer
of record for that job (you can still fill in `companyName` /
`employerName` as free text for display). This is a backend constraint, not
a UI limitation — the "Post a job" form (`/jobs/new`) covers every other
field on the `Job` schema (location, salary, requirements, work setup,
featured/publishing settings, etc.), and the same form is reused for editing
(`/jobs/:id/edit`).

## Notes on backend quirks handled here

- Response envelope is consistently `{ success, message, data, pagination? }` — all API modules unwrap `.data.data`.
- File uploads use `multipart/form-data` with the exact field names the backend's multer routes expect (`category`, `onboardImage`, `image`, `companyLogo`, `avtar`, etc.).
- Uploaded file paths come back as relative paths like `/uploads/categories/xyz.jpg` — `resolveFileUrl()` in `lib/utils.js` prefixes them with the API's origin.
- Jobs are always queried with `admin=true` so paused/draft/closed jobs are visible to the panel.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

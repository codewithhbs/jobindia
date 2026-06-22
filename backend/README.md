# Job Marketplace Backend (Unified)

Industry-grade **single backend** for a job marketplace app (WorkIndia / Apna / Job Hai style).
Replaces the old 7-microservice setup (auth, user, job, kyc, notification, admin, media) that
talked to each other over HTTP. Everything now runs in **one Express app, one MongoDB, one JWT
secret, one port** — modules call each other directly in-process (no more axios round-trips).

## What changed vs the old `services/`
- **Monolith, not microservices** — one DB connection, one server, one deploy.
- **No inter-service HTTP** — `auth` no longer `axios`-calls `user`; it uses the models/services directly.
- **`dynamicFields` Map removed** — replaced with proper typed, role-based profile schemas.
- **Full `JobSeekerProfile`** — CV/resume, education, experience, skills, languages, certifications,
  job preferences, open-to-work, profile completeness, applications.
- **`EmployerProfile` / `DriverProfile`** — fully structured (no free-form Map).
- **Job module untouched** — `job.controller.js`, `job.model.js`, `job.routes.js` are byte-for-byte
  the same (it was already solid). Only the `job_seeker` vs `jobseeker` redirect mismatch was fixed in auth.
- **Service layer** — `otp.service`, `token.service`, `notification.service` (the KYC review now
  actually sends a notification instead of a `// TODO`).
- Consistent responses (`ApiResponse`), `catchAsync`, richer `errorHandler`, optional Redis.

## Structure
```
backend/
├── src/
│   ├── config/        db.js · redis.js · constants.js
│   ├── models/        user · jobseeker · employer · driver · auth · job · kyc · notification · support · admin · index
│   ├── controllers/   auth · user · jobseeker · employer · driver · job · kyc · notification · support · admin · media
│   ├── routes/        one router per module + index.js (mounts /api/v1/*)
│   ├── middleware/     authenticate · errorHandler · validate · upload · notFound
│   ├── services/      otp · token · notification
│   ├── utils/         logger · AppError · catchAsync · ApiResponse
│   ├── seeds/         seed.js
│   ├── app.js         express app
│   └── server.js      entry (connect DB + Redis, listen)
├── uploads/           locally-served files
├── .env.example
├── Dockerfile · docker-compose.yml
└── package.json
```

## Setup
```bash
cp .env.example .env      # edit secrets
npm install
npm run seed              # categories, settings, plans + a superadmin (+919999999999)
npm run dev               # https://jobapi.adsdigitalmedia.com
```
Or full stack with Mongo + Redis:
```bash
docker compose up --build
```

## Roles
`jobseeker · employer · driver · admin · superadmin` (see `src/config/constants.js`).

## API map (all under `/api/v1`)
**Auth** `POST /auth/send-otp` · `verify-otp` · `send-otp-admin` · `verify-otp-admin` · `refresh-token` · `logout` · `logout-all`
**Users** `GET/PUT /users/me/profile` · `PUT /users/me/location` · `PUT /users/me/push-token` · admin: `GET /users`, `GET /users/stats/overview`, `PUT /users/:id/status`
**Job Seekers** `GET/PUT /jobseekers/me` · `PUT /jobseekers/me/resume` · `me/open-to-work` · `me/dashboard` · `me/education` · `me/experience` · employer/admin: `GET /jobseekers` (search) · `GET /jobseekers/:id`
**Employers** `GET/PUT /employers/me` · `POST /employers/me/documents` · `me/dashboard` · admin: `GET /employers`, `PUT /employers/:id/verify`
**Drivers** `GET/PUT /drivers/me` · `PUT /drivers/me/availability`
**Jobs** (unchanged) `GET /jobs` · `/jobs/nearby` · `/jobs/:id` · apply/save · employer CRUD · application status
**KYC** `POST /kyc/submit` · `GET /kyc/status` · admin: `pending` · `:userId/review` · `stats`
**Notifications** `GET /notifications` · `:id/read` · `read-all` · admin: `send` · `broadcast`
**Support** `POST /support` · `GET /support/my` · `:id/reply` · `:id/close` · admin: list/reply/status
**Media** `POST /media/upload/{document,image,avatar,multiple}` · `DELETE /media/delete` (S3)
**Admin** settings · form fields · categories · CMS · onboarding · FAQs · plans

## Notes
- Redis is optional — without it the app still runs (sessions/logout-all just won't be enforced server-side).
- Media `/media/*` uses S3; profile/doc/resume uploads use local disk (`/uploads`) via sharp. Pick one or wire S3 everywhere.
- Set real `TWILIO_*` to actually send OTP SMS; in `development` the OTP is logged + returned in the response.

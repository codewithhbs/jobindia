# Job India — Full Platform (v2)

```
job-india-platform/
├── backend/         Node.js + Express + MongoDB (unified API + Razorpay payments)
├── job-india-app/   Expo + React Native app (jobseeker / employer / driver)
└── admin-panel/     React + Vite + Tailwind admin console (role-based)
```

## What's new in v2
- **Razorpay payments end-to-end** — backend `/payments/create-order` + `/payments/verify`
  (HMAC signature check) that **activates the employer subscription**; mobile Plans screen now
  does create-order → checkout → verify. Works without keys too (dev mock order).
- **Admin panel rounded out** — added Onboarding (with image upload), FAQs, CMS pages, and a
  Plans editor on top of Dashboard / Users / Employers / KYC / Jobs / Categories / Broadcast / Support / Settings.

## Quick start
1. **Backend**
   ```bash
   cd backend && cp .env.example .env   # set MONGODB_URI, JWT_SECRET; RAZORPAY_* optional
   npm install && npm run seed && npm run dev      # https://jobapi.adsdigitalmedia.com
   ```
2. **Admin panel**
   ```bash
   cd admin-panel && npm install && npm run dev    # http://localhost:5173 (proxies /api -> :4000)
   ```
   Login with seeded superadmin `+919999999999` (dev OTP returned by backend).
3. **Mobile app**
   ```bash
   cd job-india-app && npm install
   # app.json -> extra.apiUrl (Android emu: http://10.0.2.2:4000/api/v1)
   # add google-services.json + assets icons
   npx expo prebuild && npx expo run:android
   ```
## Roles
`jobseeker · employer · driver · admin · superadmin`. Mobile switches whole stack by role;
admin panel gates routes by role (Plans & Settings are superadmin-only).

Each folder has its own README. All three talk to the same backend under `/api/v1` with
phone-OTP auth + transparent token refresh.

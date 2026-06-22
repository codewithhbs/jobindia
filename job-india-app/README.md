# Job India — Expo / React Native App

Multi-role job marketplace app (WorkIndia / Apna / Job Hai style) wired to the unified
Node.js backend. Built with Expo, React Navigation, Zustand, a single axios instance with
transparent token-refresh, secure token storage, and Expo + Firebase push notifications.

## Roles handled
- **Job Seeker** — browse/search jobs, apply, save, applications, dashboard, profile + resume.
- **Employer** — dashboard, post jobs, view applicants (move status / reject), company profile.
- **Driver** — profile, vehicle + KYC document uploads, availability toggle, browse driver jobs.
- **Admin/Superadmin** — falls back to the seeker UI in-app (full admin panel is web-side).

The root navigator switches the entire stack based on `auth state + role` automatically.

## Architecture
```
src/
├── api/          axios client (auto refresh) + one module per backend domain
│                 client.js · auth · user · jobs · jobseeker · employer · driver · kyc · notifications · support · admin
├── constants/    theme.js (your colour scheme) · config.js (API_URL, roles, enums)
├── store/        authStore.js (Zustand + expo-secure-store)
├── services/     storage.js (secure tokens) · notifications.js (push register + sync)
├── hooks/        useFetch · useLocation
├── components/   ui/ (Button, Input, Card, Badge, Avatar, Chip, Header, Screen, Loader, EmptyState)
│                 cards/ (JobCard, ApplicationCard)
├── navigation/   RootNavigator + Auth/JobSeeker/Employer/Driver navigators
├── screens/      auth/ · jobseeker/ · employer/ · driver/ · common/
└── utils/        toast · format · validators
App.js            providers (gesture handler, safe area, toast, status bar)
```

## Security
- Access + refresh tokens stored in **expo-secure-store** (encrypted keystore/keychain), never AsyncStorage.
- Axios request interceptor attaches the bearer token; response interceptor performs a **transparent
  refresh** on 401 with a request queue, and force-logs-out if the refresh fails.
- No secrets in source — API URL comes from `app.json -> expo.extra.apiUrl` or `EXPO_PUBLIC_API_URL`.

## Setup
```bash
npm install        # or: yarn

# 1) point the app at your backend (default targets Android emulator -> host localhost:4000)
#    edit app.json -> expo.extra.apiUrl, or set EXPO_PUBLIC_API_URL
#    Android emulator:  http://10.0.2.2:4000/api/v1
#    iOS simulator:     https://jobapi.adsdigitalmedia.com/api/v1
#    real device:       http://<your-LAN-ip>:4000/api/v1

# 2) Firebase (push): download google-services.json from Firebase Console
#    and place it in the project root (template provided: google-services.json.example)

# 3) assets: drop your icons into ./assets (see assets/README.txt)

npx expo prebuild           # generates native projects (firebase needs a dev build)
npx expo run:android        # or run:ios
# JS-only iteration after a dev build:
npm start
```
> This app uses native modules (`@react-native-firebase`, `react-native-maps`, `react-native-razorpay`),
> so it needs a **dev client / prebuild** — it won't run in plain Expo Go.

## Notifications flow
On successful OTP login the app calls `registerForPushNotifications()` which asks permission,
gets the Expo push token + device info, and syncs them to the backend (`PUT /users/me/profile`).
The backend's `notification.service` then targets this device. Tapping a notification routes to
the in-app Notifications screen.

## Backend endpoints used
Matches the unified backend exactly under `/api/v1`: `auth`, `users`, `jobseekers`, `employers`,
`drivers`, `jobs`, `kyc`, `notifications`, `support`, `admin`. See `src/api/*` for the full map.

## Notes
- Test login: in `development` the backend returns the OTP in the response — the app shows it as a
  toast for convenience. Test numbers (from backend `.env` `OTP_TEST_NUMBERS`) always use `123456`.
- Razorpay / Maps are installed and permitted via app.json but screens for them are left as
  extension points (subscription purchase / job map view) — hook them where marked.

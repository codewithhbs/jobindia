# Job India — Admin Panel (React + Vite + Tailwind)

Role-based admin console for the Job India backend. Login via **admin OTP**
(`/auth/send-otp-admin` + `/auth/verify-otp-admin`). Two roles:
- **admin** — Dashboard, Users, Employers, KYC, Jobs, Categories, Broadcast, Support
- **superadmin** — everything above **plus** Plans & App Settings

Role gating is enforced both in the sidebar (`NAV[].roles`) and on the routes
(`<ProtectedRoute roles={['superadmin']}>`).

## Stack
React 18 · Vite · Tailwind · React Router · Zustand · axios (with transparent
token-refresh) · react-hot-toast · lucide-react.

## Structure
```
src/
├── lib/        axios.js (instance + refresh + token store) · api.js (endpoint map)
├── store/      auth.js (zustand)
├── components/ Layout.jsx (sidebar + ProtectedRoute) · ui.jsx (Table, Modal, Badge, StatCard...)
├── pages/      Login · Dashboard · Users · Employers · Kyc · Jobs · Categories · Broadcast · Support · Plans · Settings
├── App.jsx     routes + role gates
└── main.jsx
```

## Run
```bash
npm install
# dev proxies /api -> http://localhost:4000 (see vite.config.js), so just run the backend too
npm run dev      # http://localhost:5173
```
Login with the seeded superadmin number (backend seed: `+919999999999`). In
development the backend returns the OTP in the response / logs.

## Production
Set `VITE_API_URL` to your backend URL, then `npm run build` (outputs to `dist/`).
Make sure the backend `superadmin` user exists (run `npm run seed` in the backend).

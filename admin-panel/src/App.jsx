import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Employers from './pages/Employers';
import Kyc from './pages/Kyc';
import Jobs from './pages/Jobs';
import Categories from './pages/Categories';
import Broadcast from './pages/Broadcast';
import Support from './pages/Support';
import Plans from './pages/Plans';
import Onboarding from './pages/Onboarding';
import Faqs from './pages/Faqs';
import Cms from './pages/Cms';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Authenticated area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="employers" element={<Employers />} />
          <Route path="kyc" element={<Kyc />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="categories" element={<Categories />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="support" element={<Support />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="cms" element={<Cms />} />

          {/* Superadmin-only */}
          <Route element={<ProtectedRoute roles={['superadmin']} />}>
            <Route path="plans" element={<Plans />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

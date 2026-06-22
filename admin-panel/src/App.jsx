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
import Analytics from './pages/Analytics';
import Candidates from './pages/Candidates';
import JobForm from './pages/JobForm';
import EmployerDetail from './pages/EmployerDetail';
import JobseekerDetail from './pages/JobseekerDetail';
import Settings from './pages/Settings';
import AllHomeSliders from './pages/AllHomeSliders';
import CreateAndUpdateSliders from './pages/CreateAndUpdateSliders';
import UserDetailDriver from './pages/UserDetailDriver';
import UserDetailJobseeker from './pages/UserDetailJobseeker';
import JobDetail from './pages/JobDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Authenticated area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<Users />} />

          <Route path="/users/jobseeker/:id" element={<UserDetailJobseeker />} />
          <Route path="/users/:id" element={<UserDetailDriver />} /> {/* driver + others fallback */}
          <Route path="employers" element={<Employers />} />
          <Route path="employers/:userId" element={<EmployerDetail />} />
          <Route path="kyc" element={<Kyc />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/new" element={<JobForm />} />
          <Route path="jobs/:id/edit" element={<JobForm />} />
          <Route path="jobs/:id/view" element={<JobDetail />} />

          <Route path="categories" element={<Categories />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="support" element={<Support />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="cms" element={<Cms />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:userId" element={<JobseekerDetail />} />
          <Route path="home-sliders" element={<AllHomeSliders />} />
          <Route path="home-sliders/create" element={<CreateAndUpdateSliders />} />
          <Route path="home-sliders/edit/:id" element={<CreateAndUpdateSliders />} />



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

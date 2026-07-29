import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppLayout } from "@/components/layout/app-layout";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import NotFoundPage from "@/pages/not-found";

import UsersPage from "@/pages/users/users-list";
import UserDetailPage from "@/pages/users/user-detail";

import JobseekersPage from "@/pages/jobseekers/jobseekers-list";
import JobseekerDetailPage from "@/pages/jobseekers/jobseeker-detail";

import EmployersPage from "@/pages/employers/employers-list";
import EmployerDetailPage from "@/pages/employers/employer-detail";

import DriversPage from "@/pages/drivers/drivers-list";

import KycPage from "@/pages/kyc/kyc-page";

import JobsPage from "@/pages/jobs/jobs-list";
import JobDetailPage from "@/pages/jobs/job-detail";
import JobFormPage from "@/pages/jobs/job-form";

import DriverDetailPage from "@/pages/drivers/driver-detail";

import CategoriesPage from "@/pages/categories/categories-page";
import CmsPagesPage from "@/pages/cms/cms-pages";
import OnboardingPage from "@/pages/onboarding/onboarding-page";
import FaqsPage from "@/pages/faqs/faqs-page";
import SlidersPage from "@/pages/sliders/sliders-page";

import PlansPage from "@/pages/plans/plans-page";
import PaymentsPage from "@/pages/payments/payments-page";

import SettingsPage from "@/pages/settings/settings-page";
import FormFieldsPage from "@/pages/form-fields/form-fields-page";
import RoleOptionsPage from "@/pages/role-options/role-options-page";

import NotificationsPage from "@/pages/notifications/notifications-page";
import SupportPage from "@/pages/support/support-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />

              <Route path="/jobseekers" element={<JobseekersPage />} />
              <Route path="/jobseekers/:id" element={<JobseekerDetailPage />} />

              <Route path="/employers" element={<EmployersPage />} />
              <Route path="/employers/:id" element={<EmployerDetailPage />} />

              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/drivers/:id" element={<DriverDetailPage />} />

              <Route path="/kyc" element={<KycPage />} />

              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/new" element={<JobFormPage />} />
              <Route path="/jobs/:id/edit" element={<JobFormPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />

              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/cms" element={<CmsPagesPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/faqs" element={<FaqsPage />} />
              <Route path="/sliders" element={<SlidersPage />} />

              <Route path="/plans" element={<PlansPage />} />
              <Route path="/payments" element={<PaymentsPage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/form-fields" element={<FormFieldsPage />} />
              <Route path="/role-options" element={<RoleOptionsPage />} />

              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

export default App;

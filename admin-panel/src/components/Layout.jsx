import React from 'react';
import { NavLink, useNavigate, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, ShieldCheck, Briefcase, Tags,
  Megaphone, LifeBuoy, Settings, CreditCard, LogOut, Images, HelpCircle, FileText, BarChart3, UserSearch,
  ImageUpscale,
} from 'lucide-react';
import { useAuth } from '../store/auth';

// roles: undefined = any authenticated; array = only those roles
export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/employers', label: 'Employers', icon: Building2 },
  { to: '/kyc', label: 'KYC Review', icon: ShieldCheck },
  { to: '/candidates', label: 'Candidates', icon: UserSearch },
  { to: '/home-sliders', label: 'Sliders', icon: ImageUpscale },

  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/broadcast', label: 'Broadcast', icon: Megaphone },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/onboarding', label: 'Onboarding', icon: Images },
  { to: '/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/cms', label: 'CMS Pages', icon: FileText },
  { to: '/plans', label: 'Plans', icon: CreditCard, roles: ['superadmin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['superadmin'] },
];

function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((n) => hasRole(n.roles));

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-6 py-5">
        <h1 className="text-xl font-extrabold text-primary">Job India</h1>
        <p className="text-xs text-muted">Admin Console</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-primary text-white' : 'text-muted hover:bg-primary-light hover:text-primary'
              }`
            }
          >
            <n.icon size={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-semibold">{user?.name || 'Admin'}</p>
          <p className="text-xs text-muted capitalize">{user?.role}</p>
        </div>
        <button
          onClick={async () => { await logout(); navigate('/login'); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-rose-50"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

export function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Route guard: requires auth, optionally a role.
export function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(roles)) return <Navigate to="/" replace />;
  return children || <Outlet />;
}

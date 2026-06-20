import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, ShieldCheck, Briefcase, Tags,
  Megaphone, LifeBuoy, Settings, CreditCard, LogOut, Images, HelpCircle,
  FileText, BarChart3, UserSearch, ImageUpscale, Menu, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../store/auth';

// roles: undefined = any authenticated; array = only those roles
// items: optional array → if present, this becomes a collapsible dropdown group
export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/employers', label: 'Employers', icon: Building2 },
  { to: '/kyc', label: 'KYC Review', icon: ShieldCheck },
  { to: '/candidates', label: 'Candidates', icon: UserSearch },

  {
    label: 'Content',
    icon: Images,
    items: [
      { to: '/home-sliders', label: 'Sliders', icon: ImageUpscale },
      { to: '/onboarding', label: 'Onboarding', icon: Images },
      { to: '/cms', label: 'CMS Pages', icon: FileText },
      { to: '/faqs', label: 'FAQs', icon: HelpCircle },
    ],
  },

  {
    label: 'Hiring',
    icon: Briefcase,
    items: [
      { to: '/jobs', label: 'All Jobs', icon: Briefcase },
      { to: '/jobs?showonly-employer=true', label: 'Employer Jobs', icon: Briefcase },
      {
        to: '/jobs?showonly-employer=true&status=paused',
        label: 'Jobs Pending Verification',
        icon: Briefcase,
      },
      { to: '/categories', label: 'Job Categories', icon: Tags },
    ],
  },

  { to: '/broadcast', label: 'Broadcast', icon: Megaphone },
  { to: '/support', label: 'Support', icon: LifeBuoy },

  {
    label: 'Settings',
    icon: Settings,
    roles: ['superadmin'],
    items: [
      { to: '/plans', label: 'Plans', icon: CreditCard, roles: ['superadmin'] },
      { to: '/settings', label: 'General', icon: Settings, roles: ['superadmin'] },
    ],
  },
];

function NavItem({ item, onNavigate }) {
  const location = useLocation();
  const fullPath = location.pathname + location.search;
  const isActive = item.end
    ? location.pathname === item.to
    : fullPath === item.to || (!item.to.includes('?') && location.pathname === item.to);

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-primary text-white' : 'text-muted hover:bg-primary-light hover:text-primary'
        }`}
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  );
}
function NavGroup({ group, onNavigate }) {
  const location = useLocation();
  const fullPath = location.pathname + location.search;
  const { hasRole } = useAuth();
  const visibleItems = group.items.filter((i) => hasRole(i.roles));
  const groupActive = visibleItems.some((i) =>
    i.to.includes('?') ? fullPath === i.to : location.pathname === i.to
  );
  const [open, setOpen] = useState(groupActive);

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${groupActive ? 'bg-primary-light text-primary' : 'text-muted hover:bg-primary-light hover:text-primary'
          }`}
      >
        <group.icon size={18} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-hidden transition-all ${open ? 'mt-1 max-h-96' : 'max-h-0'}`}>
        <div className="ml-4 space-y-1 border-l border-line pl-3">
          {visibleItems.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const visibleNav = NAV.filter((n) => hasRole(n.roles));

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-5">
        <h1 className="text-xl font-extrabold text-primary">Job India</h1>
        <p className="text-xs text-muted">Admin Console</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {visibleNav.map((n) =>
          n.items ? (
            <NavGroup key={n.label} group={n} onNavigate={onNavigate} />
          ) : (
            <NavItem key={n.to} item={n} onNavigate={onNavigate} />
          )
        )}
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
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  );
}

function MobileSidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-4 rounded-lg p-2 text-muted hover:bg-primary-light hover:text-primary"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}

function TopBar({ onMenuClick }) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted hover:bg-primary-light hover:text-primary"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-extrabold text-primary">Job India</h1>
    </header>
  );
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
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
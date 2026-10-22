import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, ExternalLink, KeyRound, LayoutDashboard, ListChecks, LogOut, Menu, PhoneIncoming, Users, X } from 'lucide-react';
import ChangePasswordModal from '../components/admin/ChangePasswordModal.jsx';
import { RequireAuth } from '../components/admin/RouteGuards.jsx';
import Logo from '../components/public/Logo.jsx';
import { ROLE_LABELS, useAuth } from '../context/AuthContext.jsx';

const STAFF = ['receptionist']; // reception (super admin always passes)
const ALL = ['doctor', 'receptionist'];

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true, roles: ALL },
  { to: '/admin/appointments', label: 'Appointments', Icon: CalendarDays, roles: ALL },
  { to: '/admin/patients', label: 'Patients', Icon: Users, roles: ALL },
  { to: '/admin/leads', label: 'Leads', Icon: PhoneIncoming, roles: STAFF },
  { to: '/admin/follow-ups', label: 'Follow-ups', Icon: ListChecks, roles: ALL },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

function Sidebar({ onNavigate, onChangePassword }) {
  const { user, signOut } = useAuth();
  const items = NAV.filter((item) => user.role === 'super_admin' || item.roles.includes(user.role));

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Logo />
        <p className="mt-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Clinic CRM</p>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={linkClasses}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-100 p-3">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          View website
        </a>
        <button type="button" onClick={onChangePassword} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Change password
        </button>
        <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const [drawer, setDrawer] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:shadow-lg">
        Skip to content
      </a>

      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen print:hidden">
        <Sidebar onNavigate={() => {}} onChangePassword={() => setPasswordOpen(true)} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden print:hidden">
        <Logo />
        <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-full text-slate-700 hover:bg-slate-100">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-2xl">
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} onChangePassword={() => { setDrawer(false); setPasswordOpen(true); }} />
          </div>
        </div>
      )}

      <main id="admin-main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
        <Outlet />
      </main>

      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}

export default function AdminLayout() {
  return (
    <RequireAuth>
      <Shell />
    </RequireAuth>
  );
}

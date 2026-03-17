import { Bell, Search, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = (user?.name || user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 flex items-center justify-between gap-6 border-b border-slate-200 bg-white px-8 shadow-xs">

      {/* ── Page title ──────────────────────────────────── */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold text-slate-900 leading-none tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-slate-400 font-medium mt-1 leading-none truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right controls ──────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Global search */}
        <div className={cn(
          'relative hidden lg:flex items-center h-10 rounded-lg border bg-slate-50 transition-all duration-150',
          searchFocused
            ? 'w-72 border-blue-400 bg-white ring-2 ring-blue-100'
            : 'w-56 border-slate-200 hover:border-slate-300'
        )}>
          <Search className={cn(
            'absolute left-3 h-4 w-4 transition-colors pointer-events-none',
            searchFocused ? 'text-blue-500' : 'text-slate-400'
          )} />
          <input
            type="text"
            placeholder="Search equipment, vendors..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="h-full w-full bg-transparent pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {searchFocused && (
            <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Page-level actions slot */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Notification bell */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-150 shadow-xs">
          <Bell className="h-4 w-4" />
          {/* Active dot */}
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
        </button>

        {/* User chip */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(p => !p)}
            className="flex items-center gap-2.5 h-10 pl-1 pr-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 shadow-xs"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-slate-800 leading-none">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5 leading-none">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'vendor' ? 'Supplier' : 'Procurement Manager'}
              </p>
            </div>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform duration-150 hidden sm:block',
              userMenuOpen ? 'rotate-180' : ''
            )} />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-md">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{user?.name || user?.email}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/vendor/profile'); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

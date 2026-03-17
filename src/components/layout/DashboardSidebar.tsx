import {
  LayoutDashboard, Package, Users, FileText,
  BarChart3, Settings, Building2, ShoppingCart, LogOut, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | null;
}

interface DashboardSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function DashboardSidebar({ currentView, onNavigate }: DashboardSidebarProps) {
  const { user, logout } = useAuth();

  const { data: rfqs = [] } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfqs'); return data; },
    staleTime: 30_000,
  });
  const openRfqs = (rfqs.filter((r: any) => r.status === 'open').length) || null;

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard',       path: 'dashboard'  },
    { icon: Package,         label: 'Equipment',       path: 'equipment'  },
    { icon: Users,           label: 'Vendors',         path: 'vendors'    },
    { icon: FileText,        label: 'RFQ & Bids',      path: 'rfq',       badge: openRfqs },
    { icon: ShoppingCart,    label: 'Purchase Orders', path: 'orders'     },
    { icon: BarChart3,       label: 'Reports',         path: 'reports'    },
    { icon: Settings,        label: 'Settings',        path: 'settings'   },
  ];

  const initials = (user?.name || user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const roleLabel =
    user?.role === 'admin'  ? 'Admin Console'  :
    user?.role === 'vendor' ? 'Supplier Portal' : 'Client Portal';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-white border-r border-slate-200 flex flex-col">

      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-slate-100">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
          <Building2 className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-slate-900 leading-none tracking-tight">VendorHub</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-none">{roleLabel}</p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const isActive = currentView === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                'group relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />
              )}

              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                )} />
                <span className={cn(
                  'text-[13.5px] font-medium tracking-tight transition-colors',
                  isActive ? 'font-semibold' : ''
                )}>
                  {item.label}
                </span>
              </div>

              {/* Badge */}
              {item.badge != null && item.badge > 0 && (
                <span className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                )}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User card ─────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors duration-150 cursor-default">

          {/* Avatar with online dot */}
          <div className="relative shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
              <span className="text-xs font-bold text-blue-700">{initials}</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate leading-none">
              {user?.name || user?.email}
            </p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5 leading-none">
              {user?.role || 'user'}
            </p>
          </div>

          {/* Logout — appears on group hover */}
          <button
            onClick={logout}
            title="Log out"
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}

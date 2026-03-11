import {
  LayoutDashboard, Package, Users, FileText,
  BarChart3, Settings, Building2, ChevronRight, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
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
  const { user } = useAuth();

  // Live open-RFQ count for badge
  const { data: rfqs = [] } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfqs'); return data; },
    staleTime: 30_000,
  });
  const openRfqs = rfqs.filter((r: any) => r.status === 'open').length || null;

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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass border-r-0 ring-1 ring-white/10 overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-25">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/15 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-blue-400/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 flex h-full flex-col">

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 shadow-lg shadow-amber-400/20 shrink-0">
            <Building2 className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-foreground">VendorHub</h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 leading-none">
              {user?.role === 'admin' ? 'Admin Console' : user?.role === 'vendor' ? 'Vendor Portal' : 'Client Portal'}
            </p>
          </div>
        </div>

        {/* ── Nav ───────────────────────────────────────────────────────────── */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item, idx) => {
            const isActive = currentView === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 animate-reveal',
                  isActive
                    ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Active left bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-400 rounded-r-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                )}

                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    'h-4.5 w-4.5 transition-all duration-200',
                    isActive ? 'text-amber-400 scale-110' : 'opacity-50 group-hover:opacity-80 group-hover:scale-105'
                  )} />
                  <span className="tracking-tight text-[13px]">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge != null && item.badge > 0 && (
                    <span className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black',
                      isActive
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-white/10 text-muted-foreground/60'
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-amber-400/60" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* ── User card ─────────────────────────────────────────────────────── */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-all p-3 cursor-default group">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/30 to-orange-400/20 border border-amber-400/20 group-hover:scale-105 transition-transform duration-300">
                <span className="text-xs font-black text-amber-300">{initials}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-none">
                {user?.name || user?.email}
              </p>
              <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/40 mt-0.5 leading-none capitalize">
                {user?.role || 'Client'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}

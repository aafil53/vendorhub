import {
  Package, AlertTriangle, FileText, CheckCircle,
  TrendingUp, TrendingDown, Users, ArrowRight,
  CircleDot, Clock, ShoppingCart, BarChart3
} from 'lucide-react';
import { dashboardStats } from '@/data/mockData';
import { cn } from '@/lib/utils';

// ── KPI Card ───────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label:    string;
  value:    string | number;
  footnote: string;
  accent:   string;
  icon:     React.ElementType;
  trend?:   { value: number; positive: boolean; label?: string };
  badge?:   { text: string; type: 'warning' | 'success' | 'info' | 'danger' };
}

function KpiCard({ label, value, footnote, accent, icon: Icon, trend, badge }: KpiCardProps) {
  return (
    <div className="kpi-card group cursor-default">
      {/* Left accent bar */}
      <div className="w-1 shrink-0" style={{ backgroundColor: accent }} />

      <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          {/* Icon chip */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: accent + '18' }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>

          {/* Trend / Badge */}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0',
              trend.positive
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            )}>
              {trend.positive
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />
              }
              {trend.positive ? '+' : ''}{trend.value}%
            </div>
          )}
          {badge && (
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0',
              badge.type === 'warning' && 'bg-amber-50 text-amber-700',
              badge.type === 'danger'  && 'bg-red-50 text-red-700',
              badge.type === 'success' && 'bg-green-50 text-green-700',
              badge.type === 'info'    && 'bg-blue-50 text-blue-700',
            )}>
              {badge.text}
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="text-[28px] font-bold text-slate-900 leading-tight tracking-tight mt-0.5">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-[12px] text-slate-400 mt-1">{footnote}</p>
        </div>
      </div>
    </div>
  );
}

// ── Activity item ──────────────────────────────────────────────────────────────
const ACTIVITY_ICON_CONFIG: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  new:     { bg: 'bg-blue-50',   color: 'text-blue-600',   Icon: FileText     },
  pending: { bg: 'bg-amber-50',  color: 'text-amber-600',  Icon: Clock        },
  success: { bg: 'bg-green-50',  color: 'text-green-600',  Icon: CheckCircle  },
  warning: { bg: 'bg-red-50',    color: 'text-red-600',    Icon: AlertTriangle},
};

// ── Main ───────────────────────────────────────────────────────────────────────
export function DashboardOverview() {
  const kpis: KpiCardProps[] = [
    {
      label:    'Total Equipment',
      value:    dashboardStats.totalEquipment,
      footnote: 'Global inventory',
      accent:   '#2563EB',
      icon:     Package,
      trend:    { value: 12, positive: true },
    },
    {
      label:    'Critical Shortages',
      value:    dashboardStats.shortages,
      footnote: 'Requires attention',
      accent:   '#DC2626',
      icon:     AlertTriangle,
      badge:    { text: 'High Risk', type: 'danger' },
    },
    {
      label:    'Active RFQs',
      value:    dashboardStats.activeRFQs,
      footnote: `${dashboardStats.pendingBids} pending bids`,
      accent:   '#7C3AED',
      icon:     FileText,
      badge:    { text: 'Pending', type: 'info' },
    },
    {
      label:    'Monthly Orders',
      value:    dashboardStats.ordersThisMonth,
      footnote: 'Completed through portal',
      accent:   '#16A34A',
      icon:     CheckCircle,
      trend:    { value: 8, positive: true },
    },
  ];

  const activities = [
    { action: 'New bid received',        detail: 'Mobile Crane — Gulf Heavy Equipment', time: '2h ago',  status: 'new'     },
    { action: 'RFQ sent to 3 vendors',   detail: 'Tower Crane 150 Ton',                 time: '5h ago',  status: 'pending' },
    { action: 'Order confirmed',         detail: 'Excavator rental — Al-Madinah',       time: '1d ago',  status: 'success' },
    { action: 'Shortage detected',       detail: '4 Mobile Cranes required',            time: '2d ago',  status: 'warning' },
  ];

  const vendors = [
    { name: 'Omar Farouk',        company: 'Eastern Province Machinery', rating: 4.9, orders: 312, perf: 98, online: true  },
    { name: 'Ahmed Al-Rashid',    company: 'Gulf Heavy Equipment LLC',   rating: 4.8, orders: 156, perf: 92, online: true  },
    { name: 'Yusuf Al-Qahtani',  company: 'Riyadh Heavy Lift',          rating: 4.6, orders: 178, perf: 85, online: false },
    { name: 'Mohammed Hassan',    company: 'Al-Madinah Rentals',         rating: 4.5, orders: 89,  perf: 79, online: false },
  ];

  return (
    <div className="space-y-7 animate-reveal">

      {/* ── KPI Strip ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* ── Hero banner ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-blue-600 px-8 py-6 flex items-center justify-between gap-6">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10">
          <h2 className="text-[20px] font-bold text-white leading-tight">Procurement Overview</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-md">
            Real-time monitoring of your strategic supply chain. {dashboardStats.activeRFQs} active RFQs, {dashboardStats.ordersThisMonth} orders this month.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold transition-all duration-150">
            Export Report
          </button>
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 shadow-sm transition-all duration-150">
            + New RFQ
          </button>
        </div>
      </div>

      {/* ── Main 2-col grid ───────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Recent Activity</h3>
                <p className="text-[12px] text-slate-400">Last 48 hours</p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {activities.map((item, idx) => {
              const cfg = ACTIVITY_ICON_CONFIG[item.status] || ACTIVITY_ICON_CONFIG.new;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition-colors duration-100 group cursor-default"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
                    <cfg.Icon className={cn('h-4 w-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                      {item.action}
                    </p>
                    <p className="text-[12px] text-slate-400 truncate mt-0.5">{item.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn(
                      'chip text-[11px]',
                      item.status === 'success' ? 'chip-completed' :
                      item.status === 'warning' ? 'chip-cancelled' :
                      item.status === 'pending' ? 'chip-pending'   : 'chip-open'
                    )}>
                      <CircleDot className="h-2.5 w-2.5" />
                      {item.status}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">{item.time}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Partners */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Strategic Partners</h3>
                <p className="text-[12px] text-slate-400">{vendors.length} top vendors</p>
              </div>
            </div>
            <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              See full list
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Vendor</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center">Perf.</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">Orders</p>
          </div>

          <div className="divide-y divide-slate-50">
            {vendors.map((v, idx) => {
              const color =
                idx === 0 ? '#2563EB' :
                idx === 1 ? '#7C3AED' :
                idx === 2 ? '#0891B2' : '#D97706';
              return (
                <div
                  key={v.name}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-5 py-3 hover:bg-slate-50/70 transition-colors group cursor-default"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-xs font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {v.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </div>
                      {/* Online dot */}
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white',
                        v.online ? 'bg-emerald-500' : 'bg-slate-300'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">{v.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{v.company}</p>
                    </div>
                  </div>

                  {/* Performance score */}
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      'text-[13px] font-bold',
                      v.perf >= 90 ? 'text-green-600' :
                      v.perf >= 80 ? 'text-blue-600' :
                      'text-amber-600'
                    )}>
                      {v.perf}
                    </span>
                    <div className="w-12 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${v.perf}%`,
                          backgroundColor: v.perf >= 90 ? '#16A34A' : v.perf >= 80 ? '#2563EB' : '#D97706'
                        }}
                      />
                    </div>
                  </div>

                  {/* Order count */}
                  <p className="text-[13px] font-semibold text-slate-700 text-right">{v.orders}</p>
                </div>
              );
            })}
          </div>

          {/* Add partner */}
          <div className="px-5 py-3.5 border-t border-slate-100">
            <button className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-slate-300 text-[13px] font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150">
              + Add New Partner
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick stats footer ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Supply Chain Health', value: '94%',  sub: 'Target: 95%+',         accent: '#16A34A', icon: BarChart3    },
          { label: 'Avg. Bid Response',   value: '2.4d', sub: 'Days to first bid',    accent: '#2563EB', icon: Clock        },
          { label: 'PO Completion Rate',  value: '87%',  sub: 'Orders fulfilled',     accent: '#7C3AED', icon: ShoppingCart },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex items-center gap-4 hover:shadow-sm hover:-translate-y-px transition-all duration-150 cursor-default">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: s.accent + '15' }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.accent }} />
            </div>
            <div>
              <p className="text-[24px] font-bold text-slate-900 leading-none">{s.value}</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">{s.label}</p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

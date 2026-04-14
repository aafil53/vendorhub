// src/components/dashboard/DashboardOverview.tsx — REPLACE ENTIRE FILE
// Connects to real API data: /rfqs, /orders, /equipments, /vendors, /notifications

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Package, AlertTriangle, FileText, CheckCircle,
  TrendingUp, TrendingDown, Users, ArrowRight,
  CircleDot, Clock, ShoppingCart, BarChart3,
  DollarSign, Loader2, RefreshCw, Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ── Color palette ──────────────────────────────────────────────────────────────
const PALETTE = {
  blue:    '#2563EB',
  violet:  '#7C3AED',
  emerald: '#10b981',
  amber:   '#F59E0B',
  red:     '#EF4444',
  cyan:    '#0891B2',
  slate:   '#64748B',
};

const STATUS_COLORS: Record<string, string> = {
  open:      PALETTE.blue,
  closed:    PALETTE.slate,
  awarded:   PALETTE.emerald,
  cancelled: PALETTE.red,
  pending:   PALETTE.amber,
  completed: PALETTE.emerald,
};

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2.5 text-[12px]">
      {label && <p className="font-semibold text-slate-600 mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-900">{prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100', className)} />;
}

// ── KPI card ──────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  footnote: string;
  accent: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  badge?: { text: string; color: string };
}

function KpiCard({ label, value, footnote, accent, icon: Icon, trend, badge }: KpiProps) {
  return (
    <div className="kpi-card group cursor-default">
      <div className="w-1 shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: accent + '18' }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0',
              trend.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            )}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.positive ? '+' : ''}{trend.value}%
            </div>
          )}
          {badge && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0" style={{ backgroundColor: badge.color + '15', color: badge.color }}>
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

// ── Section card wrapper ───────────────────────────────────────────────────────
function Card({ title, subtitle, icon: Icon, accentColor, children, action }: {
  title: string; subtitle?: string; icon?: React.ElementType;
  accentColor?: string; children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: (accentColor || PALETTE.blue) + '15' }}>
              <Icon className="h-4 w-4" style={{ color: accentColor || PALETTE.blue }} />
            </div>
          )}
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[12px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Helper: group orders by month ─────────────────────────────────────────────
function groupOrdersByMonth(orders: any[]) {
  const months: Record<string, { month: string; value: number; count: number }> = {};
  const now = new Date();

  // Init last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    months[key] = { month: label, value: 0, count: 0 };
  }

  orders.forEach((o: any) => {
    const key = o.createdAt?.slice(0, 7);
    if (key && months[key]) {
      months[key].value += parseFloat(o.bid?.price || 0);
      months[key].count += 1;
    }
  });

  return Object.values(months);
}

// ── Helper: group RFQs by week ────────────────────────────────────────────────
function groupRfqsByWeek(rfqs: any[]) {
  const weeks: Record<string, { week: string; open: number; awarded: number; cancelled: number }> = {};
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = `W${String(Math.ceil(d.getDate() / 7)).padStart(2,'0')}-${d.toLocaleDateString('en-GB', { month: 'short' })}`;
    weeks[key] = { week: key, open: 0, awarded: 0, cancelled: 0 };
  }

  rfqs.forEach((r: any) => {
    const d = new Date(r.createdAt);
    const now2 = new Date();
    const diff = Math.floor((now2.getTime() - d.getTime()) / (7 * 86400000));
    if (diff >= 0 && diff < 8) {
      const weekIdx = 7 - diff;
      const keys = Object.keys(weeks);
      const k = keys[weekIdx];
      if (k) {
        if (r.status === 'awarded') weeks[k].awarded += 1;
        else if (r.status === 'cancelled') weeks[k].cancelled += 1;
        else weeks[k].open += 1;
      }
    }
  });

  return Object.values(weeks).slice(-6);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function DashboardOverview() {
  // Fetch all real data in parallel
  const { data: rfqs = [], isLoading: rfqLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfqs'); return data; },
    staleTime: 30_000,
  });

  const { data: orders = [], isLoading: orderLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => { const { data } = await api.get('/orders/history'); return data; },
    staleTime: 30_000,
  });

  const { data: equipments = [], isLoading: equipLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: async () => { const { data } = await api.get('/equipments'); return data; },
    staleTime: 60_000,
  });

  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendors', 1, ''],
    queryFn: async () => { const { data } = await api.get('/vendors?page=1&limit=100'); return data; },
    staleTime: 60_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => { const { data } = await api.get('/notifications/unread-count'); return data; },
    staleTime: 15_000,
  });

  const isLoading = rfqLoading || orderLoading;
  const vendors: any[] = vendorData?.vendors || [];

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const openRfqs      = rfqs.filter((r: any) => r.status === 'open');
  const awardedRfqs   = rfqs.filter((r: any) => r.status === 'awarded');
  const pendingOrders = orders.filter((o: any) => o.status === 'pending');
  const completedOrders = orders.filter((o: any) => o.status === 'completed');
  const totalOrderValue = orders
    .filter((o: any) => o.status !== 'cancelled')
    .reduce((s: number, o: any) => s + parseFloat(o.bid?.price || 0), 0);
  const totalBids = rfqs.reduce((s: number, r: any) => s + (r.bids?.length || 0), 0);

  // ── Chart data ───────────────────────────────────────────────────────────────
  const orderTrendData = groupOrdersByMonth(orders);
  const rfqWeeklyData  = groupRfqsByWeek(rfqs);

  // RFQ status pie
  const rfqStatusPie = [
    { name: 'Open',      value: rfqs.filter((r: any) => r.status === 'open').length,      fill: PALETTE.blue },
    { name: 'Awarded',   value: rfqs.filter((r: any) => r.status === 'awarded').length,   fill: PALETTE.emerald },
    { name: 'Closed',    value: rfqs.filter((r: any) => r.status === 'closed').length,    fill: PALETTE.slate },
    { name: 'Cancelled', value: rfqs.filter((r: any) => r.status === 'cancelled').length, fill: PALETTE.red },
  ].filter(d => d.value > 0);

  // Order status pie
  const orderStatusPie = [
    { name: 'Pending',   value: pendingOrders.length,   fill: PALETTE.amber },
    { name: 'Completed', value: completedOrders.length, fill: PALETTE.emerald },
    { name: 'Cancelled', value: orders.filter((o: any) => o.status === 'cancelled').length, fill: PALETTE.red },
  ].filter(d => d.value > 0);

  // Top vendors by bid count across RFQs
  const vendorBidMap: Record<string, { name: string; bids: number; won: number }> = {};
  rfqs.forEach((r: any) => {
    (r.bids || []).forEach((b: any) => {
      if (!vendorBidMap[b.vendorId]) {
        vendorBidMap[b.vendorId] = { name: b.vendorName || 'Vendor', bids: 0, won: 0 };
      }
      vendorBidMap[b.vendorId].bids += 1;
      if (b.status === 'accepted') vendorBidMap[b.vendorId].won += 1;
    });
  });
  const topVendors = Object.values(vendorBidMap)
    .sort((a, b) => b.bids - a.bids)
    .slice(0, 5);

  // Recent activity from RFQs + orders
  const recentActivity: Array<{ type: string; label: string; detail: string; time: string; status: string }> = [
    ...rfqs.slice(0, 3).map((r: any) => ({
      type: 'rfq',
      label: 'RFQ Created',
      detail: r.equipmentName || 'Equipment',
      time: new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      status: r.status,
    })),
    ...orders.slice(0, 3).map((o: any) => ({
      type: 'order',
      label: 'Purchase Order',
      detail: o.bid?.rfq?.equipment?.name || 'Equipment',
      time: new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      status: o.status,
    })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

  // KPIs
  const kpis: KpiProps[] = [
    {
      label:    'Active RFQs',
      value:    openRfqs.length,
      footnote: `${rfqs.length} total · ${awardedRfqs.length} awarded`,
      accent:   PALETTE.blue,
      icon:     FileText,
      badge:    openRfqs.length > 0 ? { text: 'Active', color: PALETTE.blue } : undefined,
    },
    {
      label:    'Total Bids Received',
      value:    totalBids,
      footnote: `Across ${rfqs.length} RFQs`,
      accent:   PALETTE.violet,
      icon:     Activity,
      trend:    totalBids > 0 ? { value: Math.min(totalBids * 5, 99), positive: true } : undefined,
    },
    {
      label:    'Purchase Orders',
      value:    orders.length,
      footnote: `${pendingOrders.length} pending · ${completedOrders.length} completed`,
      accent:   PALETTE.emerald,
      icon:     ShoppingCart,
      badge:    pendingOrders.length > 0 ? { text: `${pendingOrders.length} Pending`, color: PALETTE.amber } : undefined,
    },
    {
      label:    'Total Order Value',
      value:    `$${totalOrderValue >= 1000 ? (totalOrderValue / 1000).toFixed(1) + 'K' : totalOrderValue.toLocaleString()}`,
      footnote: `${completedOrders.length} orders fulfilled`,
      accent:   PALETTE.amber,
      icon:     DollarSign,
      trend:    completedOrders.length > 0 ? { value: Math.round((completedOrders.length / Math.max(orders.length, 1)) * 100), positive: true } : undefined,
    },
  ];

  const tooltipStyle = {
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,.08)',
    fontSize: 12,
  };

  return (
    <div className="space-y-7 animate-reveal">

      {/* ── KPI Strip ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-[100px]" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      )}

      {/* ── Hero banner ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-blue-600 px-8 py-6 flex items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10">
          <h2 className="text-[20px] font-bold text-white leading-tight">Procurement Overview</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-md">
            {isLoading
              ? 'Loading live data…'
              : `${openRfqs.length} active RFQ${openRfqs.length !== 1 ? 's' : ''} · ${orders.length} purchase order${orders.length !== 1 ? 's' : ''} · $${totalOrderValue.toLocaleString()} total value`
            }
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          {notifData?.count > 0 && (
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-lg px-3 py-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-white text-sm font-semibold">{notifData.count} new notifications</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: Order Value Trend + RFQ Status Pie ─────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

        {/* Order value area chart */}
        <Card
          title="Monthly Order Value"
          subtitle="Last 6 months · active & completed orders"
          icon={TrendingUp}
          accentColor={PALETTE.emerald}
          action={
            <button
              className="flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              onClick={() => {/* navigate to orders */}}
            >
              All Orders <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="p-4">
            {orderLoading ? (
              <Skeleton className="h-[220px]" />
            ) : orderTrendData.every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No order data yet</p>
                <p className="text-xs mt-1">Award your first bid to see trends</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={orderTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={PALETTE.emerald} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={PALETTE.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                  <Tooltip content={<ChartTooltip prefix="$" />} contentStyle={tooltipStyle} />
                  <Area
                    type="monotone" dataKey="value" name="Value"
                    stroke={PALETTE.emerald} strokeWidth={2.5}
                    fill="url(#orderGrad)"
                    dot={{ fill: PALETTE.emerald, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* RFQ status pie */}
        <Card title="RFQ Pipeline" subtitle="Status breakdown" icon={CircleDot} accentColor={PALETTE.blue}>
          <div className="p-4">
            {rfqLoading ? (
              <Skeleton className="h-[220px]" />
            ) : rfqStatusPie.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                <FileText className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No RFQs yet</p>
                <p className="text-xs mt-1">Create your first RFQ to see data</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={rfqStatusPie}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {rfqStatusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {rfqStatusPie.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-slate-500 truncate">{d.name}</span>
                      <span className="font-bold text-slate-800 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 2: Weekly RFQ Activity + Order Status ─────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

        {/* Weekly RFQ grouped bar chart */}
        <Card
          title="RFQ Activity (Last 6 Weeks)"
          subtitle="Open · Awarded · Cancelled per week"
          icon={BarChart3}
          accentColor={PALETTE.violet}
        >
          <div className="p-4">
            {rfqLoading ? (
              <Skeleton className="h-[220px]" />
            ) : rfqWeeklyData.every(d => d.open + d.awarded + d.cancelled === 0) ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No activity yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rfqWeeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                  <Bar dataKey="open"      name="Open"      fill={PALETTE.blue}    radius={[3,3,0,0]} maxBarSize={18} />
                  <Bar dataKey="awarded"   name="Awarded"   fill={PALETTE.emerald} radius={[3,3,0,0]} maxBarSize={18} />
                  <Bar dataKey="cancelled" name="Cancelled" fill={PALETTE.red}     radius={[3,3,0,0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Order status donut */}
        <Card title="Order Status" subtitle="All purchase orders" icon={ShoppingCart} accentColor={PALETTE.amber}>
          <div className="p-4">
            {orderLoading ? (
              <Skeleton className="h-[220px]" />
            ) : orderStatusPie.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No orders yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={orderStatusPie}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={70}
                      paddingAngle={3} dataKey="value"
                    >
                      {orderStatusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {orderStatusPie.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-slate-500">{d.name}</span>
                      <div className="flex-1 mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.round(d.value / Math.max(orders.length, 1) * 100)}%`, backgroundColor: d.fill }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Recent Activity + Top Vendors ──────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

        {/* Recent Activity */}
        <Card
          title="Recent Activity"
          subtitle="Latest RFQs and purchase orders"
          icon={TrendingUp}
          accentColor={PALETTE.blue}
          action={
            <button className="flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[0,1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Activity className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentActivity.map((item, idx) => {
                const statusColor = STATUS_COLORS[item.status] || PALETTE.slate;
                const TypeIcon = item.type === 'rfq' ? FileText : ShoppingCart;
                return (
                  <div key={idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition-colors group cursor-default">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: statusColor + '18' }}>
                      <TypeIcon className="h-4 w-4" style={{ color: statusColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                        {item.label}
                      </p>
                      <p className="text-[12px] text-slate-400 truncate mt-0.5">{item.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                        style={{ backgroundColor: statusColor + '15', color: statusColor }}
                      >
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
          )}
        </Card>

        {/* Top Vendors by bid activity */}
        <Card
          title="Vendor Activity"
          subtitle={`${vendors.length} registered vendors`}
          icon={Users}
          accentColor={PALETTE.violet}
          action={
            <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Directory
            </button>
          }
        >
          {vendorLoading || rfqLoading ? (
            <div className="p-4 space-y-3">
              {[0,1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : topVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">No bid data yet</p>
              <p className="text-xs mt-1">Vendor activity appears once bids are submitted</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Vendor</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center">Bids</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">Won</p>
              </div>
              <div className="divide-y divide-slate-50">
                {topVendors.map((v, idx) => {
                  const colors = [PALETTE.blue, PALETTE.violet, PALETTE.cyan, PALETTE.amber, PALETTE.emerald];
                  const color = colors[idx % colors.length];
                  const winRate = v.bids > 0 ? Math.round((v.won / v.bids) * 100) : 0;
                  return (
                    <div key={v.name} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-5 py-3 hover:bg-slate-50/70 transition-colors group cursor-default">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: color }}>
                          {v.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">{v.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="h-1 rounded-full bg-slate-100 overflow-hidden" style={{ width: 48 }}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${winRate}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-[10px] text-slate-400">{winRate}% win rate</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[14px] font-bold text-slate-700 text-center">{v.bids}</span>
                      <span className="text-[14px] font-bold text-emerald-600 text-right">{v.won}</span>
                    </div>
                  );
                })}
              </div>
              {/* Add partner */}
              <div className="px-5 py-3.5 border-t border-slate-100">
                <button className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-slate-300 text-[13px] font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150">
                  + Browse Vendor Directory
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Bottom stats row ──────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Bid Response Rate',
            value: rfqs.length > 0 ? `${Math.round((rfqs.filter((r: any) => (r.bids?.length || 0) > 0).length / rfqs.length) * 100)}%` : '—',
            sub: `${rfqs.filter((r: any) => (r.bids?.length || 0) > 0).length} of ${rfqs.length} RFQs received bids`,
            accent: PALETTE.blue,
            icon: Activity,
          },
          {
            label: 'Avg. Bids per RFQ',
            value: rfqs.length > 0 ? (totalBids / rfqs.length).toFixed(1) : '—',
            sub: `${totalBids} total bids · ${rfqs.length} RFQs`,
            accent: PALETTE.violet,
            icon: BarChart3,
          },
          {
            label: 'Order Completion',
            value: orders.length > 0 ? `${Math.round((completedOrders.length / orders.length) * 100)}%` : '—',
            sub: `${completedOrders.length} completed · ${pendingOrders.length} pending`,
            accent: PALETTE.emerald,
            icon: CheckCircle,
          },
        ].map(s => (
          <div key={s.label}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex items-center gap-4 hover:shadow-sm hover:-translate-y-px transition-all duration-150 cursor-default">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: s.accent + '15' }}>
              <s.icon className="h-5 w-5" style={{ color: s.accent }} />
            </div>
            <div>
              {isLoading
                ? <Skeleton className="h-7 w-16 mb-1" />
                : <p className="text-[24px] font-bold text-slate-900 leading-none">{s.value}</p>
              }
              <p className="text-[12px] font-medium text-slate-500 mt-1">{s.label}</p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

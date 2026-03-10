import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types (mirror backend response shape exactly) ─────────────────────────────
interface Totals {
  totalClients: number;
  totalVendors: number;
  totalRFQs: number;
  totalBids: number;
  totalOrders: number;
  totalOrderValue: number;
}

interface AdminStats {
  totals: Totals;
  rfqsByWeek: { label: string; count: number }[];
  bidStatus: { status: string; count: number }[];
  topVendors: { vendor: string; orderCount: number; totalValue: number }[];
  rfqFunnel: { status: string; count: number }[];
  orderTrend: { month: string; value: number }[];
  recentActivity: { action: string; actor: string; ts: string }[];
  orderStatus: { status: string; count: number }[];
}

// ── Color maps keyed to your exact ENUM values ────────────────────────────────
const BID_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#10b981",
  rejected: "#ef4444",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const RFQ_STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  closed: "#94a3b8",
  awarded: "#10b981",
  cancelled: "#ef4444",
};

const BAR_PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

const ACTIVITY_ICONS: Record<string, string> = {
  "RFQ Created": "📋",
  "Bid Submitted": "💬",
  "Order Created": "📦",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

function timeAgo(ts: string | null | undefined): string {
  if (!ts) return "unknown";
  const diff = Date.now() - new Date(ts).getTime();
  if (isNaN(diff)) return "unknown";
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function coerce(arr: { count: number | string }[]) {
  return arr.map(r => ({ ...r, count: Number(r.count) }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: string;
  accentClass: string; // tailwind bg color class for left border
}

function KpiCard({ title, value, sub, icon, accentClass }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border border-slate-100 shadow-sm bg-white">
      {/* Left accent bar */}
      <div className={`absolute inset-y-0 left-0 w-[3px] ${accentClass}`} />
      <CardContent className="pt-5 pb-4 pl-6 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest truncate">
              {title}
            </p>
            <p className="text-[28px] font-bold text-slate-900 leading-tight mt-0.5">
              {value}
            </p>
            {sub && (
              <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
            )}
          </div>
          <span className="text-xl opacity-50 flex-shrink-0 mt-0.5">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] gap-2">
      <span className="text-4xl opacity-20">📊</span>
      <p className="text-xs text-slate-400 text-center max-w-[200px]">{label}</p>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="w-full h-[220px] rounded-lg" />;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 4px 24px rgba(0,0,0,.08)",
  fontSize: 12,
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3"><ChartSkeleton /></div>
        <div className="lg:col-span-2"><ChartSkeleton /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3"><ChartSkeleton /></div>
        <div className="lg:col-span-2"><ChartSkeleton /></div>
      </div>
    </div>
  );

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3 max-w-sm">
        <p className="text-3xl">⚠️</p>
        <p className="font-semibold text-slate-800">{error}</p>
        <p className="text-sm text-slate-400">
          Make sure you're logged in as admin and the backend is running on port 5000.
        </p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!stats) return null;

  const { totals, rfqsByWeek, bidStatus, topVendors, rfqFunnel, orderTrend, recentActivity, orderStatus } = stats;

  // Normalize count fields to numbers (MySQL sometimes returns strings)
  const weekData = coerce(rfqsByWeek) as { label: string; count: number }[];
  const bidPieData = bidStatus.map(r => ({ name: r.status, value: Number(r.count) }));
  const funnelData = coerce(rfqFunnel) as { status: string; count: number }[];
  const trendData = orderTrend.map(r => ({ ...r, value: Number(r.value) }));
  const vendorData = topVendors.map(r => ({ ...r, totalValue: Number(r.totalValue), orderCount: Number(r.orderCount) }));
  const orderPie = orderStatus.map(r => ({ name: r.status, value: Number(r.count) }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-7">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Admin Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs"
            >
              ● Live
            </Badge>
            <button
              onClick={fetchStats}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="Clients" value={Number(totals.totalClients)} icon="🏢" accentClass="bg-blue-500" />
          <KpiCard title="Vendors" value={Number(totals.totalVendors)} icon="🔧" accentClass="bg-violet-500" />
          <KpiCard title="RFQs" value={Number(totals.totalRFQs)} icon="📋" accentClass="bg-amber-500" />
          <KpiCard title="Bids" value={Number(totals.totalBids)} icon="💬" accentClass="bg-cyan-500" />
          <KpiCard title="Orders" value={Number(totals.totalOrders)} icon="📦" accentClass="bg-emerald-500" />
          <KpiCard
            title="Total Value"
            value={fmt(Number(totals.totalOrderValue))}
            sub="from active orders"
            icon="💰"
            accentClass="bg-rose-500"
          />
        </div>

        {/* ── Row 1: RFQs per Week + Bid Status Pie ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* RFQs Per Week — Bar */}
          <Card className="lg:col-span-3 border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">
                RFQs Per Week
                <span className="text-xs font-normal text-slate-400 ml-2">last 8 weeks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {weekData.length === 0
                ? <EmptyState label="No RFQs yet. Create your first RFQ to see this chart." />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weekData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="count" name="RFQs" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>

          {/* Bid Status Pie */}
          <Card className="lg:col-span-2 border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">Bid Status</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {bidPieData.length === 0
                ? <EmptyState label="No bids submitted yet." />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={bidPieData}
                        cx="50%" cy="42%"
                        innerRadius={52} outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {bidPieData.map(entry => (
                          <Cell key={entry.name} fill={BID_STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend
                        iconType="circle" iconSize={8}
                        formatter={v => <span className="text-xs capitalize text-slate-600">{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2: Order Value Trend + RFQ Funnel ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Monthly Order Value — Area */}
          <Card className="lg:col-span-3 border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Monthly Order Value
                <span className="text-xs font-normal text-slate-400 ml-2">last 6 months</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {trendData.length === 0
                ? <EmptyState label="No orders yet. Award a bid to start tracking value." />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(v: number) => [fmt(v), "Order Value"]}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Area
                        type="monotone" dataKey="value"
                        stroke="#10b981" strokeWidth={2}
                        fill="url(#valueGrad)"
                        dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>

          {/* RFQ Pipeline Funnel — Horizontal Bar */}
          <Card className="lg:col-span-2 border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">RFQ Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {funnelData.length === 0
                ? <EmptyState label="No RFQ pipeline data yet." />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={funnelData}
                      margin={{ top: 4, right: 16, left: 12, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="count" name="RFQs" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {funnelData.map(entry => (
                          <Cell key={entry.status} fill={RFQ_STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Top Vendors + Order Status + Activity Feed ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Top Vendors — Bar */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">Top Vendors</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {vendorData.length === 0 || vendorData.every(v => v.totalValue === 0)
                ? <EmptyState label="No orders awarded yet." />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={vendorData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="vendor" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(v: number) => [fmt(v), "Total Value"]}
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Bar dataKey="totalValue" name="Order Value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {vendorData.map((_, i) => (
                          <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>

          {/* Order Status — Pie */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {orderPie.length === 0
                ? <EmptyState label="No orders yet." />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={orderPie}
                        cx="50%" cy="42%"
                        innerRadius={52} outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {orderPie.map(entry => (
                          <Cell key={entry.name} fill={ORDER_STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend
                        iconType="circle" iconSize={8}
                        formatter={v => <span className="text-xs capitalize text-slate-600">{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {recentActivity.length === 0
                ? <EmptyState label="No activity yet. Run through the demo flow to populate this." />
                : (
                  <ul className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {recentActivity.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="text-base flex-shrink-0 leading-none">
                          {ACTIVITY_ICONS[item.action] ?? "🔔"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {item.action}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            by {item.actor}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                          {timeAgo(item.ts)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}

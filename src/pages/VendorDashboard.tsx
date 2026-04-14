import { useAuth } from '@/contexts/AuthContext'
import {
  ClipboardList, Send, CheckCircle, Clock, Target, Award,
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle,
  FileText, BarChart3, CircleDot, Loader2, DollarSign,
  Zap
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { BidSubmissionModal } from '@/components/bidding/BidSubmissionModal'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100', className)} />
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2.5 text-[12px]">
      {label && <p className="font-semibold text-slate-600 mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-900">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Helper: group bids by month ───────────────────────────────────────────────
function groupBidsByMonth(rfqs: any[]) {
  const months: Record<string, { month: string; submitted: number; accepted: number; revenue: number }> = {}
  const now = new Date()

  // Init last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    months[key] = { month: label, submitted: 0, accepted: 0, revenue: 0 }
  }

  rfqs.forEach((r: any) => {
    const bid = r.myBid
    if (!bid) return
    const key = r.createdAt?.slice(0, 7)
    if (key && months[key]) {
      months[key].submitted += 1
      if (bid.status === 'accepted') {
        months[key].accepted += 1
        months[key].revenue += parseFloat(bid.price || 0)
      }
    }
  })

  return Object.values(months)
}

// ── KPI Card (matching client portal pattern) ──────────────────────────────────
interface KpiCardProps {
  label: string
  value: string | number
  footnote: string
  accent: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  badge?: { text: string; type: 'warning' | 'success' | 'info' | 'danger' }
}

function KpiCard({ label, value, footnote, accent, icon: Icon, trend, badge }: KpiCardProps) {
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
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0',
              badge.type === 'warning' && 'bg-amber-50 text-amber-700',
              badge.type === 'danger' && 'bg-red-50 text-red-700',
              badge.type === 'success' && 'bg-green-50 text-green-700',
              badge.type === 'info' && 'bg-blue-50 text-blue-700',
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
  )
}

// ── Activity icon config ───────────────────────────────────────────────────────
const ACTIVITY_ICON_CONFIG: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  new:     { bg: 'bg-blue-50',   color: 'text-blue-600',   Icon: FileText },
  pending: { bg: 'bg-amber-50',  color: 'text-amber-600',  Icon: Clock },
  success: { bg: 'bg-green-50',  color: 'text-green-600',  Icon: CheckCircle },
  warning: { bg: 'bg-red-50',    color: 'text-red-600',    Icon: AlertTriangle },
}

interface UserProfile {
  companyName: string; phone: string; experienceYears: number
  rating: number; ordersCount: number; categories: string[]; certifications: string[]
}

export default function VendorDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const token = localStorage.getItem('token')
  const { socket } = useSocket()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedRfq, setSelectedRfq] = useState<any>(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setProfile).catch(() => {
      // Fallback demo profile when backend is unavailable
      setProfile({
        companyName: user?.name || 'Demo Vendor',
        phone: '+966 50 123 4567',
        experienceYears: 8,
        rating: 4.7,
        ordersCount: 156,
        categories: ['Cranes', 'Excavators', 'Forklifts'],
        certifications: ['ARAMCO', 'Third-Party'],
      })
    })
  }, [token])

  // Fetch all vendor RFQs
  const { data: vendorRfqs = [], isLoading: rfqLoading } = useQuery({
    queryKey: ['vendor-rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfq/vendor-rfqs'); return data },
    staleTime: 30_000,
  })

  // Fetch all orders to find ones based on my bids
  const { data: orders = [], isLoading: orderLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => { const { data } = await api.get('/orders/history'); return data },
    staleTime: 30_000,
  })

  // Fetch notifications for unread count
  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => { const { data } = await api.get('/notifications/unread-count'); return data },
    staleTime: 15_000,
  })

  useEffect(() => {
    if (!socket) return
    const onNewRfq = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })
      toast.success('New RFQ arrived!')
    }
    const onOrderCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })
      toast.success('🎉 A purchase order was placed on your bid!')
    }
    socket.on('notification:new', onNewRfq)
    socket.on('order:created', onOrderCreated)
    return () => {
      socket.off('notification:new', onNewRfq)
      socket.off('order:created', onOrderCreated)
    }
  }, [socket, queryClient])

  const openRfqs = vendorRfqs.length
  const pendingBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'pending').length
  const acceptedBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'accepted').length
  const rejectedBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'rejected').length
  const expiredBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'expired').length
  
  const bidSuccessRate = openRfqs > 0 ? Math.round((acceptedBids / openRfqs) * 100) : 0
  
  // Calculate total earned from accepted bids (orders)
  const totalEarned = orders
    .filter((o: any) => o.vendorId === user?.id && o.status !== 'cancelled')
    .reduce((sum: number, o: any) => sum + parseFloat(o.bid?.price || 0), 0)
  
  // Pending invoices (orders not yet paid)
  const pendingInvoices = orders
    .filter((o: any) => o.vendorId === user?.id && o.status === 'completed')
    .reduce((sum: number, o: any) => sum + parseFloat(o.bid?.price || 0), 0)
  
  // Order completion rate
  const completedOrders = orders.filter((o: any) => o.vendorId === user?.id && o.status === 'completed').length
  const totalMyOrders = orders.filter((o: any) => o.vendorId === user?.id).length
  const completionRate = totalMyOrders > 0 ? Math.round((completedOrders / totalMyOrders) * 100) : 0

  // ── Loading state and chart data ────────────────────────────────────────────
  const isLoading = rfqLoading || orderLoading
  
  const bidAnalyticsData = groupBidsByMonth(vendorRfqs)
  
  const bidStatusData = [
    { name: 'Accepted', value: acceptedBids, fill: '#16A34A' },
    { name: 'Pending', value: pendingBids, fill: '#7C3AED' },
    { name: 'Rejected', value: rejectedBids, fill: '#EF4444' },
    { name: 'Expired', value: expiredBids, fill: '#94A3B8' },
  ].filter(d => d.value > 0)
  
  const tooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  }

  const completion = profile ? Math.min(
    [profile.companyName && 20, profile.phone && 15,
    (profile.categories?.length > 0) && 20, profile.rating > 0 && 15,
    (profile.certifications?.length > 0) && 15, profile.experienceYears > 0 && 15]
      .filter(Boolean).reduce((a: number, b: any) => a + b, 0), 100) : 0

  const openBidModal = (rfq: any) => {
    setSelectedRfq(rfq)
    setBidModalOpen(true)
  }

  // ── KPI data ─────────────────────────────────────────────────────────────────
  const kpis: KpiCardProps[] = [
    {
      label: 'Open RFQs',
      value: openRfqs,
      footnote: 'Awaiting your bid',
      accent: '#2563EB',
      icon: ClipboardList,
      trend: acceptedBids > 0 ? { value: Math.round((acceptedBids / Math.max(openRfqs, 1)) * 100), positive: true } : undefined,
    },
    {
      label: 'Active Bids',
      value: pendingBids,
      footnote: 'Sent to clients',
      accent: '#7C3AED',
      icon: Send,
      badge: pendingBids > 0 ? { text: 'Pending', type: 'info' } : undefined,
    },
    {
      label: 'Accepted Bids',
      value: acceptedBids,
      footnote: 'Orders confirmed',
      accent: '#16A34A',
      icon: CheckCircle,
      trend: acceptedBids > 0 ? { value: Math.min(acceptedBids * 10, 99), positive: true } : undefined,
    },
    {
      label: 'Success Rate',
      value: `${bidSuccessRate}%`,
      footnote: 'Out of submitted bids',
      accent: '#0891B2',
      icon: Target,
    },
  ]

  // ── Activity feed ────────────────────────────────────────────────────────────
  const recentActivity = [
    ...vendorRfqs.slice(0, 2).map((rfq: any) => ({
      action: 'RFQ Received',
      detail: rfq.title || 'New RFQ',
      time: rfq.createdAt || new Date().toISOString(),
      status: rfq.myBid?.status || 'new',
    })),
    ...orders.filter((o: any) => o.vendorId === user?.id).slice(0, 2).map((order: any) => ({
      action: 'Order Update',
      detail: order.title || 'Order ' + order.id,
      time: order.updatedAt || order.createdAt || new Date().toISOString(),
      status: order.status,
    })),
  ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())

  const activities = recentActivity.map((item) => ({
    action: item.action,
    detail: item.detail,
    time: item.time,
    status: item.status === 'accepted' ? 'success' : item.status === 'pending' ? 'pending' : item.status === 'rejected' ? 'warning' : 'new',
  }))

  // ── Performance metrics ──────────────────────────────────────────────────────
  const performanceMetrics = [
    { label: 'Bid Success Rate', value: bidSuccessRate, color: '#16A34A' },
    { label: 'Order Completion', value: completionRate, color: '#2563EB' },
    { label: 'Average Rating', value: Math.round(((profile?.rating || 0) / 5) * 100), color: '#D97706', display: `${profile?.rating || 0}/5.0` },
  ]

  return (
    <div className="space-y-7 animate-reveal">

      {/* ── KPI Strip ─────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-[100px]" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      )}

      {/* ── Hero banner ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-primary px-8 py-6 flex items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10">
          <h2 className="text-[20px] font-bold text-primary-foreground leading-tight">Bid & Quote Overview</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-md">
            {isLoading
              ? 'Loading live data…'
              : `You have ${openRfqs} active RFQ${openRfqs !== 1 ? 's' : ''}, ${acceptedBids} accepted bid${acceptedBids !== 1 ? 's' : ''}, and a ${bidSuccessRate}% success rate.`
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
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold transition-all duration-150">
            Export Report
          </button>
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 shadow-sm transition-all duration-150">
            View All RFQs
          </button>
        </div>
      </div>

      {/* ── Charts Section ─────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

        {/* Monthly Bid Analytics — Area Chart */}
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Bid Analytics</h3>
                <p className="text-[12px] text-slate-400">Monthly overview — last 6 months</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {rfqLoading ? (
              <Skeleton className="h-[260px]" />
            ) : bidAnalyticsData.every(d => d.submitted === 0 && d.accepted === 0) ? (
              <div className="flex flex-col items-center justify-center h-[260px] text-slate-400">
                <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No bid data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={bidAnalyticsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAccepted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="submitted" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradSubmitted)" name="Submitted" />
                  <Area type="monotone" dataKey="accepted" stroke="#16A34A" strokeWidth={2.5} fill="url(#gradAccepted)" name="Accepted" />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '12px' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bid Status Breakdown — Donut Chart */}
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Target className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Bid Status</h3>
                <p className="text-[12px] text-slate-400">All-time breakdown</p>
              </div>
            </div>
          </div>
          <div className="p-5 flex flex-col items-center">
            {rfqLoading ? (
              <Skeleton className="h-[180px]" />
            ) : bidStatusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[180px] text-slate-400">
                <Target className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No bids yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={bidStatusData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {bidStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full">
                  {bidStatusData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-[12px] text-slate-500 flex-1">{item.name}</span>
                      <span className="text-[12px] font-bold text-slate-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main 2-col grid ───────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
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
              const cfg = ACTIVITY_ICON_CONFIG[item.status] || ACTIVITY_ICON_CONFIG.new
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
                      item.status === 'pending' ? 'chip-pending' : 'chip-open'
                    )}>
                      <CircleDot className="h-2.5 w-2.5" />
                      {item.status}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">{item.time}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right sidebar: Performance + Profile */}
        <div className="space-y-5">

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">Performance</h3>
                  <p className="text-[12px] text-slate-400">This month</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {performanceMetrics.map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-slate-600">{m.label}</span>
                    <span className="text-[13px] font-bold" style={{ color: m.color }}>
                      {m.display || `${m.value}%`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${m.value}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-xl border border-border shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">Profile Completion</h3>
              <span className={cn(
                'text-[11px] font-bold px-2 py-0.5 rounded-full',
                completion >= 80 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              )}>
                {completion >= 80 ? '✓ Complete' : 'In Progress'}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[24px] font-bold text-slate-900">{completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-50">
              {[
                { label: 'Total Orders', value: profile?.ordersCount || 0, icon: ClipboardList, accent: '#2563EB' },
                { label: 'Vendor Rating', value: `${profile?.rating || 0}⭐`, icon: Award, accent: '#D97706' },
                { label: 'Categories', value: profile?.categories?.length || 0, icon: FileText, accent: '#7C3AED' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors cursor-default">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: s.accent + '15' }}
                  >
                    <s.icon className="h-4 w-4" style={{ color: s.accent }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] text-slate-400">{s.label}</p>
                  </div>
                  <p className="text-[15px] font-bold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats footer ─────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Avg. Response Time', value: '1.8d', sub: 'Days to first bid', accent: '#2563EB', icon: Clock },
          { label: 'Total Earned',       value: `$${totalEarned >= 1000 ? (totalEarned / 1000).toFixed(1) + 'K' : totalEarned.toLocaleString()}`, sub: 'From accepted bids',     accent: '#16A34A', icon: DollarSign },
          { label: 'Pending Invoices',   value: `$${pendingInvoices >= 1000 ? (pendingInvoices / 1000).toFixed(1) + 'K' : pendingInvoices.toLocaleString()}`,    sub: 'Completed orders',       accent: '#7C3AED', icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border shadow-xs p-5 flex items-center gap-4 hover:shadow-sm hover:-translate-y-px transition-all duration-150 cursor-default">
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

      {selectedRfq && (
        <BidSubmissionModal
          isOpen={bidModalOpen}
          onClose={() => { setBidModalOpen(false); setSelectedRfq(null); queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] }) }}
          rfq={selectedRfq}
        />
      )}
    </div>
  )
}

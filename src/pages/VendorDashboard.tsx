import { useAuth } from '@/contexts/AuthContext'
import {
  ClipboardList, Send, CheckCircle, Clock, Target, Award,
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle,
  FileText, BarChart3, CircleDot, Loader2, DollarSign
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { BidSubmissionModal } from '@/components/bidding/BidSubmissionModal'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'

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
  }, [])

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
  }, [socket])

  const { data: vendorRfqs = [] } = useQuery({
    queryKey: ['vendor-rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfq/vendor-rfqs'); return data },
  })

  if (!profile) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Loading your dashboard…</p>
      </div>
    </div>
  )

  const openRfqs = vendorRfqs.length
  const pendingBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'pending').length
  const acceptedBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'accepted').length
  const bidSuccessRate = openRfqs > 0 ? Math.round((acceptedBids / openRfqs) * 100) : 0

  const completion = Math.min(
    [profile.companyName && 20, profile.phone && 15,
    (profile.categories?.length > 0) && 20, profile.rating > 0 && 15,
    (profile.certifications?.length > 0) && 15, profile.experienceYears > 0 && 15]
      .filter(Boolean).reduce((a: number, b: any) => a + b, 0), 100)

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
      trend: { value: 12, positive: true },
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
      trend: { value: 8, positive: true },
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
  const activities = [
    { action: 'New RFQ received',       detail: 'Cranes required for construction project',    time: '2h ago',  status: 'new' },
    { action: 'Bid accepted',           detail: 'Excavator rental approved by client',         time: '5h ago',  status: 'success' },
    { action: 'RFQ expires soon',       detail: 'Tower Crane 150 Ton — 2 hours remaining',    time: '22h ago', status: 'warning' },
    { action: 'Bid submitted',          detail: 'Mobile Crane — Gulf Construction',            time: '1d ago',  status: 'pending' },
  ]

  // ── Performance metrics ──────────────────────────────────────────────────────
  const performanceMetrics = [
    { label: 'Bid Success Rate', value: bidSuccessRate, color: '#16A34A' },
    { label: 'Order Completion', value: 85, color: '#2563EB' },
    { label: 'Average Rating', value: Math.round((profile.rating / 5) * 100), color: '#D97706', display: `${profile.rating}/5.0` },
  ]

  return (
    <div className="space-y-7 animate-reveal">

      {/* ── KPI Strip ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* ── Hero banner ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-primary px-8 py-6 flex items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10">
          <h2 className="text-[20px] font-bold text-primary-foreground leading-tight">Bid & Quote Overview</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-md">
            You have {openRfqs} active RFQs, {acceptedBids} accepted bids, and a {bidSuccessRate}% success rate this month.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold transition-all duration-150">
            Export Report
          </button>
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 shadow-sm transition-all duration-150">
            View All RFQs
          </button>
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
                { label: 'Total Orders', value: profile.ordersCount || 0, icon: ClipboardList, accent: '#2563EB' },
                { label: 'Vendor Rating', value: `${profile.rating}⭐`, icon: Award, accent: '#D97706' },
                { label: 'Categories', value: profile.categories?.length || 0, icon: FileText, accent: '#7C3AED' },
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
          { label: 'Total Earned',       value: '$24.5K', sub: 'This quarter',     accent: '#16A34A', icon: DollarSign },
          { label: 'Pending Invoices',   value: '$0',    sub: 'All settled',       accent: '#7C3AED', icon: BarChart3 },
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

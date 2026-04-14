import { useAuth } from '@/contexts/AuthContext'
import {
  TrendingUp, TrendingDown, ClipboardList, Send, Clock, CheckCircle2, Loader2,
  AlertTriangle, ChevronRight, ArrowUpRight, ArrowDownRight, Eye, Zap,
  BarChart3, Award, Briefcase, DollarSign, Users, FileText, Target
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { BidSubmissionModal } from '@/components/bidding/BidSubmissionModal'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'
import { StatCard } from '@/components/dashboard/StatCard'

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(deadline: string | null | undefined) {
  const getRemaining = useCallback(() => {
    if (!deadline) return null
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    return {
      expired: false,
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
      total: diff,
    }
  }, [deadline])

  const [remaining, setRemaining] = useState(getRemaining)
  useEffect(() => {
    if (!deadline) return
    setRemaining(getRemaining())
    const id = setInterval(() => setRemaining(getRemaining()), 1_000)
    return () => clearInterval(id)
  }, [deadline, getRemaining])
  return remaining
}

function CountdownBadge({ deadline }: { deadline: string | null | undefined }) {
  const r = useCountdown(deadline)
  if (!deadline || !r) return null
  if (r.expired) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
      <AlertTriangle className="h-2.5 w-2.5" /> Expired
    </span>
  )
  const isUrgent = r.total < 3_600_000
  const isWarning = r.total < 86_400_000
  const label = r.days > 0 ? `${r.days}d ${r.hours}h` : r.hours > 0 ? `${r.hours}h ${r.minutes}m` : `${r.minutes}m`
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold',
      isUrgent ? 'bg-red-50 border-red-100 text-red-600' :
        isWarning ? 'bg-amber-50 border-amber-100 text-amber-600' :
          'bg-emerald-50 border-emerald-100 text-emerald-600'
    )}>
      <Clock className="h-2.5 w-2.5" />{label} left
    </span>
  )
}

interface UserProfile {
  companyName: string; phone: string; experienceYears: number
  rating: number; ordersCount: number; categories: string[]; certifications: string[]
}

const BID_STATUS: Record<string, { text: string; dot: string; bg: string }> = {
  accepted: { text: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
  rejected: { text: 'text-red-700', dot: 'bg-red-500', bg: 'bg-red-50' },
  pending: { text: 'text-amber-700', dot: 'bg-amber-500', bg: 'bg-amber-50' },
}

const CATEGORY_ICONS: Record<string, string> = {
  Excavators: '🚜', Cranes: '🏗️', Forklifts: '🚛', 'Drilling Rigs': '⚙️',
  Bulldozers: '🚧', 'Piling Equipment': '🔩', 'Dump Trucks': '🚚',
  'Concrete Pumps': '🧱', Lifting: '🏗️', Earthmoving: '🚜', Transport: '🚚',
  'Power/Gen': '⚡', Compressors: '💨',
}

export default function VendorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = localStorage.getItem('token')
  const { socket, connected } = useSocket()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedRfq, setSelectedRfq] = useState<any>(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setProfile).catch(() => { })
  }, [])

  useEffect(() => {
    if (!socket) return
    const onNewRfq = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
      toast.success('New RFQ arrived!', { action: { label: 'View', onClick: () => setIsInboxOpen(true) } })
    }
    const onOrderCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })
      toast.success('🎉 A purchase order was placed on your bid!')
    }
    const onRfqExpired = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
      toast.warning(data?.message || 'An RFQ has expired.', { duration: 6000 })
    }
    socket.on('notification:new', onNewRfq)
    socket.on('order:created', onOrderCreated)
    socket.on('rfq:expired', onRfqExpired)
    return () => {
      socket.off('notification:new', onNewRfq)
      socket.off('order:created', onOrderCreated)
      socket.off('rfq:expired', onRfqExpired)
    }
  }, [socket])

  const { data: vendorRfqs = [], isLoading: rfqLoading } = useQuery({
    queryKey: ['vendor-rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfq/vendor-rfqs'); return data },
  })

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => { const { data } = await api.get('/notifications/unread-count'); return data },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notif-count'] }),
  })

  const acceptRfq = useMutation({
    mutationFn: (id: number) => api.post(`/rfq/${id}/accept`),
    onSuccess: () => { toast.success('RFQ Accepted'); queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] }) },
    onError: (err: any) => toast.error(err?.message || 'Failed to accept RFQ'),
  })

  const unreadCount: number = notifData?.count || 0

  if (!profile) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <p className="text-sm font-semibold text-slate-600">Loading your dashboard…</p>
      </div>
    </div>
  )

  const completion = Math.min(
    [profile.companyName && 20, profile.phone && 15,
    (profile.categories?.length > 0) && 20, profile.rating > 0 && 15,
    (profile.certifications?.length > 0) && 15, profile.experienceYears > 0 && 15]
      .filter(Boolean).reduce((a: number, b: any) => a + b, 0), 100)

  const openBidModal = (rfq: any) => {
    setSelectedRfq(rfq); setBidModalOpen(true)
    if (unreadCount > 0) markAllRead.mutate()
  }

  const openRfqs = vendorRfqs.length
  const pendingBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'pending').length
  const acceptedBids = vendorRfqs.filter((r: any) => r.myBid?.status === 'accepted').length

  // Status counts for filter tabs
  const pendingCount = vendorRfqs.filter((r: any) => !r.myBid).length
  const submittedCount = vendorRfqs.filter((r: any) => r.myBid?.status === 'pending').length
  const acceptedCount = vendorRfqs.filter((r: any) => r.myBid?.status === 'accepted').length
  const winCount = vendorRfqs.filter((r: any) => r.myBid?.status === 'won').length
  const rejectedCount = vendorRfqs.filter((r: any) => r.myBid?.status === 'rejected').length

  const filteredRfqs = vendorRfqs.filter((r: any) => {
    const matchesSearch = !searchQuery || r.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'pending' ? !r.myBid :
      statusFilter === 'submitted' ? r.myBid?.status === 'pending' :
      statusFilter === 'accepted' ? r.myBid?.status === 'accepted' :
      statusFilter === 'won' ? r.myBid?.status === 'won' :
      statusFilter === 'rejected' ? r.myBid?.status === 'rejected' : true
    return matchesSearch && matchesStatus
  })

  const bidSuccessRate = openRfqs > 0 ? Math.round((acceptedBids / openRfqs) * 100) : 0

  // Activity data for recent activity section
  const recentActivities = [
    { id: 1, type: 'rfq', title: 'New RFQ Received', description: 'Cranes required for construction project', time: '2h ago', status: 'new' },
    { id: 2, type: 'bid', title: 'Bid Accepted', description: 'Your bid for Excavator rental approved', time: '5h ago', status: 'success' },
    { id: 3, type: 'rfq', title: 'RFQ Expires Soon', description: 'Tower Crane 150 Ton - 2 hours remaining', time: '22h ago', status: 'warning' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8 pb-8 animate-reveal">
      
      {/* ── Welcome Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-600 mt-2 text-sm font-medium">Overview of your bidding and vendor management</p>
      </div>

      {/* ── KPI Cards Grid (with left border) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open RFQs */}
        <div className="kpi-card group cursor-default border-l-4 border-l-blue-600 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↑ 12% vs prev</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3 uppercase tracking-wide">Open RFQs</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{openRfqs}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting your bid</p>
        </div>

        {/* Active Bids */}
        <div className="kpi-card group cursor-default border-l-4 border-l-emerald-600 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Send className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↑ 8% vs prev</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3 uppercase tracking-wide">Active Bids</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{acceptedBids}</p>
          <p className="text-xs text-slate-500 mt-1">Sent to clients</p>
        </div>

        {/* Success Rate */}
        <div className="kpi-card group cursor-default border-l-4 border-l-purple-600 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↑ 5% vs prev</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3 uppercase tracking-wide">Success Rate</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{bidSuccessRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Out of submitted bids</p>
        </div>

        {/* Rating */}
        <div className="kpi-card group cursor-default border-l-4 border-l-green-600 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↑ 2% vs prev</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3 uppercase tracking-wide">Rating</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{profile.rating}⭐</p>
          <p className="text-xs text-slate-500 mt-1">{profile.ordersCount || 0} completed orders</p>
        </div>
      </div>

      {/* ── Blue Banner Section ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-blue-600 text-white p-8 flex items-center justify-between">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Bid & Quote Overview</h2>
          <p className="text-blue-100 text-sm max-w-md">
            You have {openRfqs} active RFQs, {acceptedBids} active bids, and a {bidSuccessRate}% success rate this month.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-500 rounded-full opacity-20" />
        <div className="relative z-10 flex gap-3">
          <button className="px-6 py-2.5 rounded-lg bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all">
            View Analytics
          </button>
          <button className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all border border-blue-500">
            View All Bids
          </button>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        
        {/* LEFT: RFQs and Activity */}
        <div className="space-y-8">
          
          {/* Available RFQs Section with Filters */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Active RFQs</h2>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filteredRfqs.length} RFQ{filteredRfqs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                All RFQs {vendorRfqs.length}
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Pending {pendingCount}
              </button>
              <button
                onClick={() => setStatusFilter('submitted')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  statusFilter === 'submitted'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Submitted {submittedCount}
              </button>
              <button
                onClick={() => setStatusFilter('accepted')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  statusFilter === 'accepted'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Accepted {acceptedCount}
              </button>
              <button
                onClick={() => setStatusFilter('won')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  statusFilter === 'won'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Won {winCount}
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Rejected {rejectedCount}
              </button>
            </div>

            {filteredRfqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-slate-700 font-semibold">No RFQs found</p>
                <p className="text-slate-500 text-sm mt-1">
                  {statusFilter === 'all' ? 'Check back soon for new opportunities' : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 bg-slate-50 border-b border-slate-200 px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  <div className="col-span-2">RFQ ID</div>
                  <div className="col-span-2">Equipment</div>
                  <div className="col-span-2">Client</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-2">Deadline</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Action</div>
                </div>

                {/* Table Rows */}
                {filteredRfqs.map((rfq: any) => {
                  const myBidStatus = rfq.myBid?.status
                  const statusConfig: any = {
                    pending: { label: 'Submitted', color: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-600' },
                    accepted: { label: 'Accepted', color: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-600' },
                    rejected: { label: 'Rejected', color: 'bg-red-50', textColor: 'text-red-700', dotColor: 'bg-red-600' },
                    won: { label: 'Won', color: 'bg-green-50', textColor: 'text-green-700', dotColor: 'bg-green-600' },
                    null: { label: 'Pending', color: 'bg-amber-50', textColor: 'text-amber-600', dotColor: 'bg-amber-600' },
                  }
                  const status = statusConfig[myBidStatus] || statusConfig.null
                  const deadline = new Date(rfq.deadline)
                  const now = new Date()
                  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  const isExpired = daysLeft < 0

                  return (
                    <div key={rfq.id} className="grid grid-cols-12 gap-4 border-b border-slate-100 px-6 py-5 items-center hover:bg-blue-50/30 transition-all group">
                      <div className="col-span-2">
                        <p className="font-bold text-slate-900">
                          <span className="text-blue-600">RFQ-</span>{String(rfq.id).padStart(4, '0')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-semibold text-slate-900 text-sm">{rfq.equipmentName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{rfq.equipmentCategory}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-semibold text-slate-900 text-sm">{rfq.clientName || 'N/A'}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="font-bold text-slate-900">${(rfq.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{deadline.toLocaleDateString()}</p>
                            <p className={`text-xs font-bold ${isExpired ? 'text-red-600' : daysLeft <= 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {isExpired ? 'Expired' : daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.color} font-bold text-xs`}>
                          <span className={`h-2 w-2 rounded-full ${status.dotColor}`} />
                          <span className={status.textColor}>{status.label}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {!myBidStatus ? (
                          <button
                            onClick={() => openBidModal(rfq)}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                          >
                            Bid
                          </button>
                        ) : (
                          <button
                            onClick={() => openBidModal(rfq)}
                            className="px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-700 text-xs font-bold transition-all"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All →</a>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const statusConfig = {
                  new: { bg: 'bg-blue-50', color: 'text-blue-600', dot: 'bg-blue-600', icon: '📋' },
                  success: { bg: 'bg-green-50', color: 'text-green-600', dot: 'bg-green-600', icon: '✓' },
                  warning: { bg: 'bg-amber-50', color: 'text-amber-600', dot: 'bg-amber-600', icon: '!' },
                  pending: { bg: 'bg-amber-50', color: 'text-amber-600', dot: 'bg-amber-600', icon: '⏳' },
                }
                const config = statusConfig[activity.status as keyof typeof statusConfig] || statusConfig.new

                return (
                  <div key={activity.id} className="border border-slate-200 rounded-lg bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${config.bg.replace('bg-', 'bg-').replace('-50', '-600')}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                          {activity.status === 'new' ? 'new' : activity.status === 'success' ? 'success' : 'warning'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar Widgets */}
        <div className="space-y-6">
          
          {/* Profile Completion */}
          <div className="border border-slate-200 rounded-xl bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4">Profile Completion</h3>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">{completion}%</span>
                <span className="text-xs font-bold text-slate-500">{completion >= 80 ? '✓ Complete' : 'In Progress'}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border border-slate-200 rounded-xl bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4">Performance</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Bid Success Rate</span>
                  <span className="text-sm font-bold text-emerald-600">{bidSuccessRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${bidSuccessRate}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Order Completion</span>
                  <span className="text-sm font-bold text-blue-600">85%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Average Rating</span>
                  <span className="text-sm font-bold text-amber-600">{profile.rating}/5.0</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-600" style={{ width: `${(profile.rating / 5) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Orders</span>
              <span className="text-lg font-bold text-slate-900">{profile.ordersCount || 0}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Earned</span>
              <span className="text-lg font-bold text-emerald-600">$24,500</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Pending Invoices</span>
              <span className="text-lg font-bold text-amber-600">$0</span>
            </div>
          </div>

        </div>
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
// src/pages/VendorDashboard.tsx  — REPLACE ENTIRE FILE
import { useAuth } from '@/contexts/AuthContext'
import {
  Star, Phone, Building2, FileCheck, Users, PackageCheck, Edit,
  Bell, ClipboardList, Send, Clock, CheckCircle2, Loader2,
  Wifi, WifiOff, AlertTriangle, LogOut, Shield,
  ChevronRight, Search, Settings
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { BidSubmissionModal } from '@/components/bidding/BidSubmissionModal'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'

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
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
      <AlertTriangle className="h-2.5 w-2.5" /> Expired
    </span>
  )
  const isUrgent = r.total < 3_600_000
  const isWarning = r.total < 86_400_000
  const label = r.days > 0 ? `${r.days}d ${r.hours}h` : r.hours > 0 ? `${r.hours}h ${r.minutes}m` : `${r.minutes}m ${r.seconds}s`
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
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
    <div className="flex h-screen items-center justify-center" style={{ background: '#f8f6ff' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin h-7 w-7 text-violet-500" />
        <p className="text-xs font-semibold text-gray-400">Loading dashboard…</p>
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

  const filteredRfqs = vendorRfqs.filter((r: any) =>
    !searchQuery || r.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const initials = (profile.companyName || user?.email || 'V')
    .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: '#f8f6ff' }}>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-white border-b border-gray-100 shadow-sm px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm shadow-violet-200">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-black text-gray-900 tracking-tight">VendorHub</span>
          <span className="text-xs font-semibold text-gray-300">|</span>
          <span className="text-xs font-semibold text-gray-400">Vendor Portal</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border',
            connected ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
            {connected ? 'Live' : 'Offline'}
          </div>

          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50 transition-colors">
            <Bell className="h-4 w-4 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-[10px] font-black text-violet-700">
              {initials}
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">{profile.companyName || user?.email}</span>
          </div>

          <button onClick={logout} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── KPI Row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Open RFQs', value: vendorRfqs.length, accent: '#6366f1', icon: ClipboardList, sub: 'awaiting bid' },
            { label: 'New Alerts', value: unreadCount, accent: '#ef4444', icon: Bell, sub: 'unread' },
            { label: 'Orders Done', value: profile.ordersCount || 0, accent: '#10b981', icon: PackageCheck, sub: 'completed' },
            { label: 'Rating', value: `${profile.rating || 0}`, accent: '#f59e0b', icon: Star, sub: 'out of 5.0' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-stretch overflow-hidden">
              <div className="w-1 shrink-0" style={{ backgroundColor: s.accent }} />
              <div className="flex items-center gap-3 px-4 py-3.5 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.accent + '15' }}>
                  <s.icon className="h-5 w-5" style={{ color: s.accent }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900 leading-tight">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 70/30 Layout ──────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* LEFT column */}
          <div className="space-y-5">

            {/* RFQ Inbox */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                    <ClipboardList className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900">RFQ Inbox</h2>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">
                      {vendorRfqs.length} open · awaiting your bid
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                    <input
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      className="h-8 w-36 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-xs placeholder:text-gray-300 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setIsInboxOpen(p => !p)}
                    className="h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    {isInboxOpen ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>

              {isInboxOpen && (
                rfqLoading ? (
                  <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-violet-400" /></div>
                ) : filteredRfqs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-14">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-gray-200" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">{searchQuery ? 'No matching RFQs' : 'No open RFQs'}</p>
                    <p className="text-xs text-gray-300">New requests will appear here instantly.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-gray-50/50">
                      {['Request', 'Deadline', 'Action'].map(h => (
                        <p key={h} className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{h}</p>
                      ))}
                    </div>
                    {filteredRfqs.map((rfq: any) => {
                      const bs = rfq.myBid ? BID_STATUS[rfq.myBid.status] || BID_STATUS.pending : null
                      const isAccepted = Array.isArray(rfq.acceptedVendors) &&
                        rfq.acceptedVendors.some((v: any) => String(v) === String(user?.id))
                      return (
                        <div key={rfq.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-violet-50/30 transition-colors group">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate">{rfq.equipmentName}</span>
                              <span className="shrink-0 text-[10px] font-black text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">#{String(rfq.id).padStart(4, '0')}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              From <span className="font-semibold text-gray-600">{rfq.clientName}</span>
                              <span className="mx-1.5 text-gray-200">·</span>
                              {new Date(rfq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <CountdownBadge deadline={rfq.deadline} />
                            {!rfq.deadline && <span className="text-[10px] text-gray-300">No deadline</span>}
                          </div>
                          <div className="shrink-0">
                            {bs ? (
                              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black', bs.bg, bs.text)}>
                                <span className={cn('h-1.5 w-1.5 rounded-full', bs.dot)} />${rfq.myBid.price.toLocaleString()}
                              </span>
                            ) : isAccepted ? (
                              <button onClick={() => openBidModal(rfq)} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm shadow-violet-200 transition-all">
                                <Send className="h-3 w-3" /> Submit Bid
                              </button>
                            ) : (
                              <button onClick={() => acceptRfq.mutate(rfq.id)} disabled={acceptRfq.isPending} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all disabled:opacity-50">
                                <CheckCircle2 className="h-3 w-3" /> Accept
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </div>

            {/* Equipment Categories grid */}
            {profile.categories?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <FileCheck className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900">Equipment Categories</h3>
                </div>
                <div className="p-5 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {profile.categories.map(cat => (
                    <div key={cat} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-violet-50 hover:border-violet-100 px-2 py-3 text-center transition-all cursor-default">
                      <span className="text-xl">{CATEGORY_ICONS[cat] || '⚙️'}</span>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide leading-tight">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT sidebar */}
          <div className="space-y-4">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-violet-500 to-indigo-500 relative">
                <button onClick={() => navigate('/vendor/profile')} className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                  <Edit className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
              <div className="px-5 pb-5">
                <div className="-mt-7 mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 border-white shadow-lg text-lg font-black text-violet-600 ring-2 ring-violet-100">
                    {initials}
                  </div>
                </div>
                <h3 className="text-base font-black text-gray-900">{profile.companyName || 'Set Company Name'}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-500">Profile Strength</span>
                    <span className={completion >= 80 ? 'text-emerald-600' : 'text-amber-600'}>{completion}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-1000', completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${completion}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Rating', value: profile.rating || '—' },
                    { label: 'Orders', value: profile.ordersCount || 0 },
                    { label: 'Exp.', value: `${profile.experienceYears || 0}y` },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 py-2">
                      <p className="text-sm font-black text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                {profile.phone && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3.5 w-3.5 text-gray-300 shrink-0" />{profile.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Certifications */}
            {profile.certifications?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-50">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-gray-900">Certifications</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {profile.certifications.map(cert => (
                    <span key={cert} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />{cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-50">
                <h3 className="text-sm font-black text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { label: 'Edit Profile', icon: Edit, onClick: () => navigate('/vendor/profile') },
                  { label: 'Settings', icon: Settings, onClick: () => { } },
                ].map(a => (
                  <button key={a.label} onClick={a.onClick} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <a.icon className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
                      {a.label}
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  </button>
                ))}
                <button onClick={logout} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                    Logout
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </button>
              </div>
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
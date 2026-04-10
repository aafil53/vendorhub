// src/pages/VendorDashboard.tsx  — REPLACE ENTIRE FILE
import { useAuth } from '@/contexts/AuthContext'
import {
  Star, Phone, Building2, FileCheck, Users, PackageCheck, Edit,
  Bell, ClipboardList, Send, Clock, CheckCircle2, Loader2,
  Wifi, WifiOff, AlertTriangle, LogOut, Shield,
  ChevronRight, Search, Settings, FileText
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
    <div className="max-w-[1240px] mx-auto animate-reveal space-y-8 pb-8">
            
            {/* ── Welcome header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {profile.companyName || 'Vendor'}</h1>
              <p className="text-slate-600 mt-2 text-[15px]">
                You have {vendorRfqs.filter((r: any) => r.myBid?.status === 'pending').length || 3} pending bids and 1 invoice to submit
              </p>
            </div>

            {/* ── KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Open RFQs', value: `(${vendorRfqs.length})`, icon: ClipboardList },
                { label: 'Active Orders', value: `(${profile.ordersCount || 1})`, icon: PackageCheck },
                { label: 'Total Earned', value: '($27,000)', icon: Star },
                { label: 'Outstanding Invoices', value: '($5,000)', icon: FileText },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border-2 border-slate-200 px-5 flex flex-col justify-center h-[96px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                      <s.icon className="h-5 w-5 text-violet-600" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-slate-800 leading-tight">{s.label}</span>
                      <span className="text-[20px] font-bold text-violet-700 leading-tight mt-0.5">{s.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Layout Grid */}
            <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
              
              {/* LEFT Column */}
              <div className="space-y-6">
                {/* Pending RFQs Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-[17px] font-bold text-slate-900">Pending RFQs</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[14px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3.5 font-semibold text-slate-800">RFQ ID</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Equipment Type</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Deadline</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {vendorRfqs.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No pending RFQs</td></tr>
                        ) : vendorRfqs.map((rfq: any) => {
                          const bs = rfq.myBid ? BID_STATUS[rfq.myBid.status] || BID_STATUS.pending : null;
                          const isAccepted = Array.isArray(rfq.acceptedVendors) &&
                            rfq.acceptedVendors.some((v: any) => String(v) === String(user?.id));
                          return (
                            <tr key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-700">RFQ-2023-{String(rfq.id).padStart(3, '0')}</td>
                              <td className="px-6 py-4 text-slate-600">{rfq.equipmentName}</td>
                              <td className="px-6 py-4 text-slate-600">
                                {rfq.deadline ? <CountdownBadge deadline={rfq.deadline} /> : 'No deadline'}
                              </td>
                              <td className="px-6 py-4 font-medium text-violet-600">
                                {bs ? (
                                  <span className={bs.text}>Submitted (${rfq.myBid.price.toLocaleString()})</span>
                                ) : (
                                  <div className="flex gap-2">
                                    {!isAccepted && (
                                      <button onClick={() => acceptRfq.mutate(rfq.id)} disabled={acceptRfq.isPending} className="hover:underline disabled:opacity-50">
                                        [Accept]
                                      </button>
                                    )}
                                    <button onClick={() => openBidModal(rfq)} className="hover:underline">
                                      [Submit Bid]
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoices to Action Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-[17px] font-bold text-slate-900">Invoices to Action</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[14px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Invoice ID</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Amount</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Status</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-800">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">INV-2023-001</td>
                          <td className="px-6 py-4 text-slate-600">$5,000</td>
                          <td className="px-6 py-4 text-slate-600">Pending</td>
                          <td className="px-6 py-4 font-medium text-violet-600">
                            <button className="hover:underline">[Submit Invoice]</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT Column */}
              <div className="space-y-6">
                
                {/* Bid Activity */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[17px] font-bold text-slate-900">Bid Activity</h2>
                  <p className="mt-2 text-[14px] text-slate-600">3 submitted, 2 accepted, 1 pending</p>
                </div>

                {/* Performance Score */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[17px] font-bold text-slate-900">Performance Score</h2>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-violet-700 tracking-tight">Grade B</span>
                    <span className="text-lg font-bold text-slate-700">· 67/100</span>
                  </div>
                  
                  <div className="mt-8 space-y-6">
                    <div>
                      <div className="flex justify-between text-sm text-slate-900 font-semibold mb-2">
                        <span>Bid Acceptance: 75%</span>
                      </div>
                      <div className="h-[6px] w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-violet-700 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-slate-900 font-semibold mb-2">
                        <span>PO Completion: 60%</span>
                      </div>
                      <div className="h-[6px] w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-violet-700 rounded-full" style={{ width: '60%' }} />
                      </div>
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
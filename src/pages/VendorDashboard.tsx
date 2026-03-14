// src/pages/VendorDashboard.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Star, Phone, Building2, FileCheck, Users, PackageCheck, Edit,
  Bell, ClipboardList, Send, Clock, CheckCircle2, Loader2,
  Wifi, WifiOff, AlertTriangle, LogOut
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { BidSubmissionModal } from '@/components/bidding/BidSubmissionModal'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(deadline: string | null | undefined) {
  const getRemaining = useCallback(() => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    const days    = Math.floor(diff / 86_400_000);
    const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000)  / 60_000);
    const seconds = Math.floor((diff % 60_000)     / 1_000);
    return { expired: false, days, hours, minutes, seconds, total: diff };
  }, [deadline]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!deadline) return;
    setRemaining(getRemaining());
    const id = setInterval(() => setRemaining(getRemaining()), 1_000);
    return () => clearInterval(id);
  }, [deadline, getRemaining]);

  return remaining;
}

// ── CountdownBadge component ──────────────────────────────────────────────────
function CountdownBadge({ deadline }: { deadline: string | null | undefined }) {
  const r = useCountdown(deadline);
  if (!deadline || !r) return null;

  if (r.expired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 border border-red-400/20 px-2.5 py-1 text-[10px] font-black text-red-400 uppercase tracking-wide">
        <AlertTriangle className="h-2.5 w-2.5" /> Expired
      </span>
    );
  }

  const isUrgent  = r.total < 3_600_000;   // < 1 hour
  const isWarning = r.total < 86_400_000;  // < 1 day

  const colorClass = isUrgent
    ? 'bg-red-400/10 border-red-400/20 text-red-400'
    : isWarning
      ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
      : 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400';

  const label = r.days > 0
    ? `${r.days}d ${r.hours}h left`
    : r.hours > 0
      ? `${r.hours}h ${r.minutes}m left`
      : `${r.minutes}m ${r.seconds}s left`;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
      colorClass
    )}>
      <Clock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ── Interfaces ────────────────────────────────────────────────────────────────
interface UserProfile {
  companyName: string
  phone: string
  experienceYears: number
  rating: number
  ordersCount: number
  categories: string[]
  certifications: string[]
}

const BID_STATUS: Record<string, { color: string; bg: string; dot: string }> = {
  accepted: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  rejected: { color: 'text-red-400',     bg: 'bg-red-400/10',     dot: 'bg-red-400'     },
  pending:  { color: 'text-amber-400',   bg: 'bg-amber-400/10',   dot: 'bg-amber-400'   },
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VendorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = localStorage.getItem('token')
  const { socket, connected } = useSocket()

  const [profile, setProfile]           = useState<UserProfile | null>(null)
  const [selectedRfq, setSelectedRfq]   = useState<any>(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen]   = useState(true)

  // Profile fetch
  useEffect(() => {
    fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setProfile).catch(() => {})
  }, [])

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const onNewRfq = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      toast.success('New RFQ arrived!', {
        action: { label: 'View', onClick: () => setIsInboxOpen(true) },
      });
    };
    const onOrderCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
      toast.success('🎉 A purchase order was placed on your bid!');
    };
    const onRfqExpired = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      toast.warning(data?.message || 'An RFQ has expired and been closed.', { duration: 6000 });
    };
    socket.on('notification:new',  onNewRfq);
    socket.on('order:created',     onOrderCreated);
    socket.on('rfq:expired',       onRfqExpired);
    return () => {
      socket.off('notification:new',  onNewRfq);
      socket.off('order:created',     onOrderCreated);
      socket.off('rfq:expired',       onRfqExpired);
    };
  }, [socket]);

  // Queries
  const { data: vendorRfqs = [], isLoading: rfqLoading } = useQuery({
    queryKey: ['vendor-rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfq/vendor-rfqs'); return data; },
  });

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => { const { data } = await api.get('/notifications/unread-count'); return data; },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notif-count'] }),
  });

  const acceptRfq = useMutation({
    mutationFn: (id: number) => api.post(`/rfq/${id}/accept`),
    onSuccess:  () => {
      toast.success('RFQ Accepted');
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to accept RFQ'),
  });

  const unreadCount: number = notifData?.count || 0;

  if (!profile) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-400" />
        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">Loading profile…</p>
      </div>
    </div>
  );

  const calculateCompletion = () => {
    let score = 0;
    if (profile.companyName)                score += 20;
    if (profile.phone)                      score += 15;
    if (profile.categories?.length > 0)     score += 20;
    if (profile.rating > 0)                 score += 15;
    if (profile.certifications?.length > 0) score += 15;
    if (profile.experienceYears > 0)        score += 15;
    return Math.min(score, 100);
  };
  const completion = calculateCompletion();

  const openBidModal = (rfq: any) => {
    setSelectedRfq(rfq);
    setBidModalOpen(true);
    if (unreadCount > 0) markAllRead.mutate();
  };

  return (
    <div className="min-h-screen bg-background selection:bg-indigo-400/20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-foreground">VendorHub</h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 leading-none">Vendor Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border',
            connected
              ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
              : 'bg-red-400/10 border-red-400/20 text-red-400'
          )}>
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Live' : 'Offline'}
          </div>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-foreground leading-none">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">Vendor</p>
          </div>

          <Button
            variant="ghost" size="sm" onClick={logout}
            className="h-9 px-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all font-black text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6 max-w-6xl">

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open RFQs',   value: vendorRfqs.length,     icon: ClipboardList, color: 'text-indigo-400',  bg: 'bg-indigo-400/10'  },
            { label: 'New Alerts',  value: unreadCount,             icon: Bell,          color: 'text-red-400',     bg: 'bg-red-400/10'     },
            { label: 'Orders Done', value: profile.ordersCount||0,  icon: PackageCheck,  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Rating',      value: profile.rating||0,       icon: Star,          color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
          ].map(s => (
            <Card key={s.label} className="glass border-none ring-1 ring-white/10 overflow-hidden group">
              <CardContent className="flex items-center gap-3 p-4 relative">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/40">{s.label}</p>
                  <p className={`text-xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
                </div>
                <div className={`absolute -right-2 -top-2 w-12 h-12 ${s.bg} blur-xl rounded-full opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── RFQ Inbox ───────────────────────────────────────────────────── */}
        <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-white/5 bg-white/3 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10">
                <ClipboardList className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-black tracking-tight">RFQ Inbox</CardTitle>
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/30 mt-0.5">
                  {vendorRfqs.length} open · awaiting your bid
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {unreadCount}
                </span>
              )}
              <Button
                variant="ghost" size="sm"
                onClick={() => setIsInboxOpen(p => !p)}
                className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground font-black text-[11px] border border-white/10"
              >
                {isInboxOpen ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </CardHeader>

          {isInboxOpen && (
            <CardContent className="p-0">
              {rfqLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              ) : vendorRfqs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/15" />
                  <p className="font-bold text-muted-foreground/30 text-sm">No open RFQs</p>
                  <p className="text-xs text-muted-foreground/20">New requests will appear here instantly.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {vendorRfqs.map((rfq: any) => {
                    const bs = rfq.myBid ? BID_STATUS[rfq.myBid.status] || BID_STATUS.pending : null;
                    const isAccepted = Array.isArray(rfq.acceptedVendors) &&
                      rfq.acceptedVendors.some((v: any) => String(v) === String(user?.id));

                    return (
                      <div
                        key={rfq.id}
                        className="group flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                      >
                        {/* Icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-xl select-none">
                          🏗️
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-foreground group-hover:text-indigo-300 transition-colors">
                              {rfq.equipmentName}
                            </p>
                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded-full">
                              #{String(rfq.id).padStart(4, '0')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <p className="text-xs text-muted-foreground/40">
                              From <span className="text-muted-foreground/60 font-semibold">{rfq.clientName}</span>
                              <span className="ml-2 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(rfq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </p>
                            {/* ── Live countdown badge ───────────────────── */}
                            <CountdownBadge deadline={rfq.deadline} />
                          </div>
                        </div>

                        {/* Action / Status */}
                        <div className="shrink-0">
                          {bs ? (
                            <span className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide',
                              bs.bg, bs.color
                            )}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', bs.dot)} />
                              ${rfq.myBid.price.toLocaleString()} · {rfq.myBid.status}
                            </span>
                          ) : isAccepted ? (
                            <Button
                              size="sm"
                              onClick={() => openBidModal(rfq)}
                              className="h-8 px-4 gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[11px] rounded-xl shadow-lg shadow-indigo-500/20"
                            >
                              <Send className="h-3 w-3" /> Submit Bid
                            </Button>
                          ) : (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => acceptRfq.mutate(rfq.id)}
                              disabled={acceptRfq.isPending}
                              className="h-8 px-4 gap-1.5 bg-white/5 hover:bg-indigo-400/10 text-indigo-400 border-indigo-400/20 font-black text-[11px] rounded-xl transition-all"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* ── Profile + Categories/Certs ──────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6">

          <Card className="glass border-none ring-1 ring-white/10 overflow-hidden md:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4 relative">
              <button
                onClick={() => navigate('/vendor/profile')}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
                <Building2 className="h-10 w-10 text-white" />
              </div>

              <div className="w-full">
                <h3 className="text-lg font-black text-foreground">{profile.companyName || 'Set Company Name'}</h3>
                <p className="text-xs text-muted-foreground/40 mt-0.5">{user?.email}</p>
              </div>

              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  <span>Profile Strength</span>
                  <span className={completion >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{completion}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      completion >= 80 ? 'bg-emerald-400' : completion >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    )}
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div className="w-full space-y-2 mt-2">
                {[
                  { icon: Phone, label: profile.phone || 'Not set' },
                  { icon: Users, label: `${profile.experienceYears || 0} years exp.` },
                  { icon: Star,  label: `${profile.rating || 0}/5 rating` },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card className="glass border-none ring-1 ring-white/10">
              <CardHeader className="px-5 py-4 border-b border-white/5">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-indigo-400" /> Equipment Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {profile.categories?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map(cat => (
                      <span key={cat} className="inline-flex items-center rounded-full bg-indigo-400/10 border border-indigo-400/20 px-3 py-1.5 text-xs font-black text-indigo-300 uppercase tracking-wider">
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/30 text-center py-4">No categories selected</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass border-none ring-1 ring-white/10">
              <CardHeader className="px-5 py-4 border-b border-white/5">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-400" /> Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {profile.certifications?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.map(cert => (
                      <span key={cert} className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider">
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/30 text-center py-4">No certifications added</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedRfq && (
        <BidSubmissionModal
          isOpen={bidModalOpen}
          onClose={() => {
            setBidModalOpen(false);
            setSelectedRfq(null);
            queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
          }}
          rfq={selectedRfq}
        />
      )}
    </div>
  );
}

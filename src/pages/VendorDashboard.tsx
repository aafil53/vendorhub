import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Star, Phone, Building2, FileCheck, Users, PackageCheck, Edit,
  LogOut, Bell, ClipboardList, Send, Clock, CheckCircle2, Loader2,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { BidSubmissionModal } from '@/components/bidding/BidSubmissionModal'
import { toast } from 'sonner'

interface UserProfile {
  companyName: string;
  phone: string;
  experienceYears: number;
  rating: number;
  ordersCount: number;
  categories: string[];
  certifications: string[];
}

export default function VendorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = localStorage.getItem('token')

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedRfq, setSelectedRfq] = useState<any>(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setProfile)
      .catch(() => { })
  }, [])

  // Vendor's open RFQs inbox
  const { data: vendorRfqs = [], isLoading: rfqLoading } = useQuery({
    queryKey: ['vendor-rfqs'],
    queryFn: async () => {
      const { data } = await api.get('/rfq/vendor-rfqs')
      return data
    },
    refetchInterval: 30_000, // poll every 30s
  })

  // Unread notification count
  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count')
      return data
    },
    refetchInterval: 30_000,
  })

  // Mark all notifications read mutation
  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notif-count'] }),
  })

  // Accept RFQ mutation
  const acceptRfq = useMutation({
    mutationFn: (id: number) => api.post(`/rfq/${id}/accept`),
    onSuccess: () => {
      toast.success('RFQ Accepted');
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
    },
    onError: () => toast.error('Failed to accept RFQ')
  })

  const unreadCount: number = notifData?.count || 0

  if (!profile) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
    </div>
  )

  const calculateCompletion = () => {
    let score = 0;
    if (profile.companyName) score += 20;
    if (profile.phone) score += 15;
    if (profile.categories?.length > 0) score += 20;
    if (profile.rating > 0) score += 15;
    if (profile.certifications?.length > 0) score += 15;
    if (profile.experienceYears > 0) score += 15;
    return Math.min(score, 100);
  }

  const completion = calculateCompletion()
  const displayOrders = profile.ordersCount || 0

  const openBidModal = (rfq: any) => {
    setSelectedRfq(rfq)
    setBidModalOpen(true)
    // Mark notifications for this RFQ as read
    if (unreadCount > 0) markAllRead.mutate()
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-amber-600 bg-amber-50 border-amber-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">VH</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-slate-800 bg-clip-text text-transparent">
              VendorHub
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-600">Connected as</p>
              <p className="font-semibold text-gray-900">{user?.email || 'Vendor'}</p>
            </div>
            <Button variant="outline" onClick={logout} size="sm" className="hover:bg-red-50 hover:text-red-600 border-slate-200">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">

        {/* ================================================================
            RFQ INBOX — Primary Section
        ================================================================ */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-6 h-6" />
                <div>
                  <CardTitle className="text-xl text-white">RFQ Inbox</CardTitle>
                  <p className="text-indigo-200 text-sm mt-0.5">Requests awaiting your bid</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 text-xs font-bold">
                      {unreadCount} new
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-white border-white/30 text-sm font-semibold">
                    {vendorRfqs.length} open
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 transition-colors"
                  onClick={() => setIsInboxOpen(!isInboxOpen)}
                >
                  {isInboxOpen ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                  {isInboxOpen ? 'Collapse' : 'Open Inbox'}
                </Button>
              </div>
            </div>
          </CardHeader>

          {isInboxOpen && (
            <CardContent className="p-0">
              {rfqLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : vendorRfqs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center text-slate-400">
                  <ClipboardList className="h-10 w-10 opacity-30" />
                  <p className="font-semibold text-slate-500">No open RFQs right now</p>
                  <p className="text-sm">When a client sends you an RFQ it will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {vendorRfqs.map((rfq: any) => (
                    <div key={rfq.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors group">

                      {/* Equipment icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                        🏗️
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900">{rfq.equipmentName}</p>
                          <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200 bg-indigo-50">
                            RFQ #{rfq.id}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          From <span className="font-medium text-slate-700">{rfq.clientName}</span>
                          <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(rfq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </p>
                      </div>

                      {/* Bid status / Action */}
                      <div className="shrink-0 flex items-center gap-3">
                        {rfq.myBid ? (
                          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getBidStatusColor(rfq.myBid.status)}`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Bid ${rfq.myBid.price.toLocaleString()} · {rfq.myBid.status}
                          </div>
                        ) : (
                          (() => {
                            const accepted = Array.isArray(rfq.acceptedVendors) && rfq.acceptedVendors.some((vid: any) => String(vid) === String(user?.id))
                            if (accepted) {
                              return (
                                <Button
                                  size="sm"
                                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                                  onClick={() => openBidModal(rfq)}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Send Response
                                </Button>
                              )
                            }
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => acceptRfq.mutate(rfq.id)}
                                disabled={acceptRfq.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Accept
                              </Button>
                            )
                          })()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* ================================================================
            Profile Hero Card
        ================================================================ */}
        <Card className="max-w-5xl mx-auto shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/vendor/profile')} className="bg-white/50 hover:bg-white">
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </div>

          <CardHeader className="text-center pb-2 pt-8">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {profile.companyName || 'Complete Your Profile'}
            </CardTitle>

            <div className="max-w-xs mx-auto mt-4 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Profile Strength</span>
                <span>{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6 text-sm p-8">
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-blue-100 rounded-lg"><Phone className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <div className="font-semibold text-gray-900">Phone</div>
                  <div className="text-lg font-medium text-gray-700">{profile.phone || 'Not set'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-emerald-100 rounded-lg"><Users className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <div className="font-semibold text-gray-900">Experience</div>
                  <div className="text-lg font-medium text-gray-700">{profile.experienceYears || 0}+ Years</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-yellow-100 rounded-lg"><Star className="w-5 h-5 text-yellow-600" /></div>
                <div>
                  <div className="font-semibold text-gray-900">Rating</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-gray-900">{profile.rating || 0}/5</div>
                    <div className="text-sm text-muted-foreground">({displayOrders} orders)</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-purple-100 rounded-lg"><PackageCheck className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <div className="font-semibold text-gray-900">Completed Orders</div>
                  <div className="text-2xl font-bold text-gray-900">{displayOrders}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories & Certifications */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-none ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="w-5 h-5 text-indigo-500" /> Equipment Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.categories?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.categories.map(cat => (
                    <Badge key={cat} className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1.5" variant="outline">{cat}</Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No categories selected</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="w-5 h-5 text-emerald-500" /> Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.certifications?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.certifications.map(cert => (
                    <Badge key={cert} className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5" variant="outline">{cert}</Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No certifications added</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Banner */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl border-none">
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
            {[
              { label: 'Total Orders', value: displayOrders },
              { label: 'Avg Rating', value: profile.rating || 0 },
              { label: 'Categories', value: profile.categories?.length || 0 },
              { label: 'Open RFQs', value: vendorRfqs.length },
            ].map((stat, i) => (
              <div key={i} className="text-center border-r border-white/20 last:border-0">
                <div className="text-4xl font-bold tracking-tight">{stat.value}</div>
                <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bid Submission Modal */}
      {selectedRfq && (
        <BidSubmissionModal
          isOpen={bidModalOpen}
          onClose={() => {
            setBidModalOpen(false)
            setSelectedRfq(null)
            queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })
          }}
          rfq={selectedRfq}
        />
      )}
    </div>
  )
}

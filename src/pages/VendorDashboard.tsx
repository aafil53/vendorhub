import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Phone, Building2, FileCheck, Users, PackageCheck, Edit, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'

interface UserProfile {
  companyName: string;
  phone: string;
  experienceYears: number;
  rating: number;
  orderCount: number; // Note: Backend uses orderCount or ordersCount? User model has ordersCount but migration said orderCount. Let's check.
  ordersCount: number; // Handling both just in case
  categories: string[];
  certifications: string[];
}

export default function VendorDashboard() {
  const { user, logout } = useAuth()
  const token = localStorage.getItem('token'); // Fallback to localStorage as auth context might not expose it directly yet
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchVendorProfile()
  }, [])

  const fetchVendorProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Failed to fetch profile', error)
    }
  }

  if (!profile) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  // Calculate completion
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

  const completion = calculateCompletion();
  // Handle both potential field names from backend/migration confusion
  const displayOrders = profile.ordersCount || profile.orderCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ✅ VENDORHUB HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">VH</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-slate-800 bg-clip-text text-transparent">
              VendorHub
            </h1>
          </div>

          {/* Connected As */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-600">Connected as</p>
              <p className="font-semibold text-gray-900">{user?.email || 'Vendor'}</p>
            </div>
            <Button variant="outline" onClick={logout} size="sm" className="hover:bg-red-50 hover:text-red-600 transition-colors border-slate-200">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Profile Card */}
        <Card className="max-w-5xl mx-auto shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/vendor/profile')} className="bg-white/50 hover:bg-white">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <CardHeader className="text-center pb-2 pt-8">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {profile.companyName || 'Complete Your Profile'}
            </CardTitle>

            {/* Completion Bar */}
            <div className="max-w-xs mx-auto mt-4 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Profile Strength</span>
                <span>{completion}%</span>
              </div>
              <Progress value={completion} className={`h-2 bg-gray-200 ${completion === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"}`} />
            </div>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6 text-sm p-8">
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Phone</div>
                  <div className="text-lg font-medium text-gray-700">{profile.phone || 'Not set'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Experience</div>
                  <div className="text-lg font-medium text-gray-700">{profile.experienceYears || 0}+ Years</div>
                </div>
              </div>
            </div>

            {/* Ratings & Orders */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Rating</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-gray-900">{profile.rating || 0}/5</div>
                    <div className="text-sm text-muted-foreground">({displayOrders} orders)</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PackageCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Total Completed Orders</div>
                  <div className="text-2xl font-bold text-gray-900">{displayOrders}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories & Certifications */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Categories */}
          <Card className="shadow-lg border-none ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                Equipment Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.categories && profile.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.categories.map((category: string) => (
                    <Badge
                      key={category}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 px-3 py-1.5 text-sm font-medium"
                      variant="outline"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                  No categories selected
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="shadow-lg border-none ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.certifications && profile.certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.certifications.map((cert: string) => (
                    <Badge
                      key={cert}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1.5 text-sm font-medium"
                      variant="outline"
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                  No certifications added
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl border-none">
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
            <div className="text-center border-r border-white/20 last:border-0">
              <div className="text-4xl font-bold tracking-tight">{displayOrders}</div>
              <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mt-1">Total Orders</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-0">
              <div className="text-4xl font-bold tracking-tight">{profile.rating || 0}</div>
              <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mt-1">Avg Rating</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-0">
              <div className="text-4xl font-bold tracking-tight">{profile.categories?.length || 0}</div>
              <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mt-1">Categories</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-0">
              <div className="text-4xl font-bold tracking-tight">{profile.certifications?.length || 0}</div>
              <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mt-1">Certifications</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

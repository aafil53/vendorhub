import { LogOut, Users, Shield, Activity, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdminBids } from '@/components/admin/AdminBids';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    api.get('/users?role=vendor').then(res => setVendors(res.data)).catch(() => setVendors([]));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass border-b-0 ring-1 ring-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20 transition-transform hover:scale-110 active:scale-95 duration-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none">Security Ops</h1>
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-1.5">Administrative Protocol Active</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest gap-2"
        >
          <LogOut className="h-4 w-4" />
          De-authenticate
        </Button>
      </header>

      <main className="relative z-10 p-8 max-w-[1600px] mx-auto space-y-10 animate-reveal">
        {/* Core Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: 'Network Entities', value: '24', icon: Users, color: 'text-purple-500', trend: '+3 active' },
            { label: 'Verified Partners', value: vendors.length, icon: Shield, color: 'text-blue-500', trend: '2 pending' },
            { label: 'System Integrity', value: '99.9%', icon: Activity, color: 'text-success', trend: 'Operational' },
            { label: 'Protocol Configs', value: '12', icon: Settings, color: 'text-warning', trend: 'Active' }
          ].map((stat, idx) => (
            <Card key={idx} className="glass border-none ring-1 ring-white/10 group hover:-translate-y-1 transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/30">{stat.label}</p>
                  <div className={cn("p-2 rounded-xl bg-white/5", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tighter leading-none">{stat.value}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground/40 bg-white/5 px-2 py-0.5 rounded">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* User & Approval Section */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
              <CardHeader className="p-6 border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg font-black tracking-tight">Entity Directory</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Global account management</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'John Doe', email: 'client@example.com', role: 'client' },
                    { name: 'Ahmed Al-Rashid', email: 'vendor@example.com', role: 'vendor' },
                    { name: 'System Admin', email: 'admin@example.com', role: 'admin' },
                  ].map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <User className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="text-sm font-black">{u.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/40">{u.email}</p>
                        </div>
                      </div>
                      <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'vendor' ? 'default' : 'secondary'} className="text-[9px] font-black uppercase tracking-tight border-none">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
              <CardHeader className="p-6 border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg font-black tracking-tight">Pending Verifications</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Network access requests</CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl">
                  <Shield className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
                  <p className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest">No pending protocols</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Core Operations Section */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black tracking-tight">Operational Grid</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-1">Real-time bid monitoring & vetting</CardDescription>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black tracking-[0.2em] px-3 py-1">SURVEILLANCE MODE</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 px-0">
                <AdminBids />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


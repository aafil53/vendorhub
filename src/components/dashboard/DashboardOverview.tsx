import { Package, AlertTriangle, FileText, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { dashboardStats } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DashboardOverview() {
  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-reveal">
        <StatCard
          title="Total Equipment"
          value={dashboardStats.totalEquipment}
          subtitle="Global Inventory"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Critical Shortages"
          value={dashboardStats.shortages}
          subtitle="Attention Required"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Active RFQs"
          value={dashboardStats.activeRFQs}
          subtitle={`${dashboardStats.pendingBids} pending bids`}
          icon={FileText}
        />
        <StatCard
          title="Monthly Orders"
          value={dashboardStats.ordersThisMonth}
          subtitle="Completed through portal"
          icon={CheckCircle}
          variant="success"
          trend={{ value: 24, isPositive: true }}
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="glass border-none ring-1 ring-white/10 animate-reveal delay-100">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            <div className="space-y-4">
              {[
                { action: 'New bid received', detail: 'Mobile Crane - Gulf Heavy Equipment', time: '2 hours ago', status: 'new' },
                { action: 'RFQ sent to 3 vendors', detail: 'Tower Crane - 150 Ton', time: '5 hours ago', status: 'pending' },
                { action: 'Order confirmed', detail: 'Excavator rental - Al-Madinah Rentals', time: '1 day ago', status: 'success' },
                { action: 'Shortage detected', detail: '4 Mobile Cranes required', time: '2 days ago', status: 'warning' },
              ].map((item, idx) => (
                <div key={idx} className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:translate-x-1 duration-300">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.action}</p>
                    <p className="text-xs text-muted-foreground/60 font-semibold truncate mt-0.5">{item.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                      item.status === 'success' ? 'success' : 
                      item.status === 'warning' ? 'warning' : 
                      item.status === 'new' ? 'default' : 'muted'
                    } className="text-[10px] font-black uppercase px-2 py-0.5 border-none shadow-sm">
                      {item.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground/40">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card className="glass border-none ring-1 ring-white/10 animate-reveal delay-200">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Users className="h-6 w-6" />
              </div>
              Strategic Partners
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            <div className="space-y-4">
              {[
                { name: 'Omar Farouk', company: 'Eastern Province Machinery', rating: 4.9, orders: 312 },
                { name: 'Ahmed Al-Rashid', company: 'Gulf Heavy Equipment LLC', rating: 4.8, orders: 156 },
                { name: 'Yusuf Al-Qahtani', company: 'Riyadh Heavy Lift', rating: 4.6, orders: 178 },
                { name: 'Mohammed Hassan', company: 'Al-Madinah Rentals', rating: 4.5, orders: 89 },
              ].map((vendor, idx) => (
                <div key={idx} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 duration-300">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                      <span className="text-sm font-black text-primary">
                        {vendor.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{vendor.name}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground/50 truncate uppercase tracking-tighter">{vendor.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      <span className="text-sm font-black text-foreground">{vendor.rating}</span>
                      <span className="text-warning text-sm">★</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{vendor.orders} Vol</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


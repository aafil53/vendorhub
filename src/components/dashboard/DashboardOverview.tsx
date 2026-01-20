import { Package, AlertTriangle, FileText, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { dashboardStats } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Equipment"
          value={dashboardStats.totalEquipment}
          subtitle="In inventory"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Equipment Shortages"
          value={dashboardStats.shortages}
          subtitle="Requires action"
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
          title="Orders This Month"
          value={dashboardStats.ordersThisMonth}
          subtitle="Completed orders"
          icon={CheckCircle}
          variant="success"
          trend={{ value: 24, isPositive: true }}
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New bid received', detail: 'Mobile Crane - Gulf Heavy Equipment', time: '2 hours ago', status: 'new' },
                { action: 'RFQ sent to 3 vendors', detail: 'Tower Crane - 150 Ton', time: '5 hours ago', status: 'pending' },
                { action: 'Order confirmed', detail: 'Excavator rental - Al-Madinah Rentals', time: '1 day ago', status: 'success' },
                { action: 'Shortage detected', detail: '4 Mobile Cranes required', time: '2 days ago', status: 'warning' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={
                      item.status === 'success' ? 'success' : 
                      item.status === 'warning' ? 'warning' : 
                      item.status === 'new' ? 'default' : 'muted'
                    }>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Top Performing Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Omar Farouk', company: 'Eastern Province Machinery', rating: 4.9, orders: 312 },
                { name: 'Ahmed Al-Rashid', company: 'Gulf Heavy Equipment LLC', rating: 4.8, orders: 156 },
                { name: 'Yusuf Al-Qahtani', company: 'Riyadh Heavy Lift', rating: 4.6, orders: 178 },
                { name: 'Mohammed Hassan', company: 'Al-Madinah Rentals', rating: 4.5, orders: 89 },
              ].map((vendor, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {vendor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{vendor.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-foreground">{vendor.rating}</span>
                      <span className="text-warning">★</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{vendor.orders} orders</p>
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

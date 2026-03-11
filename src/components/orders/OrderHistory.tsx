import { Truck, CheckCircle2, Clock, XCircle, Package, DollarSign, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; dot: string }> = {
  pending:   { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   dot: 'bg-amber-400'   },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  cancelled: { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-400/10',     dot: 'bg-red-400'     },
};

export function OrderHistory() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/history');
      return data;
    },
  });

  const totalValue = orders.reduce((sum: number, o: any) => sum + (Number(o.bid?.price) || 0), 0);
  const completed = orders.filter((o: any) => o.status === 'completed').length;
  const pending = orders.filter((o: any) => o.status === 'pending').length;

  return (
    <div className="space-y-8">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4 animate-reveal">
        {[
          { label: 'Total Orders',    value: orders.length,                      icon: Package,      color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
          { label: 'Pending',         value: pending,                             icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
          { label: 'Completed',       value: completed,                           icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Value',     value: `$${totalValue.toLocaleString()}`,   icon: DollarSign,   color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
        ].map(s => (
          <Card key={s.label} className="glass border-none ring-1 ring-white/10 overflow-hidden group">
            <CardContent className="flex items-center gap-4 p-5 relative">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">{s.label}</p>
                <p className={`text-2xl font-black tracking-tighter mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
              <div className={`absolute -right-3 -top-3 w-16 h-16 ${s.bg} blur-2xl rounded-full opacity-60`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card className="glass border-none ring-1 ring-white/10 overflow-hidden animate-reveal delay-100">
        <CardHeader className="px-8 py-5 border-b border-white/5 bg-white/3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-black tracking-tight">Purchase Orders</CardTitle>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/30 mt-0.5">
              {isLoading ? 'Loading...' : `${orders.length} total orders`}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    {['PO Number', 'Equipment', 'Vendor', 'Value', 'Date', 'Status'].map(h => (
                      <TableHead key={h} className={cn(
                        'font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11',
                        h === 'PO Number' && 'pl-8',
                        h === 'Status' && 'pr-8 text-right'
                      )}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
                          <Package className="h-10 w-10 opacity-20" />
                          <p className="font-bold">No orders yet</p>
                          <p className="text-xs">Orders appear here once you award a bid.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order: any) => {
                      const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const StatusIcon = sc.icon;
                      return (
                        <TableRow key={order.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                          {/* PO # */}
                          <TableCell className="pl-8 py-4">
                            <span className="font-mono text-xs font-black text-muted-foreground/50 group-hover:text-amber-400 transition-colors">
                              {order.poDetails?.poNumber || `PO-${String(order.id).padStart(4, '0')}`}
                            </span>
                          </TableCell>

                          {/* Equipment */}
                          <TableCell className="py-4">
                            <p className="font-bold text-sm text-foreground">
                              {order.bid?.rfq?.equipment?.name || '—'}
                            </p>
                          </TableCell>

                          {/* Vendor */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black text-muted-foreground/50">
                                {(order.vendor?.name || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-muted-foreground/70">
                                {order.vendor?.name || '—'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Value */}
                          <TableCell className="py-4">
                            <span className="font-black text-sm text-foreground">
                              ${Number(order.bid?.price || 0).toLocaleString()}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="py-4 text-[11px] font-semibold text-muted-foreground/40 font-mono">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: '2-digit'
                            }).toUpperCase()}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-4 text-right pr-8">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider',
                              sc.bg, sc.color
                            )}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                              {order.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

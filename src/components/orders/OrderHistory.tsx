// src/components/orders/OrderHistory.tsx
import {
  Truck, CheckCircle2, Clock, XCircle, Package,
  DollarSign, Loader2, CheckCheck, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

// ── helpers ───────────────────────────────────────────────────────────────────
function getUserRole(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'client';
    const d: any = jwtDecode(token);
    return d.role || 'client';
  } catch { return 'client'; }
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50'   },
  completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50'     },
};

// ── component ─────────────────────────────────────────────────────────────────
export function OrderHistory() {
  const queryClient = useQueryClient();
  const userRole = getUserRole();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/history');
      return data;
    },
  });

  // ── Mark Complete ──────────────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const { data } = await api.patch(`/orders/${orderId}/complete`);
      return data;
    },
    onSuccess: () => {
      toast.success('Order marked as completed!');
      try {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['vendor-scores-batch'] });
        queryClient.invalidateQueries({ queryKey: ['vendor-scores'] });
      } catch (_) { /* cache invalidation is best-effort */ }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to complete order');
    },
  });

  // ── Cancel ────────────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const { data } = await api.patch(`/orders/${orderId}/cancel`);
      return data;
    },
    onSuccess: () => {
      toast.success('Order cancelled');
      try {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['vendor-scores-batch'] });
      } catch (_) { /* best-effort */ }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to cancel order');
    },
  });

  // ── derived stats ──────────────────────────────────────────────────────────
  const totalValue  = orders.reduce((sum: number, o: any) => sum + (Number(o.bid?.price) || 0), 0);
  const pending     = orders.filter((o: any) => o.status === 'pending').length;
  const completed   = orders.filter((o: any) => o.status === 'completed').length;

  const isActionPending = completeMutation.isPending || cancelMutation.isPending;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── KPI strip — matching admin dashboard style ───────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orders', value: orders.length,               accent: '#3b82f6', icon: Package      },
          { label: 'Pending',      value: pending,                      accent: '#f59e0b', icon: Clock        },
          { label: 'Completed',    value: completed,                    accent: '#10b981', icon: CheckCircle2 },
          { label: 'Total Value',  value: `$${totalValue.toLocaleString()}`, accent: '#8b5cf6', icon: DollarSign  },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-stretch overflow-hidden"
          >
            <div className="w-1 shrink-0" style={{ backgroundColor: s.accent }} />
            <div className="flex items-center gap-4 px-5 py-4 flex-1">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.accent + '18' }}
              >
                <s.icon className="h-5 w-5" style={{ color: s.accent }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Client hint banner (only shown when pending orders exist) ───────── */}
      {userRole === 'client' && pending > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <CheckCheck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Mark orders as complete</span> once the vendor has
            delivered. This confirms payment and updates the vendor's performance score.
          </p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Purchase Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? 'Loading...' : `${orders.length} total orders`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {[
                    'PO Number', 'Equipment', 'Vendor', 'Value', 'Date', 'Status',
                    // Only clients see the Actions column
                    ...(userRole === 'client' ? ['Actions'] : []),
                  ].map(h => (
                    <th
                      key={h}
                      className={cn(
                        'text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3',
                        h === 'Actions' && 'text-right'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'client' ? 7 : 6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No orders yet</p>
                        <p className="text-xs text-gray-400">Orders appear here once you award a bid.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const isPending = order.status === 'pending';
                    const isThisCompleting = completeMutation.isPending && completeMutation.variables === order.id;
                    const isThisCancelling = cancelMutation.isPending && cancelMutation.variables === order.id;

                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          'group transition-colors',
                          order.status === 'completed' ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'
                        )}
                      >
                        {/* PO Number */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-semibold text-gray-500 group-hover:text-violet-600 transition-colors">
                            {order.poDetails?.poNumber || `PO-${String(order.id).padStart(4,'0')}`}
                          </span>
                        </td>

                        {/* Equipment */}
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 text-sm">
                            {order.bid?.rfq?.equipment?.name || '—'}
                          </p>
                        </td>

                        {/* Vendor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">
                              {(order.vendor?.name || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {order.vendor?.name || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-sm text-gray-900">
                            ${Number(order.bid?.price || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: '2-digit',
                          })}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                            sc.bg, sc.text
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Actions — client only, pending orders only ──────── */}
                        {userRole === 'client' && (
                          <td className="px-6 py-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                {/* Mark Complete */}
                                <button
                                  onClick={() => completeMutation.mutate(order.id)}
                                  disabled={isActionPending}
                                  title="Mark this order as completed"
                                  className={cn(
                                    'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm',
                                    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100',
                                    'disabled:opacity-50 disabled:cursor-not-allowed'
                                  )}
                                >
                                  {isThisCompleting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  )}
                                  Complete
                                </button>

                                {/* Cancel */}
                                <button
                                  onClick={() => {
                                    if (confirm(`Cancel order ${order.poDetails?.poNumber}? This cannot be undone.`)) {
                                      cancelMutation.mutate(order.id);
                                    }
                                  }}
                                  disabled={isActionPending}
                                  title="Cancel this order"
                                  className={cn(
                                    'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all',
                                    'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600',
                                    'disabled:opacity-50 disabled:cursor-not-allowed'
                                  )}
                                >
                                  {isThisCancelling ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                  )}
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              // Completed / cancelled — show nothing actionable
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

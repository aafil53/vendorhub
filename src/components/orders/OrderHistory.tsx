import { useState } from 'react';
import {
  Package, Clock, CheckCircle2, DollarSign,
  Loader2, CheckCheck, Ban, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import { InvoiceModal } from '@/components/invoices/InvoiceModal';

function getUserRole(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'client';
    const d: any = jwtDecode(token);
    return d.role || 'client';
  } catch { return 'client'; }
}

const ORDER_STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50'   },
  completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50'     },
};

export function OrderHistory() {
  const queryClient = useQueryClient();
  const userRole    = getUserRole();

  // Invoice modal state
  const [invoiceOrderId, setInvoiceOrderId]     = useState<number | null>(null);
  const [invoiceOrderStatus, setInvoiceOrderStatus] = useState<string>('');

  const openInvoice = (order: any) => {
    setInvoiceOrderId(order.id);
    setInvoiceOrderStatus(order.status);
  };

  const closeInvoice = () => {
    setInvoiceOrderId(null);
    setInvoiceOrderStatus('');
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => { const { data } = await api.get('/orders/history'); return data; },
  });

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
      } catch {}
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to complete order'),
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const { data } = await api.patch(`/orders/${orderId}/cancel`);
      return data;
    },
    onSuccess: () => {
      toast.success('Order cancelled');
      try {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      } catch {}
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to cancel order'),
  });

  const totalValue = orders.reduce((s: number, o: any) => s + (Number(o.bid?.price) || 0), 0);
  const pending    = orders.filter((o: any) => o.status === 'pending').length;
  const completed  = orders.filter((o: any) => o.status === 'completed').length;
  const isActionPending = completeMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orders', value: orders.length,                    accent: '#3b82f6', icon: Package      },
          { label: 'Pending',      value: pending,                          accent: '#f59e0b', icon: Clock        },
          { label: 'Completed',    value: completed,                        accent: '#10b981', icon: CheckCircle2 },
          { label: 'Total Value',  value: `$${totalValue.toLocaleString()}`, accent: '#8b5cf6', icon: DollarSign   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-xs flex items-stretch overflow-hidden">
            <div className="w-1 shrink-0" style={{ backgroundColor: s.accent }} />
            <div className="flex items-center gap-3 px-4 py-3.5 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.accent + '18' }}>
                <s.icon className="h-5 w-5" style={{ color: s.accent }} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-[24px] font-bold text-slate-900 leading-tight">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Hint banner ────────────────────────────────────────────────────── */}
      {userRole === 'client' && pending > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <CheckCheck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Mark orders as complete</span> once the vendor has delivered.
            This confirms payment and updates the vendor's performance score.
          </p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Purchase Orders</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {isLoading ? 'Loading…' : `${orders.length} total orders`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  {[
                    'PO Number', 'Equipment', 'Vendor', 'Value', 'Date', 'Status', 'Invoice',
                    ...(userRole !== 'vendor' ? ['Actions'] : []),
                  ].map(h => (
                    <th key={h} className={cn('table-header-cell', h === 'Actions' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No orders yet</p>
                        <p className="text-xs text-slate-400">Orders appear here once you award a bid.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const sc                = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                    const isPending         = order.status === 'pending';
                    const isCancelled       = order.status === 'cancelled';
                    const isThisCompleting  = completeMutation.isPending && completeMutation.variables === order.id;
                    const isThisCancelling  = cancelMutation.isPending    && cancelMutation.variables    === order.id;

                    return (
                      <tr key={order.id} className={cn(
                        'group transition-colors',
                        order.status === 'completed' ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'
                      )}>

                        {/* PO Number */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[12px] font-semibold text-blue-600">
                            {order.poDetails?.poNumber || `PO-${String(order.id).padStart(4,'0')}`}
                          </span>
                        </td>

                        {/* Equipment */}
                        <td className="px-4 py-3.5">
                          <p className="text-[13.5px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {order.bid?.rfq?.equipment?.name || '—'}
                          </p>
                        </td>

                        {/* Vendor */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 shrink-0">
                              {(order.vendor?.name || '?').split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase()}
                            </div>
                            <span className="text-[13px] font-medium text-slate-700">
                              {order.vendor?.name || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3.5">
                          <span className="text-[13.5px] font-bold text-slate-900">
                            ${Number(order.bid?.price || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-[12px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: '2-digit',
                          })}
                        </td>

                        {/* Order Status */}
                        <td className="px-4 py-3.5">
                          <span className={cn('chip', sc.bg, sc.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', sc.dot)} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Invoice button */}
                        <td className="px-4 py-3.5">
                          {!isCancelled ? (
                            <button
                              onClick={() => openInvoice(order)}
                              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 text-[12px] font-semibold transition-all"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Invoice
                            </button>
                          ) : (
                            <span className="text-[12px] text-slate-300">—</span>
                          )}
                        </td>

                        {/* Actions (client only) */}
                        {userRole !== 'vendor' && (
                          <td className="px-4 py-3.5 text-right">
                            {userRole === 'client' && isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => completeMutation.mutate(order.id)}
                                  disabled={isActionPending}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold shadow-xs transition-all disabled:opacity-50"
                                >
                                  {isThisCompleting
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <CheckCheck className="h-3.5 w-3.5" />
                                  }
                                  Complete
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Cancel order ${order.poDetails?.poNumber}? This cannot be undone.`))
                                      cancelMutation.mutate(order.id);
                                  }}
                                  disabled={isActionPending}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 text-[12px] font-semibold transition-all disabled:opacity-50"
                                >
                                  {isThisCancelling
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Ban className="h-3.5 w-3.5" />
                                  }
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="text-[12px] text-slate-300">—</span>
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

      {/* Invoice Modal */}
      {invoiceOrderId !== null && (
        <InvoiceModal
          orderId={invoiceOrderId}
          orderStatus={invoiceOrderStatus}
          userRole={userRole}
          onClose={closeInvoice}
        />
      )}

    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import {
  FileText, Clock, CheckCircle, Users, TrendingUp,
  Search, XCircle, RefreshCw, ChevronRight, Loader2,
  AlertTriangle, Send, BarChart3, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import { BidSubmissionModal } from '../bidding/BidSubmissionModal';

interface RFQListProps { onViewBids: (rfq: any) => void; }

// ── Status config (enterprise light palette) ──────────────────────────────────
const STATUS = {
  open:      { label: 'Open',      dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',    ring: 'ring-blue-100'    },
  closed:    { label: 'Closed',    dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-100',  ring: 'ring-slate-200'   },
  awarded:   { label: 'Awarded',   dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     ring: 'ring-red-100'     },
};

type FilterTab = 'all' | 'open' | 'closed' | 'awarded' | 'cancelled';

// ── Countdown badge ────────────────────────────────────────────────────────────
function DeadlineBadge({ deadline }: { deadline: string | null | undefined }) {
  const [label, setLabel] = useState('');
  const [urgency, setUrgency] = useState<'ok' | 'warn' | 'urgent' | 'expired'>('ok');

  const compute = useCallback(() => {
    if (!deadline) return;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) { setLabel('Expired'); setUrgency('expired'); return; }
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setLabel(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    setUrgency(diff < 3_600_000 ? 'urgent' : diff < 86_400_000 ? 'warn' : 'ok');
  }, [deadline]);

  useEffect(() => {
    if (!deadline) return;
    compute();
    const id = setInterval(compute, 1_000);
    return () => clearInterval(id);
  }, [deadline, compute]);

  if (!deadline) return <span className="text-[12px] text-slate-300">—</span>;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
      urgency === 'expired' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' :
      urgency === 'urgent'  ? 'bg-red-50 text-red-600 ring-1 ring-red-100' :
      urgency === 'warn'    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' :
                              'bg-slate-50 text-slate-500 ring-1 ring-slate-100'
    )}>
      {urgency === 'expired' ? <AlertTriangle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

// ── Bid progress bar ──────────────────────────────────────────────────────────
function BidBar({ count, vendorCount }: { count: number; vendorCount: number }) {
  const pct = vendorCount > 0 ? Math.min((count / vendorCount) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-[13px] font-semibold', count > 0 ? 'text-slate-800' : 'text-slate-400')}>
        {count}
      </span>
      {vendorCount > 0 && (
        <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}
      {count === 0 && <span className="text-[11px] text-slate-300">awaiting</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RFQList({ onViewBids }: RFQListProps) {
  const [selectedRfq, setSelectedRfq]   = useState<any>(null);
  const [bidModalOpen, setBidModalOpen]  = useState(false);
  const [filter, setFilter]             = useState<FilterTab>('all');
  const [search, setSearch]             = useState('');
  const queryClient = useQueryClient();

  const token = localStorage.getItem('token');
  let userRole = 'client';
  try { if (token) { const d: any = jwtDecode(token); userRole = d.role; } } catch {}

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => { const { data } = await api.get('/rfqs'); return data; },
  });

  // ── Cancel mutation ──────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async (rfqId: number) => { const { data } = await api.patch(`/rfqs/${rfqId}/cancel`); return data; },
    onSuccess: () => {
      toast.success('RFQ cancelled');
      try { queryClient.invalidateQueries({ queryKey: ['rfqs'] }); } catch {}
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to cancel RFQ'),
  });

  // ── Reopen mutation ──────────────────────────────────────────────────────────
  const reopenMutation = useMutation({
    mutationFn: async (rfqId: number) => { const { data } = await api.patch(`/rfqs/${rfqId}/reopen`); return data; },
    onSuccess: (data) => {
      toast.success(data?.deadlineCleared ? 'RFQ reopened — expired deadline was cleared' : 'RFQ reopened successfully');
      try { queryClient.invalidateQueries({ queryKey: ['rfqs'] }); } catch {}
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to reopen RFQ'),
  });

  // ── Filter + search ──────────────────────────────────────────────────────────
  const filtered = rfqs.filter((r: any) => {
    const matchesTab    = filter === 'all' || r.status === filter;
    const matchesSearch = !search ||
      r.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).includes(search);
    return matchesTab && matchesSearch;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total:     rfqs.length,
    open:      rfqs.filter((r: any) => r.status === 'open').length,
    awarded:   rfqs.filter((r: any) => r.status === 'awarded').length,
    bids:      rfqs.reduce((a: number, r: any) => a + (r.bids?.length || 0), 0),
    cancelled: rfqs.filter((r: any) => r.status === 'cancelled').length,
  };

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: stats.total     },
    { key: 'open',      label: 'Open',      count: stats.open      },
    { key: 'awarded',   label: 'Awarded',   count: stats.awarded   },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    { key: 'closed',    label: 'Closed',    count: rfqs.filter((r: any) => r.status === 'closed').length },
  ];

  const isMutating = cancelMutation.isPending || reopenMutation.isPending;

  return (
    <div className="space-y-6">

      {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total RFQs', value: stats.total,   accent: '#2563EB', icon: FileText    },
          { label: 'Open',       value: stats.open,    accent: '#F59E0B', icon: Clock       },
          { label: 'Awarded',    value: stats.awarded, accent: '#16A34A', icon: CheckCircle },
          { label: 'Bids In',    value: stats.bids,    accent: '#7C3AED', icon: TrendingUp  },
        ].map(s => (
          <div key={s.label} className="kpi-card group cursor-default">
            <div className="w-1 shrink-0" style={{ backgroundColor: s.accent }} />
            <div className="flex items-center gap-3 px-4 py-3.5 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: s.accent + '18' }}>
                <s.icon className="h-5 w-5" style={{ color: s.accent }} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-[26px] font-bold text-slate-900 leading-tight">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                {userRole === 'vendor' ? 'Incoming Opportunities' : 'Your RFQs'}
              </h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {isLoading ? 'Loading…' : `${rfqs.length} total requests`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search RFQs…"
                className="h-9 w-44 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            {/* Refresh */}
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['rfqs'] })}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all',
                filter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {tab.label}
              <span className={cn(
                'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                filter === tab.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
              <FileText className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-500">
                {search ? `No RFQs matching "${search}"` : filter !== 'all' ? `No ${filter} RFQs` : 'No RFQs yet'}
              </p>
              <p className="text-[12px] text-slate-400 mt-1">
                {!search && filter === 'all' ? 'Create your first RFQ from the Equipment Catalog.' : ''}
              </p>
            </div>
            {(search || filter !== 'all') && (
              <button onClick={() => { setSearch(''); setFilter('all'); }} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  {[
                    { label: 'ID',        w: 'w-[80px]'  },
                    { label: 'Equipment', w: 'flex-1'    },
                    ...(userRole === 'client' ? [
                      { label: 'Vendors',  w: 'w-[90px]'  },
                      { label: 'Bids',     w: 'w-[120px]' },
                      { label: 'Deadline', w: 'w-[110px]' },
                    ] : []),
                    { label: 'Date',      w: 'w-[100px]' },
                    { label: 'Status',    w: 'w-[110px]' },
                    { label: '',          w: 'w-[160px]' },
                  ].map(h => (
                    <th key={h.label} className={cn('table-header-cell', h.w)}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((rfq: any) => {
                  const sc = STATUS[rfq.status as keyof typeof STATUS] || STATUS.open;
                  const hasBids   = (rfq.bids?.length || 0) > 0;
                  const vendorCnt = rfq.vendors?.length || 0;
                  const isThisMutating = (cancelMutation.isPending && cancelMutation.variables === rfq.id) ||
                                         (reopenMutation.isPending && reopenMutation.variables === rfq.id);

                  return (
                    <tr key={rfq.id} className="table-row group">

                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[12px] font-semibold text-blue-600">
                          RFQ-{String(rfq.id).padStart(4,'0')}
                        </span>
                      </td>

                      {/* Equipment */}
                      <td className="px-4 py-3.5">
                        <p className="text-[14px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {rfq.equipmentName}
                        </p>
                        {userRole !== 'client' && (
                          <p className="text-[12px] text-slate-400 mt-0.5">From {rfq.clientName}</p>
                        )}
                      </td>

                      {/* Vendors (client only) */}
                      {userRole === 'client' && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {vendorCnt}
                          </div>
                        </td>
                      )}

                      {/* Bids (client only) */}
                      {userRole === 'client' && (
                        <td className="px-4 py-3.5">
                          <BidBar count={rfq.bids?.length || 0} vendorCount={vendorCnt} />
                        </td>
                      )}

                      {/* Deadline (client only) */}
                      {userRole === 'client' && (
                        <td className="px-4 py-3.5">
                          <DeadlineBadge deadline={rfq.deadline} />
                        </td>
                      )}

                      {/* Date */}
                      <td className="px-4 py-3.5 text-[12px] text-slate-400">
                        {new Date(rfq.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn('chip', sc.bg, sc.text, `ring-1 ${sc.ring}`)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', sc.dot)} />
                          {sc.label}
                        </span>
                      </td>

                      {/* ── Actions: corrected enterprise state machine ────
                       *
                       *  State after order cancel: rfq=closed, bid=pending  ← KEY FIX
                       *
                       *  AWARDED + order pending    → ⏳ In Progress (read-only)
                       *  AWARDED + order completed  → ✓ Completed (read-only)
                       *  OPEN    + has bids         → Compare Bids · Cancel
                       *  OPEN    + no bids          → Awaiting bids · Cancel
                       *  CLOSED  + has bids         → Re-Award PO · Reopen · Cancel
                       *    ↑ covers: deadline-expired AND post-cancel-reopen
                       *  CLOSED  + no bids          → Reopen · Cancel
                       *  CANCELLED                  → Reopen only
                       * ─────────────────────────────────────────────────── */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2 flex-wrap">

                          {/* ── VENDOR ────────────────────────────────────── */}
                          {userRole === 'vendor' && rfq.status === 'open' && (
                            <button onClick={() => { setSelectedRfq(rfq); setBidModalOpen(true); }} className="btn-primary h-8 px-3 text-[12px]">
                              <Send className="h-3.5 w-3.5" /> Bid
                            </button>
                          )}

                          {/* ── CLIENT: AWARDED ────────────────────────────
                           *  Only two sub-states: pending (in progress) or completed.
                           *  "awarded + cancelled" no longer exists — cancel resets to closed.
                           * ────────────────────────────────────────────── */}
                          {userRole === 'client' && rfq.status === 'awarded' && (
                            <div className={cn(
                              'inline-flex flex-col rounded-lg px-3 py-1.5 border text-left',
                              rfq.orderStatus === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                            )}>
                              <span className={cn('text-[10px] font-bold uppercase tracking-wide',
                                rfq.orderStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                              )}>
                                {rfq.orderStatus === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                              </span>
                              {rfq.winningVendor && (
                                <span className="text-[12px] font-semibold text-slate-700 truncate max-w-[140px]">
                                  {rfq.winningVendor} · ${Number(rfq.winningPrice || 0).toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}

                          {/* ── CLIENT: OPEN ───────────────────────────────── */}
                          {userRole === 'client' && rfq.status === 'open' && (
                            <>
                              {hasBids ? (
                                <button onClick={() => onViewBids(rfq)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-semibold transition-colors border border-blue-100">
                                  <BarChart3 className="h-3.5 w-3.5" /> Compare Bids <ChevronRight className="h-3 w-3" />
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
                                  <Loader2 className="h-3 w-3 animate-spin text-slate-300" /> Awaiting bids
                                </span>
                              )}
                              <button
                                onClick={() => { if (confirm(`Cancel RFQ-${String(rfq.id).padStart(4,'0')}? Vendors will be notified.`)) cancelMutation.mutate(rfq.id); }}
                                disabled={isMutating}
                                title="Cancel RFQ"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-50"
                              >
                                {isThisMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}

                          {/* ── CLIENT: CLOSED ─────────────────────────────
                           *  Covers two scenarios:
                           *  1. Deadline auto-expired — bids exist, pick the winner
                           *  2. PO was cancelled — bid reset to pending, re-award needed
                           *  Both handled identically: show bids, let client re-award
                           * ────────────────────────────────────────────── */}
                          {userRole === 'client' && rfq.status === 'closed' && (
                            <>
                              {hasBids ? (
                                <button onClick={() => onViewBids(rfq)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-[12px] font-bold transition-colors border border-violet-100">
                                  <BarChart3 className="h-3.5 w-3.5" />
                                  {rfq.hasOrder ? 'Re-Award PO' : 'Award PO'}
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              ) : (
                                <span className="text-[12px] text-slate-400">No bids received</span>
                              )}
                              <button
                                onClick={() => reopenMutation.mutate(rfq.id)}
                                disabled={isMutating}
                                title="Reopen to invite more vendors"
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-100 text-[12px] font-semibold transition-all disabled:opacity-50"
                              >
                                {isThisMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                Reopen
                              </button>
                              <button
                                onClick={() => { if (confirm(`Cancel RFQ-${String(rfq.id).padStart(4,'0')}?`)) cancelMutation.mutate(rfq.id); }}
                                disabled={isMutating}
                                title="Cancel RFQ"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-50"
                              >
                                {isThisMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}

                          {/* ── CLIENT: CANCELLED ──────────────────────────── */}
                          {userRole === 'client' && rfq.status === 'cancelled' && (
                            <button
                              onClick={() => reopenMutation.mutate(rfq.id)}
                              disabled={isMutating}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-100 text-[12px] font-semibold transition-all disabled:opacity-50"
                            >
                              {isThisMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              Reopen
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer row count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[12px] text-slate-400">
              Showing {filtered.length} of {rfqs.length} RFQs
              {filter !== 'all' && ` · filtered by "${filter}"`}
              {search && ` · search: "${search}"`}
            </p>
          </div>
        )}
      </div>

      {selectedRfq && (
        <BidSubmissionModal
          isOpen={bidModalOpen}
          onClose={() => { setBidModalOpen(false); setSelectedRfq(null); }}
          rfq={selectedRfq}
        />
      )}
    </div>
  );
}

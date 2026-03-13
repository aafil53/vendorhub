import { ArrowLeft, Check, Shield, Trophy, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ScorePill, VendorScore } from '@/components/vendors/ScoreBadge';

interface BidComparisonProps {
  rfq: any;
  onBack: () => void;
  onOrderCreated: () => void;
}

export function BidComparison({ rfq, onBack, onOrderCreated }: BidComparisonProps) {
  const queryClient = useQueryClient();
  const bids = rfq.bids || [];
  const sorted = [...bids].sort((a: any, b: any) => a.price - b.price);
  const lowestPrice  = sorted[0]?.price || 0;
  const highestPrice = sorted[sorted.length - 1]?.price || 0;
  const savings = highestPrice > lowestPrice
    ? Math.round(((highestPrice - lowestPrice) / highestPrice) * 100)
    : 0;

  // ── Fetch scores for all vendors in this bid set ───────────────────────────
  const vendorIds = [...new Set(bids.map((b: any) => b.vendorId))];
  const { data: scoresMap = {}, isLoading: scoresLoading } = useQuery({
    queryKey: ['vendor-scores-batch', vendorIds],
    queryFn: async () => {
      if (vendorIds.length === 0) return {};
      const { data } = await api.post('/vendor-scores/batch', { vendorIds });
      return data;
    },
    enabled: vendorIds.length > 0,
    staleTime: 60_000,
  });

  // ── Create PO ──────────────────────────────────────────────────────────────
  const createPOMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const { data } = await api.post('/orders/create', { bidId });
      return data;
    },
    onSuccess: () => {
      toast.success('Purchase Order created!');
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOrderCreated();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create PO'),
  });

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bid Comparison</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                RFQ #{String(rfq.id).padStart(4,'0')}
              </span>
              <span className="text-sm text-gray-400">{rfq.equipmentName}</span>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex items-stretch bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <div className="px-4 py-3 text-center border-r border-gray-100">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Bids</p>
            <p className="text-xl font-bold text-gray-900">{bids.length}</p>
          </div>
          <div className="px-4 py-3 text-center border-r border-gray-100">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Best Price</p>
            <p className="text-xl font-bold text-emerald-600">${lowestPrice.toLocaleString()}</p>
          </div>
          {savings > 0 && (
            <div className="px-4 py-3 text-center">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Max Savings</p>
              <p className="text-xl font-bold text-violet-600">{savings}%</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Empty ───────────────────────────────────────────────────────── */}
      {bids.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 py-20 text-center">
          <Clock className="h-10 w-10 text-gray-200" />
          <p className="font-semibold text-gray-500">No bids received yet</p>
          <p className="text-sm text-gray-400">Vendors will submit proposals here.</p>
        </div>
      )}

      {/* ── Bid Table ───────────────────────────────────────────────────── */}
      {bids.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Vendor Proposals</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {bids.length} bid{bids.length !== 1 ? 's' : ''} · sorted by price · click Score to see performance breakdown
              </p>
            </div>
            {savings > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                <TrendingDown className="h-3.5 w-3.5" />
                Up to {savings}% cheaper than highest bid
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Rank','Vendor','Score','Price','Availability','Cert','Date',''].map(h => (
                    <th
                      key={h}
                      className={cn(
                        'text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3',
                        h === '' && 'text-right'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((bid: any, idx: number) => {
                  const isBest = idx === 0;
                  const score: VendorScore | undefined = scoresMap[bid.vendorId];
                  return (
                    <tr
                      key={bid.id}
                      className={cn(
                        'group transition-colors',
                        isBest ? 'bg-emerald-50/50' : 'hover:bg-gray-50/50'
                      )}
                    >
                      {/* Rank */}
                      <td className="px-5 py-4">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
                          isBest ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                        )}>
                          {isBest ? <Trophy className="h-4 w-4" /> : idx + 1}
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{bid.vendorName}</p>
                        {isBest && (
                          <span className="text-[11px] font-semibold text-emerald-600">Best price</span>
                        )}
                      </td>

                      {/* Score badge */}
                      <td className="px-5 py-4">
                        {scoresLoading ? (
                          <div className="h-7 w-16 rounded-full bg-gray-100 animate-pulse" />
                        ) : score ? (
                          <ScorePill score={score} />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <p className={cn(
                          'text-xl font-bold',
                          isBest ? 'text-emerald-600' : 'text-gray-900'
                        )}>
                          ${Number(bid.price).toLocaleString()}
                        </p>
                        {idx > 0 && savings > 0 && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            +${(bid.price - lowestPrice).toLocaleString()} vs best
                          </p>
                        )}
                      </td>

                      {/* Availability */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-sm text-gray-600">{bid.availability || 'Ready'}</span>
                        </div>
                      </td>

                      {/* Cert */}
                      <td className="px-5 py-4">
                        {bid.certFile ? (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <Shield className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">Verified</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(bid.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                      </td>

                      {/* CTA */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => createPOMutation.mutate(bid.id)}
                          disabled={createPOMutation.isPending}
                          className={cn(
                            'h-9 px-5 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50',
                            isBest
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          )}
                        >
                          {createPOMutation.isPending
                            ? <Loader2 className="h-4 w-4 animate-spin inline" />
                            : 'Award PO'
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

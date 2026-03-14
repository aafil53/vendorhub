import { useState, useMemo } from 'react';
import {
  Star, Mail, Phone, Check, Send, Loader2, AlertCircle,
  ArrowLeft, Shield, Users, ChevronRight, ArrowUpDown, SlidersHorizontal, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScoreBadge, ScorePill, VendorScore } from './ScoreBadge';

interface VendorSelectionProps {
  category: string;
  equipmentName?: string;
  equipmentId?: number;
  onSendRFQ: (vendorIds: number[]) => void;
  onBack: () => void;
}

const ACCENT_COLORS = ['#6366f1','#f59e0b','#14b8a6','#3b82f6','#f97316','#8b5cf6','#0ea5e9','#10b981'];

type SortKey = 'score' | 'rating' | 'orders' | 'name';
type GradeFilter = 'all' | 'S' | 'A' | 'B' | 'C' | 'D';

export function VendorSelection({ category, equipmentName, equipmentId, onSendRFQ, onBack }: VendorSelectionProps) {
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [sortBy, setSortBy]       = useState<SortKey>('score');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [deadline, setDeadline]   = useState<string>('');
  const queryClient = useQueryClient();

  // ── Vendor list ────────────────────────────────────────────────────────────
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendors-by-category', category],
    queryFn: async () => {
      const { data } = await api.get(`/equipment/vendors?category=${encodeURIComponent(category)}`);
      return data;
    },
  });
  const eligibleVendors: any[] = vendorData?.vendors || [];

  // ── Batch scores ───────────────────────────────────────────────────────────
  const { data: scoresMap = {}, isLoading: scoresLoading } = useQuery({
    queryKey: ['vendor-scores-batch', eligibleVendors.map((v: any) => v.id)],
    queryFn: async () => {
      if (eligibleVendors.length === 0) return {};
      const { data } = await api.post('/vendor-scores/batch', {
        vendorIds: eligibleVendors.map((v: any) => v.id),
      });
      return data; // { [vendorId]: VendorScore }
    },
    enabled: eligibleVendors.length > 0,
    staleTime: 60_000,
  });

  // ── Sort + Filter ──────────────────────────────────────────────────────────
  const displayVendors = useMemo(() => {
    let list = [...eligibleVendors];

    // Grade filter
    if (gradeFilter !== 'all') {
      list = list.filter(v => scoresMap[v.id]?.grade === gradeFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'score')  return (scoresMap[b.id]?.score ?? 0) - (scoresMap[a.id]?.score ?? 0);
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'orders') return (Number(b.ordersCount) || 0) - (Number(a.ordersCount) || 0);
      if (sortBy === 'name')   return (a.companyName || a.name || '').localeCompare(b.companyName || b.name || '');
      return 0;
    });

    return list;
  }, [eligibleVendors, scoresMap, sortBy, gradeFilter]);

  // ── RFQ send ───────────────────────────────────────────────────────────────
  const sendRFQMutation = useMutation({
    mutationFn: async (vendorIds: number[]) => {
      if (equipmentId) {
        const { data } = await api.post('/rfq/create', { equipmentId, vendorIds, deadline: deadline || undefined });
        return data;
      } else {
        const { data } = await api.post('/rfq/create-by-category', { category, vendorIds, specs: equipmentName || category, deadline: deadline || undefined });
        return data;
      }
    },
    onSuccess: () => {
      toast.success(`RFQ sent to ${selectedVendors.length} vendor${selectedVendors.length !== 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      onSendRFQ(selectedVendors);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to send RFQ'),
  });

  const toggleVendor = (id: number) =>
    setSelectedVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);

  const parseCerts = (c: any): string[] => {
    if (!c) return [];
    if (Array.isArray(c)) return c;
    try { return JSON.parse(c); } catch { return []; }
  };

  const allSelected = displayVendors.length > 0 && displayVendors.every(v => selectedVendors.includes(v.id));
  const isLoading = vendorLoading;

  const GRADES: GradeFilter[] = ['all','S','A','B','C','D'];
  const GRADE_COLORS: Record<string, string> = { S:'#7c3aed', A:'#059669', B:'#2563eb', C:'#d97706', D:'#dc2626' };

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Vendors</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              RFQ for <span className="font-semibold text-violet-600">{equipmentName || category}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => sendRFQMutation.mutate(selectedVendors)}
          disabled={selectedVendors.length === 0 || sendRFQMutation.isPending}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sendRFQMutation.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
            : <><Send className="h-4 w-4" />Send to {selectedVendors.length || '...'} Vendor{selectedVendors.length !== 1 ? 's' : ''}</>
          }
        </button>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Category',  value: equipmentName || category },
          { label: 'Available', value: `${eligibleVendors.length} vendors` },
          { label: 'Selected',  value: `${selectedVendors.length} of ${displayVendors.length}` },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-400 font-medium mb-0.5">{s.label}</p>
            <p className={cn('text-sm font-bold', i === 2 && selectedVendors.length > 0 ? 'text-violet-600' : 'text-gray-900')}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Deadline picker (optional) ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500 shrink-0" />
            <span className="text-sm font-semibold text-gray-700">Bid Deadline</span>
            <span className="text-xs text-gray-400">(optional)</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="datetime-local"
              value={deadline}
              min={new Date(Date.now() + 3_600_000).toISOString().slice(0, 16)}
              onChange={e => setDeadline(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            />
            {deadline && (
              <button
                onClick={() => setDeadline('')}
                className="h-9 px-3 rounded-lg text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-200"
              >
                Clear
              </button>
            )}
          </div>
          {deadline && (
            <p className="w-full text-xs text-violet-600 font-medium mt-1">
              Vendors must bid before {new Date(deadline).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. RFQ auto-closes after this time.
            </p>
          )}
        </div>
      </div>

      {/* ── Controls: sort + grade filter ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">

        {/* Grade filter pills */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 mr-1" />
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={cn(
                'h-7 px-3 rounded-full text-xs font-bold border transition-all',
                gradeFilter === g
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
              style={gradeFilter === g
                ? { backgroundColor: g === 'all' ? '#6366f1' : GRADE_COLORS[g], borderColor: 'transparent' }
                : {}
              }
            >
              {g === 'all' ? 'All' : `Grade ${g}`}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 mr-1">Sort:</span>
          {(['score','rating','orders','name'] as SortKey[]).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                'h-7 px-3 rounded-full text-xs font-semibold border transition-all capitalize',
                sortBy === key
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {key === 'score' ? 'Score ↓' : key === 'rating' ? 'Rating' : key === 'orders' ? 'Orders' : 'Name'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vendor List ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* List header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
          <label className="flex items-center gap-2.5 cursor-pointer" onClick={() =>
            setSelectedVendors(allSelected ? [] : displayVendors.map((v: any) => v.id))
          }>
            <div className={cn(
              'flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
              allSelected ? 'border-violet-600 bg-violet-600' : 'border-gray-300 hover:border-violet-400'
            )}>
              {allSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm font-medium text-gray-600">Select all {displayVendors.length} vendors</span>
          </label>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {scoresLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            <Users className="h-3.5 w-3.5" />
            {displayVendors.length} shown
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : displayVendors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-gray-200" />
            <p className="font-semibold text-gray-400">
              {gradeFilter !== 'all'
                ? `No Grade ${gradeFilter} vendors for this category`
                : `No vendors for ${category}`}
            </p>
            {gradeFilter !== 'all' && (
              <button onClick={() => setGradeFilter('all')} className="text-xs text-violet-600 hover:underline">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayVendors.map((vendor: any, idx: number) => {
              const isSelected = selectedVendors.includes(vendor.id);
              const certs  = parseCerts(vendor.certifications);
              const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
              const score: VendorScore | undefined = scoresMap[vendor.id];
              const initials = (vendor.companyName || vendor.name || '?')
                .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div
                  key={vendor.id}
                  onClick={() => toggleVendor(vendor.id)}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-150',
                    isSelected ? 'bg-violet-50/60' : 'hover:bg-gray-50/80'
                  )}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                    isSelected ? 'border-violet-600 bg-violet-600' : 'border-gray-300 hover:border-violet-400'
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>

                  {/* Avatar */}
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
                    style={{ backgroundColor: accent }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{vendor.companyName || vendor.name}</p>
                      {vendor.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-600">{vendor.rating}</span>
                        </div>
                      )}
                      {/* Score pill inline */}
                      {score && !scoresLoading && <ScorePill score={score} />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{vendor.email}</span>
                      {vendor.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{vendor.phone}</span>}
                    </div>
                    {/* Certs */}
                    {certs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {certs.map((cert: string) => (
                          <span
                            key={cert}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                          >
                            <Shield className="h-2.5 w-2.5" />{cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score badge (right side, shows full tooltip) */}
                  <div className="shrink-0 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                    {score && !scoresLoading
                      ? <ScoreBadge score={score} size="md" showBreakdown={true} />
                      : scoresLoading
                        ? <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
                        : null
                    }
                    <span className="text-xs text-gray-400">{vendor.ordersCount || 0} orders</span>
                  </div>

                  {isSelected && <ChevronRight className="h-4 w-4 text-violet-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
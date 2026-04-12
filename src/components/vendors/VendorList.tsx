import { useState } from 'react';
import {
  Star, Mail, Phone, Loader2, Send, Search,
  MapPin, Shield, ChevronRight, Users, SlidersHorizontal,
  Building2, Award, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface VendorListProps {
  onSendRFQ?: (category: string) => void;
}

const ACCENT_COLORS = ['#2563EB','#7C3AED','#0891B2','#16A34A','#D97706','#DC2626','#0284C7','#EA580C'];

const CATEGORY_FILTERS = [
  'All', 'Cranes', 'Excavators', 'Bulldozers', 'Dump Trucks',
  'Forklifts', 'Drilling Rigs', 'Piling Equipment', 'Concrete Pumps',
];

function ScoreBadge({ score }: { score: number }) {
  const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';
  const color  = score >= 90 ? '#7c3aed' : score >= 75 ? '#059669' : score >= 60 ? '#2563eb' : score >= 45 ? '#d97706' : '#dc2626';
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm font-black shrink-0"
      style={{ backgroundColor: color + '18', borderColor: color + '40', color }}
      title={`Performance Score: ${score}/100`}
    >
      {grade}
    </div>
  );
}

function parseJSON(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

export function VendorList({ onSendRFQ }: VendorListProps) {
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCategory] = useState('All');
  const [page, setPage]               = useState(1);
  const limit = 9;

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, search],
    queryFn: async () => {
      const { data } = await api.get(`/vendors?page=${page}&limit=${limit}&search=${search}`);
      return data;
    },
    placeholderData: prev => prev,
  });

  // Fetch vendor scores batch
  const vendors: any[] = data?.vendors || [];
  const { data: scoresMap = {} } = useQuery({
    queryKey: ['vendor-scores-batch', vendors.map((v: any) => v.id)],
    queryFn: async () => {
      if (vendors.length === 0) return {};
      const { data } = await api.post('/vendor-scores/batch', { vendorIds: vendors.map((v: any) => v.id) });
      return data;
    },
    enabled: vendors.length > 0,
    staleTime: 60_000,
  });

  const totalPages = data?.totalPages || 1;

  // Client-side category filter
  const filtered = vendors.filter(v => {
    if (categoryFilter === 'All') return true;
    const cats = parseJSON(v.categories);
    return cats.includes(categoryFilter);
  });

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight">Vendor Directory</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="font-semibold text-blue-600">{data?.total || 0} registered vendors</span> · select a vendor to send an RFQ
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search vendors, companies…"
            className="h-10 w-64 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* ── Category filter tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0 mr-1" />
        {CATEGORY_FILTERS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'h-7 px-3 rounded-full text-[12px] font-semibold border whitespace-nowrap transition-all',
              categoryFilter === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Vendors', value: data?.total || 0,          accent: '#2563EB', icon: Users       },
          { label: 'Shown',         value: filtered.length,           accent: '#7C3AED', icon: Building2   },
          { label: 'Categories',    value: CATEGORY_FILTERS.length-1, accent: '#16A34A', icon: Award       },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-xs flex items-stretch overflow-hidden">
            <div className="w-1 shrink-0" style={{ backgroundColor: s.accent }} />
            <div className="flex items-center gap-3 px-4 py-3 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.accent + '15' }}>
                <s.icon className="h-4 w-4" style={{ color: s.accent }} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 bg-white rounded-xl border border-slate-200">
          <Building2 className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No vendors found</p>
          {categoryFilter !== 'All' && (
            <button onClick={() => setCategory('All')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vendor: any, idx: number) => {
            const cats    = parseJSON(vendor.categories);
            const certs   = parseJSON(vendor.certifications);
            const regions = parseJSON(vendor.operatingRegions);
            const accent  = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            const score   = scoresMap[vendor.id];
            const initials = (vendor.companyName || vendor.name || '?')
              .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <div
                key={vendor.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: accent }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-bold text-slate-900 truncate">
                        {vendor.companyName || vendor.name}
                      </h3>
                      <p className="text-[12px] text-slate-400 truncate">{vendor.contactName || vendor.name}</p>
                      {vendor.region && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-300" />
                          <span className="text-[11px] text-slate-400">{vendor.region}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score + Rating */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    {score && <ScoreBadge score={score.score} />}
                    {vendor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[12px] font-bold text-amber-600">{Number(vendor.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 space-y-3">

                  {/* Contact */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <Mail className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-[12px] text-slate-500">
                        <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Equipment categories */}
                  {cats.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Equipment</p>
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 4).map((cat: string) => (
                          <span key={cat} className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            {cat}
                          </span>
                        ))}
                        {cats.length > 4 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            +{cats.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {certs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {certs.slice(0, 3).map((cert: string) => (
                          <span key={cert} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <Shield className="h-2.5 w-2.5" />{cert}
                          </span>
                        ))}
                        {certs.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            +{certs.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    {vendor.ordersCount > 0 && <span className="font-semibold text-slate-600">{vendor.ordersCount} orders</span>}
                    {vendor.experienceYears > 0 && <span>{vendor.experienceYears}y exp</span>}
                    {regions.length > 0 && <span>{regions.length} region{regions.length > 1 ? 's' : ''}</span>}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-5 pb-5 flex gap-2">
                  {onSendRFQ && cats.length > 0 && (
                    <button
                      onClick={() => onSendRFQ(cats[0])}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold shadow-xs transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Send RFQ
                    </button>
                  )}
                  <button className="flex items-center justify-center gap-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-colors">
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'h-9 w-9 rounded-lg text-sm font-semibold transition-all',
                  p === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// src/components/equipment/EquipmentCatalog.tsx  — REPLACE ENTIRE FILE
import { useState } from 'react';
import { Users, Send, Loader2, AlertCircle, Search, ArrowRight, SlidersHorizontal, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const CATEGORY_META: Record<string, { image: string; icon: string; accent: string; subtitle: string }> = {
  'Cranes': { image: 'https://www.mazzellacompanies.com/wp-content/uploads/2023/04/Hammerhead_Tower_Crane_with_Load_During_Construction_of_Building.jpg', icon: '🏗️', accent: '#2563EB', subtitle: 'Mobile · Tower · Crawler' },
  'Excavators': { image: 'https://www.equipmentjournal.com/wp-content/uploads/2022/10/Deere-P-tier-Large-Excavators-2.jpg', icon: '🚜', accent: '#D97706', subtitle: 'Hydraulic · Mini · Long Reach' },
  'Bulldozers': { image: 'https://s7d2.scene7.com/is/image/Caterpillar/CM20190425-43141-d9dff', icon: '🚧', accent: '#DC2626', subtitle: 'Crawler · Wheel · High-Drive' },
  'Dump Trucks': { image: 'https://www.komatsu-middle-east.com/-/media/projects/komatsu-me/product-banner/hm_1200_630.ashx?rev=dee6734da2c547ca9b8dd3812383671d&hash=75FE59651F1B519BA92E5B26A12DA095', icon: '🚚', accent: '#0284C7', subtitle: 'Rigid · Articulated · Off-Road' },
  'Forklifts': { image: 'https://pd-training.co.uk/wp-content/uploads/2022/08/ultimate-guide-to-forklifts.jpg', icon: '🚛', accent: '#16A34A', subtitle: 'Electric · LPG · Diesel' },
  'Drilling Rigs': { image: 'https://orga.nl/wp-content/uploads/2018/06/Drilling-rig-navaids.jpg', icon: '⚙️', accent: '#7C3AED', subtitle: 'Rotary · Percussion · Directional' },
  'Piling Equipment': { image: 'https://tse1.mm.bing.net/th/id/OIP.36c3VjdgPxhrVPrnjRCKsgHaFQ?pid=Api&P=0&h=180', icon: '🔩', accent: '#0891B2', subtitle: 'Hydraulic · Vibratory · Impact' },
  'Concrete Pumps': { image: 'http://www.internetbusinessideas-viralmarketing.com/images/Concrete-Pump-Machine.jpg', icon: '🧱', accent: '#EA580C', subtitle: 'Boom · Line · Stationary' },
  'Lifting Equipment': { image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75&auto=format&fit=crop', icon: '⚙️', accent: '#2563EB', subtitle: 'Chain Hoists · Gantries · Jacks' },
  'Earthmoving Equipment': { image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=75&auto=format&fit=crop', icon: '🚜', accent: '#D97706', subtitle: 'Graders · Scrapers · Compactors' },
  'Transport Equipment': { image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&q=75&auto=format&fit=crop', icon: '🚚', accent: '#0284C7', subtitle: 'Flatbed · Low-Loaders · Trailers' },
  'Power Equipment': { image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=75&auto=format&fit=crop', icon: '⚡', accent: '#CA8A04', subtitle: 'Generators · Transformers · UPS' },
  'Generators': { image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=75&auto=format&fit=crop', icon: '⚡', accent: '#CA8A04', subtitle: 'Diesel · Gas · Hybrid Units' },
  'Compressors': { image: 'https://images.unsplash.com/photo-1581092160562-40aa08e26e55?w=600&q=75&auto=format&fit=crop', icon: '💨', accent: '#0891B2', subtitle: 'Rotary · Piston · Centrifugal' },
  'Pumps': { image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=75&auto=format&fit=crop', icon: '💧', accent: '#0891B2', subtitle: 'Centrifugal · Submersible · Slurry' },
  'Scaffolding': { image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75&auto=format&fit=crop', icon: '🏗️', accent: '#64748B', subtitle: 'Frame · Modular · Tube & Clamp' },
  'Trucks': { image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&q=75&auto=format&fit=crop', icon: '🚚', accent: '#0284C7', subtitle: 'Flatbed · Tipper · Mixer' },
};

const FALLBACK = { image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75&auto=format&fit=crop', icon: '⚙️', accent: '#64748B', subtitle: 'Various types available' };

const getMeta = (name: string) => {
  if (CATEGORY_META[name]) return CATEGORY_META[name];
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_META)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return FALLBACK;
};

interface EquipmentCatalogProps { onSelectCategory: (category: string) => void; }

// ── Uniform equipment card — all 8 cards are exactly the same size & treatment
function EquipmentCard({ cat, onSelect }: { cat: { name: string; vendorCount: number }; onSelect: () => void }) {
  const meta = getMeta(cat.name);
  return (
    <button
      onClick={onSelect}
      className="group relative overflow-hidden rounded-2xl text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
      style={{ aspectRatio: '4/3' }}  // enforces identical proportions for all 8
    >
      {/* Photo */}
      <img
        src={meta.image}
        alt={cat.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Consistent gradient overlay — same opacity on all cards */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

      {/* Top-left: accent dot + tag */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white tracking-wide"
          style={{ backgroundColor: meta.accent + 'E0' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white opacity-80" />
          {cat.vendorCount} VENDORS
        </span>
      </div>

      {/* Top-right: availability dot */}
      <div className="absolute top-3.5 right-3.5">
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1 border border-white/10">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-white/80">Available</span>
        </div>
      </div>

      {/* Bottom: always same position, same layout */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Subtitle line */}
        <p className="text-[10px] font-medium text-white/55 uppercase tracking-widest mb-1 truncate">
          {meta.subtitle}
        </p>

        {/* Title + CTA on same row */}
        <div className="flex items-end justify-between gap-2">
          <h3 className="text-[18px] font-bold text-white leading-tight">{cat.name}</h3>
          <div
            className="shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white transition-all duration-200 group-hover:gap-2 group-hover:pr-4"
            style={{ backgroundColor: meta.accent }}
          >
            <Send className="h-3 w-3" />
            <span>Send RFQ</span>
            <ArrowRight className="h-3 w-3 w-0 overflow-hidden opacity-0 group-hover:opacity-100 -ml-1 transition-all duration-200 group-hover:w-3" />
          </div>
        </div>
      </div>

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none" />
    </button>
  );
}

export function EquipmentCatalog({ onSelectCategory }: EquipmentCatalogProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['equipment-categories'],
    queryFn: async () => { const { data } = await api.get('/equipment/categories'); return data; },
    staleTime: 30_000,
  });

  const categories: { name: string; vendorCount: number }[] = data?.categories || [];
  
  // Sort based on the order defined in CATEGORY_META
  const metaOrder = Object.keys(CATEGORY_META);
  const filtered = categories
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const idxA = metaOrder.indexOf(a.name);
      const idxB = metaOrder.indexOf(b.name);
      // If not in meta, push to end
      const sortA = idxA === -1 ? 999 : idxA;
      const sortB = idxB === -1 ? 999 : idxB;
      return sortA - sortB;
    });

  const totalVendors = categories.reduce((a, c) => a + c.vendorCount, 0);

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <p className="text-sm text-slate-400 font-medium">Loading catalog…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-7">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight tracking-tight">Equipment Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse our fleet of heavy machinery — instant quotes from{' '}
            <span className="font-semibold text-blue-600">{totalVendors}+ certified vendors</span>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 shadow-xs transition-all">
            <Clock className="h-4 w-4" /> View My RFQs
          </button>
          <button
            onClick={() => onSelectCategory('')}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-all"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* ── Search + filters ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by equipment model, capacity, or vendor name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-11 w-full pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors shrink-0">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
        <button className="hidden sm:flex items-center gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors shrink-0">
          Availability: All ↓
        </button>
      </div>

      {/* ── Category count ────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600">
              <Users className="h-3 w-3 text-white" />
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              {search ? `${filtered.length} results` : 'All Categories'}
            </h2>
            <span className="text-[13px] text-slate-400">· {filtered.length} equipment types</span>
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-24 text-center bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="h-12 w-12 text-slate-200" />
          <div>
            <p className="text-base font-semibold text-slate-500">
              {search ? `No results for "${search}"` : 'No Equipment Categories Yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Categories appear once vendors register and select equipment types.
            </p>
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* ── Uniform 4×2 grid — all cards identical aspect ratio & treatment ─ */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map(cat => (
            <EquipmentCard
              key={cat.name}
              cat={cat}
              onSelect={() => onSelectCategory(cat.name)}
            />
          ))}
        </div>
      )}

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-blue-600 px-8 py-7 flex items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }} />
        <div className="relative z-10">
          <h3 className="text-[20px] font-bold text-white">Need a Custom Fleet Solution?</h3>
          <p className="text-blue-100 text-[13px] mt-1.5 max-w-md">
            Talk to our project coordinators for long-term rental discounts and white-glove logistics management.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex -space-x-2">
            {['#6366f1', '#0891b2', '#16a34a'].map((color, i) => (
              <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-600 text-white text-xs font-bold" style={{ backgroundColor: color }}>
                {['JD', 'MR', 'AS'][i]}
              </div>
            ))}
          </div>
          <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 shadow-sm transition-all">
            Contact Expert Advisor
          </button>
        </div>
      </div>

    </div>
  );
}
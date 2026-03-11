import { useState } from 'react';
import { Users, Send, Loader2, AlertCircle, Zap, ChevronRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
    'Cranes': { icon: '🏗️', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    'Excavators': { icon: '🚜', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    'Lifting Equipment': { icon: '⚙️', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    'Earthmoving Equipment': { icon: '🚛', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    'Transport Equipment': { icon: '🚚', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'Power Equipment': { icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    'Generators': { icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    'Trucks': { icon: '🚚', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'Forklifts': { icon: '🔧', color: 'text-teal-400', bg: 'bg-teal-400/10' },
    'Compressors': { icon: '🔩', color: 'text-teal-400', bg: 'bg-teal-400/10' },
    'Scaffolding': { icon: '🏗️', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    'Pumps': { icon: '💧', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
};

const getMeta = (name: string) => {
    if (CATEGORY_META[name]) return CATEGORY_META[name];
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(CATEGORY_META)) {
        if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
    }
    return { icon: '⚙️', color: 'text-slate-400', bg: 'bg-slate-400/10' };
};

interface EquipmentCatalogProps {
    onSelectCategory: (category: string) => void;
}

export function EquipmentCatalog({ onSelectCategory }: EquipmentCatalogProps) {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['equipment-categories'],
        queryFn: async () => {
            const { data } = await api.get('/equipment/categories');
            return data;
        },
        staleTime: 30_000,
    });

    const categories: { name: string; vendorCount: number }[] = data?.categories || [];
    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Loading catalog...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header + Search */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-400/80">
                            Live Catalog
                        </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Equipment Categories</h2>
                    <p className="text-sm text-muted-foreground/60 mt-0.5">
                        <span className="text-amber-400 font-bold">{categories.length}</span> categories · {categories.reduce((a, c) => a + c.vendorCount, 0)} vendors available
                    </p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-10 w-64 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/30 transition-all"
                    />
                </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/20" />
                    <div>
                        <p className="text-base font-bold text-muted-foreground/50">
                            {search ? `No results for "${search}"` : 'No Equipment Categories Yet'}
                        </p>
                        <p className="text-sm text-muted-foreground/30 mt-1">
                            Categories appear once vendors register and select equipment types.
                        </p>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((cat, idx) => {
                    const meta = getMeta(cat.name);
                    return (
                        <button
                            key={cat.name}
                            onClick={() => onSelectCategory(cat.name)}
                            className="group relative text-left rounded-2xl border border-white/5 bg-white/3 hover:bg-white/8 hover:border-amber-400/30 transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-400/5"
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            {/* Top accent line */}
                            <div className={`h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            <div className="p-5 space-y-4">
                                {/* Icon row */}
                                <div className="flex items-start justify-between">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.bg} text-2xl transition-transform duration-300 group-hover:scale-110`}>
                                        {meta.icon}
                                    </div>
                                    <ChevronRight className={`h-4 w-4 ${meta.color} opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1 group-hover:translate-x-0.5`} />
                                </div>

                                {/* Name */}
                                <div>
                                    <h3 className="font-bold text-foreground leading-tight group-hover:text-amber-300 transition-colors">
                                        {cat.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <Users className="h-3 w-3 text-muted-foreground/40" />
                                        <span className="text-xs text-muted-foreground/50">
                                            {cat.vendorCount} {cat.vendorCount === 1 ? 'vendor' : 'vendors'}
                                        </span>
                                        {cat.vendorCount > 0 && (
                                            <span className="ml-auto">
                                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 ${meta.bg} ${meta.color} group-hover:opacity-100 opacity-70`}>
                                    <Send className="h-3 w-3" />
                                    Send RFQ
                                </div>
                            </div>

                            {/* Glow on hover */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{ boxShadow: 'inset 0 0 40px rgba(251,191,36,0.03)' }} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

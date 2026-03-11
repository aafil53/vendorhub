import { useState } from 'react';
import { Star, Mail, Phone, Check, Send, Loader2, AlertCircle, ArrowLeft, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VendorSelectionProps {
  category: string;
  equipmentName?: string;
  equipmentId?: number;
  onSendRFQ: (vendorIds: number[]) => void;
  onBack: () => void;
}

export function VendorSelection({ category, equipmentName, equipmentId, onSendRFQ, onBack }: VendorSelectionProps) {
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: vendorData, isLoading } = useQuery({
    queryKey: ['vendors-by-category', category],
    queryFn: async () => {
      const { data } = await api.get(`/equipment/vendors?category=${encodeURIComponent(category)}`);
      return data;
    },
  });

  const eligibleVendors = vendorData?.vendors || [];

  const sendRFQMutation = useMutation({
    mutationFn: async (vendorIds: number[]) => {
      if (equipmentId) {
        const { data } = await api.post('/rfq/create', { equipmentId, vendorIds });
        return data;
      } else {
        const { data } = await api.post('/rfq/create-by-category', {
          category, vendorIds, specs: equipmentName || category,
        });
        return data;
      }
    },
    onSuccess: () => {
      toast.success(`RFQ sent to ${selectedVendors.length} vendor${selectedVendors.length !== 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      onSendRFQ(selectedVendors);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to send RFQ. Please try again.');
    },
  });

  const toggleVendor = (id: number) =>
    setSelectedVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);

  const parseCerts = (certifications: any): string[] => {
    if (!certifications) return [];
    if (Array.isArray(certifications)) return certifications;
    if (typeof certifications === 'string') {
      try { return JSON.parse(certifications); } catch { return []; }
    }
    return [];
  };

  const allSelected = eligibleVendors.length > 0 && selectedVendors.length === eligibleVendors.length;

  return (
    <div className="space-y-6 animate-reveal">

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight">Select Vendors</h2>
            <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest font-bold mt-0.5">
              RFQ for <span className="text-amber-400">{equipmentName || category}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={() => sendRFQMutation.mutate(selectedVendors)}
          disabled={selectedVendors.length === 0 || sendRFQMutation.isPending}
          className="h-11 px-6 gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-40"
        >
          {sendRFQMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            <><Send className="h-4 w-4" /> Send to {selectedVendors.length || '...'} Vendor{selectedVendors.length !== 1 ? 's' : ''}</>
          )}
        </Button>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Category', value: equipmentName || category, color: 'text-amber-400' },
          { label: 'Available Vendors', value: eligibleVendors.length, color: 'text-foreground' },
          { label: 'Selected', value: `${selectedVendors.length} / ${eligibleVendors.length}`, color: selectedVendors.length > 0 ? 'text-emerald-400' : 'text-muted-foreground/40' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-white/5 border border-white/5 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">{stat.label}</p>
            <p className={`text-sm font-black mt-0.5 truncate ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Vendor list ────────────────────────────────────────────────────── */}
      <div className="glass border-none ring-1 ring-white/10 rounded-2xl overflow-hidden">
        {/* List header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={checked => setSelectedVendors(checked ? eligibleVendors.map((v: any) => v.id) : [])}
            />
            <label htmlFor="select-all" className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 cursor-pointer">
              Select all {eligibleVendors.length} vendors
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/30 font-semibold">{eligibleVendors.length} eligible</span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        ) : eligibleVendors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/20" />
            <p className="font-bold text-muted-foreground/40">No vendors for <span className="text-amber-400">{category}</span></p>
            <p className="text-xs text-muted-foreground/25">Vendors will appear once they register this category.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {eligibleVendors.map((vendor: any, idx: number) => {
              const isSelected = selectedVendors.includes(vendor.id);
              const certs = parseCerts(vendor.certifications);
              const initials = (vendor.companyName || vendor.name || '?')
                .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div
                  key={vendor.id}
                  onClick={() => toggleVendor(vendor.id)}
                  className={cn(
                    'group flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200',
                    isSelected
                      ? 'bg-amber-400/5 hover:bg-amber-400/8'
                      : 'hover:bg-white/5'
                  )}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                    isSelected
                      ? 'border-amber-400 bg-amber-400'
                      : 'border-white/20 group-hover:border-amber-400/50'
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-slate-900" strokeWidth={3} />}
                  </div>

                  {/* Avatar */}
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm transition-all duration-300',
                    isSelected
                      ? 'bg-amber-400/20 text-amber-400 scale-105'
                      : 'bg-white/5 text-muted-foreground/60 group-hover:bg-white/10'
                  )}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        'font-bold text-sm transition-colors',
                        isSelected ? 'text-amber-300' : 'text-foreground group-hover:text-amber-300/80'
                      )}>
                        {vendor.companyName || vendor.name}
                      </p>
                      {vendor.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold text-yellow-400">{vendor.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/40">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />{vendor.email}
                      </span>
                      {vendor.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{vendor.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: certs + orders */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
                      {certs.map((cert: string) => (
                        <span
                          key={cert}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider"
                        >
                          <Shield className="h-2.5 w-2.5" />
                          {cert}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground/30 font-semibold">
                      {vendor.ordersCount || 0} orders
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
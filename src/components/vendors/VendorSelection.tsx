import { useState } from 'react';
import { Star, Mail, Phone, Check, Send, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VendorSelectionProps {
  category: string;           // e.g. "Lifting Equipment"
  equipmentName?: string;     // display name (falls back to category)
  equipmentId?: number;       // if from static equipment table
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
    }
  });

  const eligibleVendors = vendorData?.vendors || [];

  const sendRFQMutation = useMutation({
    mutationFn: async (vendorIds: number[]) => {
      if (equipmentId) {
        // Static equipment table flow
        const { data } = await api.post('/rfq/create', { equipmentId, vendorIds });
        return data;
      } else {
        // Vendor-category flow
        const { data } = await api.post('/rfq/create-by-category', {
          category,
          vendorIds,
          specs: equipmentName || category,
        });
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(`✅ RFQ sent to ${selectedVendors.length} vendor${selectedVendors.length !== 1 ? 's' : ''}! They will receive your request shortly.`);
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      onSendRFQ(selectedVendors);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Failed to send RFQ. Please try again.';
      toast.error(msg);
    }
  });

  const toggleVendor = (vendorId: number) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const getCertificationColor = (cert: string) => {
    switch (cert) {
      case 'ARAMCO': return 'success';
      case 'Third-Party': return 'default';
      case 'Labour': return 'muted';
      default: return 'secondary';
    }
  };

  const handleSend = () => {
    if (selectedVendors.length === 0) return;
    sendRFQMutation.mutate(selectedVendors);
  };

  const parseCerts = (certifications: any): string[] => {
    if (!certifications) return [];
    if (Array.isArray(certifications)) return certifications;
    if (typeof certifications === 'string') {
      try { return JSON.parse(certifications); } catch { return []; }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* RFQ Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Request for Quotation</CardTitle>
              <CardDescription>
                Select vendors to send RFQ for <strong>{equipmentName || category}</strong>
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Equipment Category</p>
              <p className="font-semibold">{equipmentName || category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendors Selected</p>
              <p className="font-semibold text-primary">{selectedVendors.length} of {eligibleVendors.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RFQ Status</p>
              <Badge variant="outline" className="text-xs font-semibold">Draft</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Eligible Vendors ({eligibleVendors.length})
            </CardTitle>
            <Button
              onClick={handleSend}
              disabled={selectedVendors.length === 0 || sendRFQMutation.isPending}
              className="gap-2"
            >
              {sendRFQMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4" /> Send RFQ to {selectedVendors.length} Vendor{selectedVendors.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : eligibleVendors.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="font-medium">No vendors found for <strong>{category}</strong></p>
                <p className="text-sm">Vendors will appear here once they register and select this equipment category.</p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={selectedVendors.length === eligibleVendors.length && eligibleVendors.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedVendors(checked ? eligibleVendors.map((v: any) => v.id) : []);
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select all {eligibleVendors.length} vendors
                  </label>
                </div>

                {eligibleVendors.map((vendor: any) => (
                  <div
                    key={vendor.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-4 transition-all cursor-pointer",
                      selectedVendors.includes(vendor.id)
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => toggleVendor(vendor.id)}
                  >
                    <Checkbox
                      checked={selectedVendors.includes(vendor.id)}
                      className="h-5 w-5"
                      onClick={e => e.stopPropagation()}
                      onCheckedChange={() => toggleVendor(vendor.id)}
                    />

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-semibold text-primary">
                        {(vendor.companyName || vendor.name || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{vendor.companyName || vendor.name}</p>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3.5 w-3.5 fill-yellow-500" />
                          <span className="text-xs font-medium">{vendor.rating || 'N/A'}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{vendor.contactName || vendor.name}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </span>
                        {vendor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
                        {parseCerts(vendor.certifications).map((cert: string) => (
                          <Badge key={cert} variant={getCertificationColor(cert) as any} className="text-[10px]">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{vendor.ordersCount || 0} orders</p>
                    </div>

                    {selectedVendors.includes(vendor.id) && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
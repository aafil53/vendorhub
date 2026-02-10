import { useState } from 'react';
import { Star, Mail, Phone, Check, Send } from 'lucide-react';
import { Equipment } from '@/types/vendor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { mockVendors } from '@/data/mockData';
import { toast } from 'sonner';

interface VendorSelectionProps {
  equipment: Equipment;
  onSendRFQ: (vendorIds: number[]) => void;
  onBack: () => void;
}

export function VendorSelection({ equipment, onSendRFQ, onBack }: VendorSelectionProps) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const eligibleVendors = mockVendors;

  const toggleVendor = (vendorId: string) => {
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
    toast.success('RFQ created and sent to selected vendors');
    onSendRFQ(selectedVendors as any);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Request for Quotation</CardTitle>
              <CardDescription>Select vendors to send RFQ for equipment</CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              ← Back to Equipment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Equipment</p>
              <p className="font-semibold">{equipment.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity Needed</p>
              <p className="font-semibold text-warning">1 unit</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Specifications</p>
              <p className="font-semibold">{equipment.specifications}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Required Certification</p>
              <Badge variant={getCertificationColor(equipment.certificationRequired) as any}>
                {equipment.certificationRequired}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Eligible Vendors ({eligibleVendors.length})
            </CardTitle>
            <Button 
              onClick={handleSend}
              disabled={selectedVendors.length === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send RFQ to {selectedVendors.length} Vendor{selectedVendors.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {eligibleVendors.map((vendor) => (
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
                />
                
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-semibold text-primary">
                    {vendor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{vendor.name}</p>
                    <div className="flex items-center gap-1 text-warning">
                      <Star className="h-4 w-4 fill-warning" />
                      <span className="text-sm font-medium">{vendor.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{vendor.company}</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {vendor.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {vendor.phone}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    {vendor.certifications.map(cert => (
                      <Badge key={cert} variant={getCertificationColor(cert) as any} className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{vendor.completedOrders} orders</p>
                </div>

                {selectedVendors.includes(vendor.id) && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
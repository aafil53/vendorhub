import { Star, Mail, Phone, MapPin, Building } from 'lucide-react';
import { mockVendors } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function VendorList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = mockVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCertificationColor = (cert: string) => {
    switch (cert) {
      case 'ARAMCO': return 'success';
      case 'Third-Party': return 'default';
      case 'Labour': return 'muted';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vendor Directory</h2>
          <p className="text-sm text-muted-foreground">{mockVendors.length} registered vendors</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button>+ Add Vendor</Button>
        </div>
      </div>

      {/* Vendor Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">
                      {vendor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{vendor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{vendor.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="text-sm font-semibold text-warning">{vendor.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{vendor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{vendor.phone}</span>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Certifications</p>
                <div className="flex flex-wrap gap-1">
                  {vendor.certifications.map(cert => (
                    <Badge key={cert} variant={getCertificationColor(cert) as any} className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Equipment Categories</p>
                <div className="flex flex-wrap gap-1">
                  {vendor.equipmentCategories.map(cat => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Completed Orders</span>
                <span className="font-semibold">{vendor.completedOrders}</span>
              </div>

              {/* Action */}
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

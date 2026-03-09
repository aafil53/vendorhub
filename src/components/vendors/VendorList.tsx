import { Star, Mail, Phone, Building, Loader2, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface VendorListProps {
  onSendRFQ?: (category: string) => void;
}

export function VendorList({ onSendRFQ }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, searchTerm],
    queryFn: async () => {
      const { data } = await api.get(`/vendors?page=${page}&limit=${limit}&search=${searchTerm}`);
      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  const vendors = data?.vendors || [];
  const totalPages = data?.totalPages || 1;



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
          <p className="text-sm text-muted-foreground">{data?.total || 0} registered vendors</p>
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
      {/* Vendor Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor: any) => (
              <Card key={vendor.id} className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-lg font-bold text-primary">
                          {vendor.name ? vendor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{vendor.companyName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{vendor.contactName || vendor.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-semibold text-warning">{vendor.rating || 'N/A'}</span>
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
                      {vendor.certifications && JSON.parse(JSON.stringify(vendor.certifications)).map ? (
                        JSON.parse(JSON.stringify(vendor.certifications)).map((cert: string) => (
                          <Badge key={cert} variant={getCertificationColor(cert) as any} className="text-xs">
                            {cert}
                          </Badge>
                        ))
                      ) : (typeof vendor.certifications === 'string' ? vendor.certifications.split(',').map((c: string) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>) : null)}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Equipment Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.categories && (Array.isArray(vendor.categories) ? vendor.categories : (typeof vendor.categories === 'string' ? JSON.parse(vendor.categories) : [])).map((cat: string) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-muted-foreground">Completed Orders</span>
                    <span className="font-semibold">{vendor.ordersCount || 0}</span>
                  </div>

                  {/* Action */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs">
                      View Profile
                    </Button>
                    {onSendRFQ && (() => {
                      const cats = Array.isArray(vendor.categories)
                        ? vendor.categories
                        : (typeof vendor.categories === 'string' ? (() => { try { return JSON.parse(vendor.categories); } catch { return []; } })() : []);
                      const firstCat = cats[0];
                      return firstCat ? (
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => onSendRFQ(firstCat)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send RFQ
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

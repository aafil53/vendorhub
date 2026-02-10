import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Package, Shield, ExternalLink, Activity } from 'lucide-react';


export function AdminBids() {
  const { data: allBids = [], refetch, isLoading } = useQuery({
    queryKey: ['admin', 'bids'],
    queryFn: async () => {
      const { data } = await api.get('/admin/bids');
      return data;
    }
  });

  const handleApprove = async (bidId: number) => {
    try {
      await api.post(`/bids/${bidId}/approve`);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-reveal">
      {allBids.length === 0 ? (
        <div className="p-20 text-center space-y-4 glass rounded-3xl border-none ring-1 ring-white/10">
          <Activity className="h-10 w-10 text-muted-foreground/10 mx-auto" />
          <p className="text-sm font-black text-muted-foreground/30 uppercase tracking-widest italic">
            {isLoading ? 'Decrypting Global Bid Stream...' : 'Zero Active Bids in Surveillance Buffer'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-3xl border-none ring-1 ring-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5 hover:bg-transparent px-8 h-12">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pl-8">Strategic Partner</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Financial Quote</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Vetting Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Availability</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Asset Targeted</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pr-8 text-right">Operation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBids.map((b: any) => (
                <TableRow key={b.id} className="group border-b border-white/5 transition-all hover:bg-white/5">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors">
                        <Package className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-black text-foreground">{b.vendorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-black tracking-tighter text-foreground">
                      ${b.price.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={b.certFile ? 'success' : 'outline'}
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                        b.certFile ? "bg-success/20 text-success" : "bg-white/5 text-muted-foreground/30"
                      )}
                    >
                      {b.certFile ? 'VERIFIED' : 'PENDING'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground/60 italic">{b.availability}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-muted-foreground/40 font-mono">#{b.rfqId}</span>
                      <span className="text-xs font-bold text-muted-foreground/80">{b.equipmentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(b.id)}
                      className="h-9 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 border border-primary/20 gap-2"
                    >
                      Authorize Bid
                      <Shield className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { FileText, Clock, CheckCircle, Users, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

import { jwtDecode } from 'jwt-decode';
import { BidSubmissionModal } from '../bidding/BidSubmissionModal';

interface RFQListProps {
  onViewBids: (rfq: any) => void;
}

export function RFQList({ onViewBids }: RFQListProps) {
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data } = await api.get('/rfqs');
      return data;
    }
  });

  // Get current user role
  const token = localStorage.getItem('token');
  let userRole = 'client';
  try {
    if (token) {
      const decoded: any = jwtDecode(token);
      userRole = decoded.role;
    }
  } catch (e) { }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'muted';
      case 'awarded': return 'success';
      default: return 'secondary';
    }
  };

  const handleAction = (rfq: any) => {
    if (userRole === 'vendor') {
      setSelectedRfq(rfq);
      setIsBidModalOpen(true);
    } else {
      onViewBids(rfq);
    }
  };

  return (
    <div className="space-y-10">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 animate-reveal">
        <Card className="glass border-none ring-1 ring-white/10 overflow-hidden group">
          <CardContent className="flex items-center gap-5 p-6 relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-primary/5">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">Total Requests</p>
              <p className="text-3xl font-black tracking-tighter mt-1">{rfqs.length}</p>
            </div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
          </CardContent>
        </Card>
        <Card className="glass border-none ring-1 ring-white/10 overflow-hidden group">
          <CardContent className="flex items-center gap-5 p-6 relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-lg shadow-warning/5">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">Active/Open</p>
              <p className="text-3xl font-black tracking-tighter mt-1 text-warning">
                {rfqs.filter((r: any) => r.status === 'open').length}
              </p>
            </div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-warning/5 blur-3xl rounded-full" />
          </CardContent>
        </Card>
        <Card className="glass border-none ring-1 ring-white/10 overflow-hidden group">
          <CardContent className="flex items-center gap-5 p-6 relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-success/5">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">Secured/Awarded</p>
              <p className="text-3xl font-black tracking-tighter mt-1 text-success">
                {rfqs.filter((r: any) => r.status === 'awarded').length}
              </p>
            </div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/5 blur-3xl rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* RFQ Table */}
      <Card className="glass border-none ring-1 ring-white/10 animate-reveal delay-100 overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5 bg-white/5">
          <CardTitle className="text-xl font-black tracking-tight">
            {userRole === 'vendor' ? 'Incoming Opportunities' : 'Managed Requests (RFQs)'}
          </CardTitle>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-1">Real-time bidding protocol active</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent px-8">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pl-8 h-12">Serial/ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 h-12">Asset Requirement</TableHead>
                  {userRole === 'client' && <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 h-12">Vendor Reach</TableHead>}
                  {userRole === 'client' && <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 h-12">Bid Density</TableHead>}
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 h-12">Timestamp</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 h-12">Protocol State</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pr-8 text-right h-12">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground/30 font-bold italic">
                      {isLoading ? 'Decrypting RFQ database...' : 'No active requests in current cycle'}
                    </TableCell>
                  </TableRow>
                ) : (
                  rfqs.map((rfq: any) => (
                    <TableRow key={rfq.id} className="group border-b border-white/5 transition-all hover:bg-white/5">
                      <TableCell className="font-mono text-[11px] font-black text-primary/60 pl-8">#{rfq.id.toString().padStart(4, '0')}</TableCell>
                      <TableCell className="font-bold text-foreground py-5">{rfq.equipmentName}</TableCell>
                      {userRole === 'client' && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-white/5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground/80">{rfq.vendors?.length || 0}</span>
                          </div>
                        </TableCell>
                      )}
                      {userRole === 'client' && (
                        <TableCell>
                          <Badge
                            variant={rfq.bids?.length > 0 ? 'default' : 'outline'}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-tight px-2 py-0.5",
                              rfq.bids?.length > 0 ? "bg-primary/20 text-primary border-none" : "bg-white/5 text-muted-foreground/40 border-none"
                            )}
                          >
                            {rfq.bids?.length || 0} RECEIVED
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-[11px] font-semibold text-muted-foreground/50">
                        {new Date(rfq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(rfq.status) as any}
                          className="font-black text-[9px] uppercase tracking-[0.15em] px-2.5 py-0.5 border-none shadow-sm"
                        >
                          {rfq.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          size="sm"
                          variant="secondary"
                          className={cn(
                            "h-9 px-5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all gap-2 border shadow-lg",
                            userRole === 'vendor'
                              ? "bg-primary text-white border-primary shadow-primary/20 hover:scale-105 active:scale-95"
                              : rfq.bids?.length > 0
                                ? "bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-white/5"
                                : "bg-white/5 text-muted-foreground/40 border-white/5 cursor-not-allowed"
                          )}
                          onClick={() => handleAction(rfq)}
                          disabled={userRole === 'client' && rfq.bids?.length === 0}
                        >
                          {userRole === 'vendor' ? (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Submit Bid
                            </>
                          ) : (
                            rfq.bids?.length > 0 ? 'Compare Bids' : 'Awaiting Data'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedRfq && (
        <BidSubmissionModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          rfq={selectedRfq}
        />
      )}
    </div>
  );

}

import { useState } from 'react';
import { FileText, Clock, CheckCircle, Users, Send, TrendingUp, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import { BidSubmissionModal } from '../bidding/BidSubmissionModal';

interface RFQListProps {
  onViewBids: (rfq: any) => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  open: { color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400', label: 'Open' },
  closed: { color: 'text-slate-400', bg: 'bg-slate-400/10', dot: 'bg-slate-400', label: 'Closed' },
  awarded: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400', label: 'Awarded' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400', label: 'Cancelled' },
};

export function RFQList({ onViewBids }: RFQListProps) {
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data } = await api.get('/rfqs');
      return data;
    },
  });

  const token = localStorage.getItem('token');
  let userRole = 'client';
  try { if (token) { const d: any = jwtDecode(token); userRole = d.role; } } catch { }

  const handleAction = (rfq: any) => {
    if (userRole === 'vendor') {
      setSelectedRfq(rfq);
      setIsBidModalOpen(true);
    } else {
      onViewBids(rfq);
    }
  };

  const stats = {
    total: rfqs.length,
    open: rfqs.filter((r: any) => r.status === 'open').length,
    awarded: rfqs.filter((r: any) => r.status === 'awarded').length,
    bids: rfqs.reduce((a: number, r: any) => a + (r.bids?.length || 0), 0),
  };

  return (
    <div className="space-y-8">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4 animate-reveal">
        {[
          { label: 'Total RFQs', value: stats.total, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Open', value: stats.open, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Awarded', value: stats.awarded, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Bids In', value: stats.bids, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-400/10' },
        ].map((s, i) => (
          <Card key={s.label} className="glass border-none ring-1 ring-white/10 overflow-hidden group">
            <CardContent className="flex items-center gap-4 p-5 relative">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">{s.label}</p>
                <p className={`text-2xl font-black tracking-tighter mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
              <div className={`absolute -right-3 -top-3 w-16 h-16 ${s.bg} blur-2xl rounded-full opacity-60`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card className="glass border-none ring-1 ring-white/10 overflow-hidden animate-reveal delay-100">
        <CardHeader className="px-8 py-5 border-b border-white/5 bg-white/3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-black tracking-tight">
              {userRole === 'vendor' ? 'Incoming Opportunities' : 'Your RFQs'}
            </CardTitle>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/30 mt-0.5">
              {isLoading ? 'Loading...' : `${rfqs.length} total requests`}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 pl-8 h-11">ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11">Equipment</TableHead>
                  {userRole === 'client' && <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11">Vendors</TableHead>}
                  {userRole === 'client' && <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11">Bids</TableHead>}
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11">Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 pr-8 text-right h-11">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rfqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
                        <FileText className="h-10 w-10 opacity-20" />
                        <p className="font-bold">
                          {isLoading ? 'Loading RFQs...' : 'No RFQs yet'}
                        </p>
                        {!isLoading && (
                          <p className="text-xs">Create your first RFQ from the Equipment Catalog.</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rfqs.map((rfq: any) => {
                    const sc = STATUS_CONFIG[rfq.status] || STATUS_CONFIG.open;
                    const hasBids = (rfq.bids?.length || 0) > 0;
                    return (
                      <TableRow key={rfq.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                        <TableCell className="font-mono text-[11px] font-black text-muted-foreground/30 pl-8 py-4">
                          #{String(rfq.id).padStart(4, '0')}
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="font-bold text-sm text-foreground group-hover:text-amber-300 transition-colors">
                            {rfq.equipmentName}
                          </p>
                        </TableCell>
                        {userRole === 'client' && (
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground/30" />
                              <span className="text-xs font-bold text-muted-foreground/50">{rfq.vendors?.length || 0}</span>
                            </div>
                          </TableCell>
                        )}
                        {userRole === 'client' && (
                          <TableCell className="py-4">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black',
                              hasBids
                                ? 'bg-violet-400/10 text-violet-400'
                                : 'bg-white/5 text-muted-foreground/30'
                            )}>
                              {hasBids && <Circle className="h-1.5 w-1.5 fill-current" />}
                              {rfq.bids?.length || 0} received
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="py-4 text-[11px] font-semibold text-muted-foreground/40">
                          {new Date(rfq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
                            sc.bg, sc.color
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                            {sc.label}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-8">
                          {userRole === 'vendor' ? (
                            <Button
                              size="sm"
                              onClick={() => handleAction(rfq)}
                              className="h-8 px-4 gap-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-900 border border-amber-500/20 font-black text-[11px] rounded-lg transition-all"
                            >
                              <Send className="h-3 w-3" /> Bid
                            </Button>
                          ) : hasBids ? (
                            <Button
                              size="sm"
                              onClick={() => handleAction(rfq)}
                              className="h-8 px-4 bg-white/5 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 border border-white/10 hover:border-amber-500/20 font-black text-[11px] rounded-lg transition-all"
                            >
                              Compare Bids
                            </Button>
                          ) : (
                            <span className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-wider pr-1">
                              Awaiting bids
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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

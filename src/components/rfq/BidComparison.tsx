import { ArrowLeft, Check, Shield, User, Trophy, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface BidComparisonProps {
    rfq: any;
    onBack: () => void;
    onOrderCreated: () => void;
}

export function BidComparison({ rfq, onBack, onOrderCreated }: BidComparisonProps) {
    const queryClient = useQueryClient();

    const createPOMutation = useMutation({
        mutationFn: async (bidId: number) => {
            const { data } = await api.post('/orders/create', { bidId });
            return data;
        },
        onSuccess: () => {
            toast.success('Purchase Order created successfully');
            queryClient.invalidateQueries({ queryKey: ['rfqs'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onOrderCreated();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create PO');
        },
    });

    const bids = rfq.bids || [];
    const lowestPrice = bids.length > 0 ? Math.min(...bids.map((b: any) => b.price)) : 0;
    const highestPrice = bids.length > 0 ? Math.max(...bids.map((b: any) => b.price)) : 0;
    const avgPrice = bids.length > 0 ? bids.reduce((a: number, b: any) => a + b.price, 0) / bids.length : 0;

    const getSavings = (price: number) =>
        highestPrice > lowestPrice ? Math.round(((highestPrice - price) / highestPrice) * 100) : 0;

    return (
        <div className="space-y-8 animate-reveal">

            {/* ── Page header ────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Bid Comparison</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                                RFQ #{String(rfq.id).padStart(4, '0')}
                            </span>
                            <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                {rfq.equipmentName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary pills */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
                    {[
                        { label: 'Bids', value: bids.length, color: 'text-foreground' },
                        { label: 'Best Price', value: `$${lowestPrice.toLocaleString()}`, color: 'text-emerald-400' },
                        { label: 'Avg Price', value: `$${Math.round(avgPrice).toLocaleString()}`, color: 'text-amber-400' },
                    ].map((s, i) => (
                        <div key={s.label} className={cn('px-4 py-2 text-center', i < 2 && 'border-r border-white/10')}>
                            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{s.label}</p>
                            <p className={`text-base font-black mt-0.5 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Empty state ────────────────────────────────────────────────────── */}
            {bids.length === 0 && (
                <Card className="glass border-none ring-1 ring-white/10">
                    <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
                        <Clock className="h-10 w-10 text-muted-foreground/20" />
                        <p className="font-bold text-muted-foreground/40">No bids received yet</p>
                        <p className="text-xs text-muted-foreground/25">Vendors will submit their bids here.</p>
                    </CardContent>
                </Card>
            )}

            {/* ── Bid table ──────────────────────────────────────────────────────── */}
            {bids.length > 0 && (
                <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
                    <CardHeader className="px-8 py-5 border-b border-white/5 bg-white/3 flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base font-black tracking-tight">Vendor Proposals</CardTitle>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/30 mt-0.5">
                                {bids.length} bid{bids.length !== 1 ? 's' : ''} received · select one to generate PO
                            </p>
                        </div>
                        {bids.length > 1 && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-xl">
                                <TrendingDown className="h-3.5 w-3.5" />
                                Up to {getSavings(lowestPrice)}% savings vs highest bid
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                                        {['Vendor', 'Price', 'Availability', 'Cert', 'Submitted', 'Action'].map(h => (
                                            <TableHead key={h} className={cn(
                                                'font-black text-[10px] uppercase tracking-widest text-muted-foreground/40 h-11',
                                                h === 'Vendor' && 'pl-8',
                                                h === 'Action' && 'pr-8 text-right',
                                            )}>
                                                {h}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bids
                                        .slice()
                                        .sort((a: any, b: any) => a.price - b.price)
                                        .map((bid: any, idx: number) => {
                                            const isBest = bid.price === lowestPrice;
                                            const savings = getSavings(bid.price);
                                            const initials = (bid.vendorName || '?')
                                                .split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                                            return (
                                                <TableRow
                                                    key={bid.id}
                                                    className={cn(
                                                        'border-b border-white/5 transition-colors group',
                                                        isBest ? 'bg-emerald-400/3 hover:bg-emerald-400/5' : 'hover:bg-white/3'
                                                    )}
                                                >
                                                    {/* Vendor */}
                                                    <TableCell className="pl-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-transform duration-300 group-hover:scale-105',
                                                                isBest
                                                                    ? 'bg-emerald-400/15 text-emerald-400'
                                                                    : 'bg-white/5 text-muted-foreground/60'
                                                            )}>
                                                                {isBest ? <Trophy className="h-4 w-4" /> : initials}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-foreground">{bid.vendorName}</p>
                                                                {isBest && (
                                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                                                                        Best Price
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Price */}
                                                    <TableCell className="py-5">
                                                        <div>
                                                            <p className={cn(
                                                                'text-xl font-black tracking-tighter',
                                                                isBest ? 'text-emerald-400' : 'text-foreground'
                                                            )}>
                                                                ${bid.price.toLocaleString()}
                                                            </p>
                                                            {savings > 0 && (
                                                                <p className="text-[10px] font-bold text-emerald-400/70 mt-0.5">
                                                                    saves {savings}% vs worst
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Availability */}
                                                    <TableCell className="py-5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                                            <span className="text-xs font-semibold text-muted-foreground/60">
                                                                {bid.availability || 'Ready'}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Cert */}
                                                    <TableCell className="py-5">
                                                        {bid.certFile ? (
                                                            <div className="flex items-center gap-1.5 text-blue-400">
                                                                <Shield className="h-3.5 w-3.5" />
                                                                <span className="text-[11px] font-black uppercase tracking-wider">Verified</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground/20 font-bold">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Date */}
                                                    <TableCell className="py-5 text-[11px] font-semibold text-muted-foreground/40 font-mono">
                                                        {new Date(bid.createdAt).toLocaleDateString('en-GB', {
                                                            day: '2-digit', month: 'short', year: '2-digit'
                                                        }).toUpperCase()}
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell className="py-5 text-right pr-8">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => createPOMutation.mutate(bid.id)}
                                                            disabled={createPOMutation.isPending}
                                                            className={cn(
                                                                'h-9 px-5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95',
                                                                isBest
                                                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20'
                                                                    : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10'
                                                            )}
                                                        >
                                                            {createPOMutation.isPending ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                'Award PO'
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

import { ArrowLeft, Check, FileText, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
            onOrderCreated(); // Navigate to Order History or similar
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create PO');
        }
    });

    const bids = rfq.bids || [];
    const lowestPrice = Math.min(...bids.map((b: any) => b.price));

    return (
        <div className="space-y-10 animate-reveal">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onBack}
                        className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center p-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter">Strategic Bid Analysis</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded">PROTOCOL #{rfq.id}</span>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Asset: {rfq.equipmentName}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl ring-1 ring-white/10">
                    <div className="px-4 py-2">
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">Responses</p>
                        <p className="text-xl font-black mt-1 leading-none">{bids.length}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="px-4 py-2">
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">Best Quote</p>
                        <p className="text-xl font-black mt-1 leading-none text-success">${lowestPrice.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5 bg-white/5">
                    <CardTitle className="text-xl font-black tracking-tight">Comparative Matrix</CardTitle>
                    <CardDescription className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-tight mt-1">Secure vendor selection and PO generation protocol</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-white/5 hover:bg-transparent h-12">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pl-8">Strategic Partner</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Financial Quote</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Asset Availability</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Vetting/Compliance</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Timestamp</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pr-8 text-right">Selection</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bids.map((bid: any) => {
                                    const isLowest = bid.price === lowestPrice;
                                    return (
                                        <TableRow key={bid.id} className={cn(
                                            "group border-b border-white/5 transition-all hover:bg-white/5",
                                            isLowest && "bg-success/5"
                                        )}>
                                            <TableCell className="pl-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/5">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-black text-foreground">{bid.vendorName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xl font-black tracking-tighter text-foreground">
                                                        ${bid.price.toLocaleString()}
                                                    </span>
                                                    {isLowest && (
                                                        <Badge variant="success" className="w-fit text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-none shadow-sm shadow-success/20">
                                                            Optimal Price
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 rounded-full bg-success/10">
                                                        <Check className="h-3 w-3 text-success" />
                                                    </div>
                                                    <span className="text-xs font-bold text-muted-foreground/70">{bid.availability || 'Verified Ready'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {bid.certFile ? (
                                                    <div className="flex items-center gap-2 text-primary cursor-pointer hover:underline" title="View Certification">
                                                        <Shield className="h-4 w-4" />
                                                        <span className="text-[11px] font-black uppercase tracking-tight">Verified Protocol</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-black uppercase tracking-tight text-muted-foreground/20 italic">No File Protocol</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-[11px] font-bold text-muted-foreground/40 font-mono">
                                                {new Date(bid.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className={cn(
                                                        "h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-lg shadow-primary/10",
                                                        createPOMutation.isPending && "opacity-50 cursor-wait"
                                                    )}
                                                    onClick={() => createPOMutation.mutate(bid.id)}
                                                    disabled={createPOMutation.isPending}
                                                >
                                                    {createPOMutation.isPending ? (
                                                        <span className="flex items-center gap-2">Generating...</span>
                                                    ) : (
                                                        'Select & Execute PO'
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
        </div>
    );
}


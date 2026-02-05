import { ArrowLeft, Check, FileText, Shield, User } from 'lucide-react';
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
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to RFQs
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bid Comparison</h2>
                    <p className="text-muted-foreground">
                        RFQ #{rfq.id} • {rfq.equipmentName}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Received Bids ({bids.length})</CardTitle>
                    <CardDescription>Review bids and select a vendor to generate a Purchase Order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Availability</TableHead>
                                    <TableHead>Certifications</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bids.map((bid: any) => {
                                    const isLowest = bid.price === lowestPrice;
                                    return (
                                        <TableRow key={bid.id} className={isLowest ? 'bg-success/5' : ''}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{bid.vendorName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">
                                                        ${bid.price.toLocaleString()}
                                                    </span>
                                                    {isLowest && (
                                                        <Badge variant="success" className="w-fit text-[10px] h-5 px-1.5">
                                                            Lowest Price
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Check className="h-4 w-4 text-success" />
                                                    <span>{bid.availability || 'Available'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {bid.certFile ? (
                                                    <div className="flex items-center gap-1.5 text-primary cursor-not-allowed opacity-70" title="Download not implemented">
                                                        <Shield className="h-4 w-4" />
                                                        <span className="text-sm underline">View Cert</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No files</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(bid.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => createPOMutation.mutate(bid.id)}
                                                    disabled={createPOMutation.isPending}
                                                >
                                                    {createPOMutation.isPending ? 'Creating PO...' : 'Select & Create PO'}
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

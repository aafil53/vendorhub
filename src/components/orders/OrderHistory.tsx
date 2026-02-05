import { FileText, Truck, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function OrderHistory() {
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data } = await api.get('/orders/history');
            return data;
        }
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Equipment</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No orders found yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-sm">
                                                {order.poDetails?.poNumber || `PO-${order.id}`}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {order.bid?.rfq?.equipment?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                                    <span>{order.vendor?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                ${order.bid?.price?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'completed' ? 'success' : 'secondary' as any}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

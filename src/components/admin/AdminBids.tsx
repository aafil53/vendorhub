import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function AdminBids() {
  const { data: allBids = [], refetch } = useQuery({
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
    <div>
      {allBids.length === 0 ? (
        <p className="text-muted-foreground">No bids to review</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Vendor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cert</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>RFQ</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBids.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>{b.vendorName}</TableCell>
                  <TableCell className="font-semibold">{b.price}</TableCell>
                  <TableCell><Badge variant={b.certFile ? 'success' : 'muted'}>{b.certFile ? 'Has Cert' : 'Missing'}</Badge></TableCell>
                  <TableCell>{b.availability}</TableCell>
                  <TableCell>{b.equipmentName}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleApprove(b.id)}>Approve</Button>
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
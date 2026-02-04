import { FileText, Clock, CheckCircle, Users } from 'lucide-react';
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
import { RFQ } from '@/types/vendor';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface RFQListProps {
  onViewBids: (rfq: any) => void;
}

export function RFQList({ onViewBids }: RFQListProps) {
  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data } = await api.get('/rfqs');
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'muted';
      case 'awarded': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total RFQs</p>
              <p className="text-2xl font-bold">{rfqs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RFQs Open</p>
              <p className="text-2xl font-bold">{rfqs.filter((r:any) => r.status === 'open').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Awarded</p>
              <p className="text-2xl font-bold">{rfqs.filter((r:any) => r.status === 'awarded').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQ Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>RFQ ID</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Bids</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq: any) => (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-mono text-sm">#{rfq.id}</TableCell>
                    <TableCell className="font-medium">{rfq.equipmentName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{rfq.vendors?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rfq.bids?.length > 0 ? 'default' : 'muted'}>
                        {rfq.bids?.length || 0} received
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(rfq.status) as any}>
                        {rfq.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant={rfq.bids?.length > 0 ? 'default' : 'outline'}
                        onClick={() => onViewBids(rfq)}
                        disabled={rfq.bids?.length === 0}
                      >
                        {rfq.bids?.length > 0 ? 'Compare Bids' : 'Awaiting Bids'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

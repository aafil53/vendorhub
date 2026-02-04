import { useState } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Equipment } from '@/types/vendor';
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

interface EquipmentTableProps {
  onCheckVendors: (equipment: Equipment) => void;
}

export function EquipmentTable({ onCheckVendors }: EquipmentTableProps) {
  const [filter, setFilter] = useState<'all' | 'shortage'>('all');

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: async () => {
      const { data } = await api.get('/equipments');
      return data;
    }
  });

  const filteredEquipment = filter === 'shortage'
    ? equipments.filter((e: any) => e.shortage > 0)
    : equipments;

  const getCertificationColor = (cert: any) => {
    if (cert === true) return 'success';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Equipment Inventory</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Equipment
          </Button>
          <Button
            variant={filter === 'shortage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('shortage')}
            className={filter === 'shortage' ? '' : 'text-warning border-warning/50 hover:bg-warning/10'}
          >
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Shortages ({equipments.filter((e: any) => e.shortage > 0).length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Equipment</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Specifications</TableHead>
                <TableHead>Rental Period</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((item: any) => (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "transition-colors",
                  )}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{typeof item.specs === 'object' ? JSON.stringify(item.specs) : item.specs}</TableCell>
                  <TableCell>{item.rentalPeriod}d</TableCell>
                  <TableCell>
                    <Badge variant={getCertificationColor(item.certReq) as any}>
                      {item.certReq ? 'Required' : 'Not required'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => onCheckVendors(item)}
                      className="gap-1.5"
                    >
                      Check Vendors
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

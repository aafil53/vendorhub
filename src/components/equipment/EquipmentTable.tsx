import { useState } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Equipment } from '@/types/vendor';
import { mockEquipment } from '@/data/mockData';
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

interface EquipmentTableProps {
  onCheckVendors: (equipment: Equipment) => void;
}

export function EquipmentTable({ onCheckVendors }: EquipmentTableProps) {
  const [filter, setFilter] = useState<'all' | 'shortage'>('all');

  const filteredEquipment = filter === 'shortage' 
    ? mockEquipment.filter(e => e.shortage > 0)
    : mockEquipment;

  const getCertificationColor = (cert: string) => {
    switch (cert) {
      case 'ARAMCO': return 'success';
      case 'Third-Party': return 'default';
      case 'Labour': return 'muted';
      default: return 'secondary';
    }
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
            Shortages ({mockEquipment.filter(e => e.shortage > 0).length})
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
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Required</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((item) => (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "transition-colors",
                    item.shortage > 0 && "bg-warning/5 hover:bg-warning/10"
                  )}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.specifications}</TableCell>
                  <TableCell>{item.rentalPeriod}</TableCell>
                  <TableCell>
                    <Badge variant={getCertificationColor(item.certificationRequired) as any}>
                      {item.certificationRequired}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{item.available}</TableCell>
                  <TableCell className="text-center font-medium">{item.required}</TableCell>
                  <TableCell className="text-center">
                    {item.shortage > 0 ? (
                      <div className="flex items-center justify-center gap-1.5 text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">-{item.shortage}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">OK</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.shortage > 0 && (
                      <Button 
                        size="sm" 
                        onClick={() => onCheckVendors(item)}
                        className="gap-1.5"
                      >
                        Check Vendors
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
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

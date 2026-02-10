import { useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
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
    <Card className="glass border-none ring-1 ring-white/10 animate-reveal delay-100 overflow-hidden">
      <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-white/5">
        <div>
          <CardTitle className="text-xl font-black tracking-tight">System Inventory</CardTitle>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mt-1">Live Asset Monitoring</p>
        </div>
        <div className="flex gap-3 bg-muted/20 p-1.5 rounded-xl ring-1 ring-white/10">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs font-bold rounded-lg px-4 h-9"
          >
            All Assets
          </Button>
          <Button
            variant={filter === 'shortage' ? 'destructive' : 'ghost'}
            size="sm"
            onClick={() => setFilter('shortage')}
            className={cn(
              "text-xs font-bold rounded-lg px-4 h-9",
              filter !== 'shortage' && "text-warning hover:bg-warning/10"
            )}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Shortages ({equipments.filter((e: any) => e.shortage > 0).length})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5 hover:bg-transparent px-8">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pl-8">Asset Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Category</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Specifications</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Runtime</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Protocol</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 pr-8 text-right">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground/40 font-bold italic">
                    {isLoading ? 'Decrypting asset data...' : 'No critical shortages detected'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item: any, idx: number) => (
                  <TableRow
                    key={item.id}
                    className="group border-b border-white/5 transition-all hover:bg-white/5"
                  >
                    <TableCell className="font-bold text-foreground py-5 pl-8">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/5 border-none font-bold text-[10px] tracking-tight uppercase">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] font-semibold text-muted-foreground/60 max-w-[200px] truncate">
                      {typeof item.specs === 'object' ? JSON.stringify(item.specs) : item.specs}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary/80">{item.rentalPeriod} DAYS</TableCell>
                    <TableCell>
                      <Badge
                        variant={getCertificationColor(item.certReq) as any}
                        className="font-black text-[9px] uppercase tracking-[0.1em] px-2"
                      >
                        {item.certReq ? 'Required' : 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onCheckVendors(item)}
                        className="h-9 px-4 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all gap-2 font-bold text-xs"
                      >
                        Connect Vendors
                        <ExternalLink className="h-3.5 w-3.5" />
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
  );
}

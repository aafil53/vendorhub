import { CheckCircle, TrendingDown, Clock, Award } from 'lucide-react';
import { Bid } from '@/types/vendor';
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
import { cn } from '@/lib/utils';

interface BiddingComparisonProps {
  bids: Bid[];
  equipmentName: string;
  quantity: number;
  onSelectVendor: (bid: Bid) => void;
  onBack: () => void;
}

export function BiddingComparison({ bids, equipmentName, quantity, onSelectVendor, onBack }: BiddingComparisonProps) {
  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedBids[0]?.price || 0;

  const getCertificationColor = (cert: string) => {
    switch (cert) {
      case 'ARAMCO': return 'success';
      case 'Third-Party': return 'default';
      case 'Labour': return 'muted';
      default: return 'secondary';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Bid Comparison</CardTitle>
              <CardDescription>
                Compare vendor bids for {equipmentName} (Qty: {quantity})
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              ← Back to RFQs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bids Received</p>
                <p className="text-xl font-bold">{bids.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lowest Bid</p>
                <p className="text-xl font-bold text-success">{formatPrice(lowestPrice)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Award className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">{formatPrice(lowestPrice * quantity)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vendor Bids</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Rank</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBids.map((bid, index) => {
                  const isLowest = bid.price === lowestPrice;
                  const totalPrice = bid.price * quantity;
                  
                  return (
                    <TableRow 
                      key={bid.id}
                      className={cn(
                        "transition-colors",
                        isLowest && "bg-success/5"
                      )}
                    >
                      <TableCell>
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full font-bold",
                          isLowest 
                            ? "bg-success text-success-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-sm font-semibold text-primary">
                              {bid.vendorName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{bid.vendorName}</p>
                            {isLowest && (
                              <Badge variant="success" className="text-xs mt-0.5">
                                Lowest Bid
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(bid.price)}
                      </TableCell>
                      <TableCell className={cn(
                        "font-bold",
                        isLowest ? "text-success" : "text-foreground"
                      )}>
                        {formatPrice(totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bid.availability === 'Immediate' ? 'success' : 'muted'}>
                          {bid.availability}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCertificationColor(bid.certification) as any}>
                          {bid.certification}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(bid.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm"
                          variant={isLowest ? "default" : "outline"}
                          onClick={() => onSelectVendor(bid)}
                          className="gap-1.5"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Select
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

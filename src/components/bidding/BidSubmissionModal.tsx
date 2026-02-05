import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface BidSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: any;
}

export function BidSubmissionModal({ isOpen, onClose, rfq }: BidSubmissionModalProps) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState('');
  const [availability, setAvailability] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);

  const submitBid = useMutation({
    mutationFn: async () => {
      // Create form data if we were actually uploading files.
      // For now, we simulate file upload by sending the filename string.
      const payload = {
        rfqId: rfq.id,
        price: parseFloat(price),
        availability,
        certFile: certFile ? certFile.name : null
      };
      
      const { data } = await api.post('/bids/submit', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Bid submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      onClose();
      setPrice('');
      setAvailability('');
      setCertFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit bid');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !availability) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitBid.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Bid for {rfq?.equipmentName}</DialogTitle>
          <DialogDescription>
            Enter your price and availability details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price ($)
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              placeholder="e.g. 5000"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="availability" className="text-right">
              Availability
            </Label>
            <Input
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Immediate, 2 days"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cert" className="text-right">
              Cert File
            </Label>
            <div className="col-span-3">
               <Input
                id="cert"
                type="file"
                onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Mock upload only.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitBid.isPending}>
              {submitBid.isPending ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

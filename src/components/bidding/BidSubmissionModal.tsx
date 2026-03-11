import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Calendar, Paperclip, Send, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

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
      const { data } = await api.post('/bids/submit', {
        rfqId: rfq.id,
        price: parseFloat(price),
        availability,
        certFile: certFile ? certFile.name : null,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Bid submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit bid');
    },
  });

  const handleClose = () => {
    setPrice('');
    setAvailability('');
    setCertFile(null);
    onClose();
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!price || !availability) {
      toast.error('Please fill in price and availability');
      return;
    }
    if (parseFloat(price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    submitBid.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass border-none ring-1 ring-white/10 shadow-2xl p-0 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-white/5 bg-white/3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                Submit Bid
              </div>
              <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                {rfq?.equipmentName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground/40 mt-0.5 font-semibold">
                RFQ #{String(rfq?.id || 0).padStart(4, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">
              Your Price (USD) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
              <Input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 5000"
                className="pl-9 h-11 bg-white/5 border-white/10 focus-visible:ring-indigo-400/40 focus-visible:border-indigo-400/30 rounded-xl font-bold text-sm placeholder:text-muted-foreground/20"
                min="1"
                required
              />
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">
              Availability *
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
              <Input
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                placeholder="e.g. Immediate, 2-3 days"
                className="pl-9 h-11 bg-white/5 border-white/10 focus-visible:ring-indigo-400/40 focus-visible:border-indigo-400/30 rounded-xl font-bold text-sm placeholder:text-muted-foreground/20"
                required
              />
            </div>
          </div>

          {/* Cert file */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">
              Certification File <span className="text-muted-foreground/20 normal-case font-semibold">(optional)</span>
            </Label>
            <div
              className={cn(
                'relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-all cursor-pointer',
                certFile
                  ? 'border-emerald-400/30 bg-emerald-400/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
              onClick={() => document.getElementById('cert-upload')?.click()}
            >
              <Paperclip className={cn('h-4 w-4 shrink-0', certFile ? 'text-emerald-400' : 'text-muted-foreground/30')} />
              <span className={cn('text-xs font-bold truncate', certFile ? 'text-emerald-300' : 'text-muted-foreground/30')}>
                {certFile ? certFile.name : 'Click to attach file…'}
              </span>
              <input
                id="cert-upload"
                type="file"
                className="sr-only"
                onChange={e => setCertFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/20 font-semibold">Mock upload — filename only stored</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 font-black text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitBid.isPending || !price || !availability}
            className="flex-1 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-40 gap-2"
          >
            {submitBid.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
            ) : (
              <><Send className="h-4 w-4" />Submit Bid</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle, Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RFQDetails {
  id: number;
  equipmentName: string;
  clientName: string;
  clientEmail?: string;
  deadline?: string;
}

interface BidData {
  price: number | null;
  availability: string;
  certFile: File | null;
  termsConfirmed: boolean;
}

interface CompletenessChecklistProps {
  bidData: BidData;
}

function CompletenessChecklist({ bidData }: CompletenessChecklistProps) {
  const items = [
    { key: 'price', label: 'Price entered', done: bidData.price !== null && bidData.price > 0 },
    { key: 'availability', label: 'Availability selected', done: !!bidData.availability },
    { key: 'cert', label: 'Certification uploaded', done: !!bidData.certFile },
    { key: 'terms', label: 'Terms confirmed', done: bidData.termsConfirmed },
  ];

  const completedCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-2">Bid Response Checklist</h4>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{completedCount}/{totalCount} complete</p>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.key}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-lg transition-colors',
              item.done
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            )}
          >
            {item.done ? (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
            )}
            <span className={cn(
              'text-sm font-medium',
              item.done ? 'text-green-700' : 'text-gray-600'
            )}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BidResponseModalProps {
  open: boolean;
  rfq: RFQDetails | null;
  draftBidData?: Partial<BidData>;
  onClose: () => void;
  onSubmit: (data: BidData) => Promise<void>;
  onSaveDraft: (data: BidData) => Promise<void>;
  isLoading?: boolean;
}

export function BidResponseModal({
  open,
  rfq,
  draftBidData,
  onClose,
  onSubmit,
  onSaveDraft,
  isLoading = false,
}: BidResponseModalProps) {
  const [step, setStep] = useState<'accept' | 'bid'>('accept');
  const [acceptLoading, setAcceptLoading] = useState(false);
  
  const [bidData, setBidData] = useState<BidData>({
    price: draftBidData?.price ?? null,
    availability: draftBidData?.availability ?? '',
    certFile: draftBidData?.certFile ?? null,
    termsConfirmed: draftBidData?.termsConfirmed ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [certFileName, setCertFileName] = useState<string | null>(
    draftBidData?.certFile instanceof File ? draftBidData.certFile.name : null
  );

  useEffect(() => {
    if (open) {
      setStep('accept');
      if (!draftBidData) {
        setBidData({
          price: null,
          availability: '',
          certFile: null,
          termsConfirmed: false,
        });
        setCertFileName(null);
      }
    }
  }, [open, rfq, draftBidData]);

  const handleAccept = async () => {
    setAcceptLoading(true);
    try {
      await api.post(`/bids/new/accept`, { rfqId: rfq?.id });
      toast.success('RFQ accepted. Now fill in your bid details.');
      setStep('bid');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to accept RFQ');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    setBidData(prev => ({ ...prev, price: value }));
  };

  const handleAvailabilityChange = (value: string) => {
    setBidData(prev => ({ ...prev, availability: value }));
  };

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPG, PNG, and DOC files are allowed');
        return;
      }
      setBidData(prev => ({ ...prev, certFile: file }));
      setCertFileName(file.name);
    }
  };

  const isComplete = bidData.price && bidData.price > 0 && bidData.availability && bidData.termsConfirmed;

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft(bidData);
      toast.success('Bid saved as draft');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      await onSubmit(bidData);
      toast.success('Bid submitted successfully to the buyer!');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit bid');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent className={cn(
        "overflow-y-auto",
        step === 'accept' ? "sm:max-w-lg max-h-[90vh]" : "sm:max-w-2xl max-h-[90vh]"
      )}>
        <DialogHeader>
          <DialogTitle>
            {step === 'accept' ? 'Accept RFQ Invitation' : 'Submit Bid'}
            {rfq && (
              <p className="text-sm text-gray-500 font-normal mt-1">
                RFQ-{String(rfq.id).padStart(4, '0')} • {rfq.equipmentName}
              </p>
            )}
          </DialogTitle>
        </DialogHeader>

        {rfq && step === 'accept' && (
          <div className="space-y-6">
            {/* RFQ Details Card */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg space-y-3">
                <div>
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Equipment</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{rfq.equipmentName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Buyer</p>
                    <p className="font-semibold text-gray-900 mt-1">{rfq.clientName}</p>
                    {rfq.clientEmail && (
                      <p className="text-xs text-gray-600 mt-0.5">{rfq.clientEmail}</p>
                    )}
                  </div>
                  {rfq.deadline && (
                    <div>
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Deadline</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {new Date(rfq.deadline).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Click <span className="font-semibold">"Accept"</span> to express your interest in bidding for this RFQ. 
                  After accepting, you'll fill in your price, availability, and certification details.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} disabled={acceptLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={acceptLoading}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {acceptLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Accept & Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {rfq && step === 'bid' && (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => setStep('accept')}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: Checklist */}
              <div className="md:col-span-1">
                <CompletenessChecklist bidData={bidData} />
              </div>

              {/* Right: Bid Form */}
              <div className="md:col-span-2 space-y-4">
                {/* RFQ Info */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-1.5">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">RFQ Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">Buyer</p>
                      <p className="font-semibold text-gray-900">{rfq.clientName}</p>
                    </div>
                    {rfq.deadline && (
                      <div>
                        <p className="text-xs text-indigo-600 font-medium">Deadline</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(rfq.deadline).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={bidData.price ?? ''}
                      onChange={handlePriceChange}
                      className="pl-7 text-lg font-semibold"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <Label htmlFor="availability" className="text-sm font-semibold text-gray-700">
                    Availability <span className="text-red-500">*</span>
                  </Label>
                  <Select value={bidData.availability} onValueChange={handleAvailabilityChange}>
                    <SelectTrigger id="availability" className="mt-1.5">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="1-week">1 week</SelectItem>
                      <SelectItem value="2-weeks">2 weeks</SelectItem>
                      <SelectItem value="3-weeks">3 weeks</SelectItem>
                      <SelectItem value="1-month">1 month</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Certification */}
                <div>
                  <Label htmlFor="cert" className="text-sm font-semibold text-gray-700">
                    Certification Document
                  </Label>
                  <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('cert-input')?.click()}
                  >
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    {certFileName ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{certFileName}</p>
                        <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Drag & drop or click to upload</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC (max 5MB)</p>
                      </div>
                    )}
                    <input
                      id="cert-input"
                      type="file"
                      hidden
                      onChange={handleCertFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={bidData.termsConfirmed}
                    onChange={(e) => setBidData(prev => ({ ...prev, termsConfirmed: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I confirm this bid is valid for <span className="font-semibold">30 days</span> and accept the standard terms and conditions.
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isLoading || saving}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isLoading || saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isComplete || isLoading || saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Bid to Buyer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

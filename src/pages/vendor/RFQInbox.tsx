import { useState, useEffect } from 'react';
import {
  Search, Filter, FileText, Eye, MoreVertical, Clock, AlertCircle,
  Loader2, RefreshCw, Zap, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActiveRFQ {
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentCategory: string | null;
  equipmentSpecs: string | null;
  clientName: string;
  clientEmail: string | null;
  status: 'open';
  createdAt: string;
  deadline: string | null;
  acceptedVendors: number[];
  myBid: null;
}

interface DeclineReason {
  value: string;
  label: string;
}

const DECLINE_REASONS: DeclineReason[] = [
  { value: 'stock_unavailable', label: 'Stock unavailable' },
  { value: 'lead_time_incompatible', label: 'Lead time incompatible' },
  { value: 'pricing_not_feasible', label: 'Pricing not feasible' },
  { value: 'compliance_mismatch', label: 'Compliance/Certification mismatch' },
  { value: 'other', label: 'Other reason' },
];

function formatDeadlineCountdown(deadline: string | null): { text: string; status: 'urgent' | 'normal' | 'expired' } {
  if (!deadline) return { text: 'No deadline', status: 'normal' };

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs < 0) {
    return { text: 'Expired', status: 'expired' };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return { 
      text: `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`,
      status: diffDays <= 2 ? 'urgent' : 'normal'
    };
  }

  return { 
    text: `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`,
    status: 'urgent'
  };
}

function RFQCard({ rfq, onOpenDetail, onDecline }: { 
  rfq: ActiveRFQ;
  onOpenDetail: (rfq: ActiveRFQ) => void;
  onDecline: (rfq: ActiveRFQ) => void;
}) {
  const countdown = formatDeadlineCountdown(rfq.deadline);
  const deadlineExpired = countdown.status === 'expired';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
      <CardContent className="p-5 space-y-4">
        {/* Header: Equipment + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              RFQ-{String(rfq.id).padStart(4, '0')}
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-1 truncate">
              {rfq.equipmentName}
            </h3>
            {rfq.equipmentCategory && (
              <p className="text-xs text-gray-500 mt-0.5">{rfq.equipmentCategory}</p>
            )}
          </div>
          {deadlineExpired ? (
            <div className="px-3 py-1 bg-red-50 rounded-full">
              <span className="text-xs font-bold text-red-700">Expired</span>
            </div>
          ) : countdown.status === 'urgent' ? (
            <div className="px-3 py-1 bg-amber-50 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700">Urgent</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-blue-50 rounded-full">
              <span className="text-xs font-bold text-blue-700">Active</span>
            </div>
          )}
        </div>

        {/* Specs (if available) */}
        {rfq.equipmentSpecs && (
          <p className="text-sm text-gray-600 line-clamp-2">{rfq.equipmentSpecs}</p>
        )}

        {/* Buyer & Deadline */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Buyer</p>
            <p className="font-semibold text-gray-900 truncate">{rfq.clientName}</p>
            {rfq.clientEmail && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{rfq.clientEmail}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Deadline</p>
            <p className={cn(
              'font-semibold',
              deadlineExpired ? 'text-red-700' : countdown.status === 'urgent' ? 'text-amber-700' : 'text-gray-900'
            )}>
              {countdown.text}
            </p>
            {rfq.deadline && (
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(rfq.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onOpenDetail(rfq)}
            disabled={deadlineExpired}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Open RFQ
          </Button>
          <Button
            onClick={() => onDecline(rfq)}
            disabled={deadlineExpired}
            variant="outline"
            className="px-3"
            title="Decline this RFQ"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RFQInbox() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [search, setSearch] = useState('');
  const [filterDeadline, setFilterDeadline] = useState('all');
  const [selectedRFQ, setSelectedRFQ] = useState<ActiveRFQ | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineRFQ, setDeclineRFQ] = useState<ActiveRFQ | null>(null);
  const [declineReasonValue, setDeclineReasonValue] = useState('');
  const [declineCustomReason, setDeclineCustomReason] = useState('');
  const [declineLoading, setDeclineLoading] = useState(false);

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
    socket.on('notification:new', refresh);
    socket.on('rfq:expired', refresh);
    return () => {
      socket.off('notification:new', refresh);
      socket.off('rfq:expired', refresh);
    };
  }, [socket, queryClient]);

  // Fetch active RFQs
  const { data: rfqs = [], isLoading, isRefetching } = useQuery({
    queryKey: ['vendor-rfqs'],
    queryFn: async () => {
      const { data } = await api.get('/rfq/vendor-rfqs');
      return data as ActiveRFQ[];
    },
    refetchInterval: 30_000,
  });

  // Filter logic
  const filtered = rfqs.filter((rfq) => {
    const matchSearch =
      !search ||
      String(rfq.id).includes(search) ||
      rfq.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      rfq.clientName?.toLowerCase().includes(search.toLowerCase());

    const countdown = formatDeadlineCountdown(rfq.deadline);
    let matchDeadline = true;
    if (filterDeadline === 'today') {
      matchDeadline = countdown.text.includes('hour');
    } else if (filterDeadline === 'week') {
      matchDeadline = countdown.text.includes('day') && countdown.status === 'normal';
    } else if (filterDeadline === 'urgent') {
      matchDeadline = countdown.status === 'urgent';
    }

    return matchSearch && matchDeadline;
  });

  const stats = {
    total: rfqs.length,
    urgent: rfqs.filter(r => formatDeadlineCountdown(r.deadline).status === 'urgent').length,
    active: rfqs.filter(r => formatDeadlineCountdown(r.deadline).status === 'normal').length,
  };

  // Handle decline
  const handleDecline = async () => {
    if (!declineRFQ) return;

    setDeclineLoading(true);
    try {
      const reason = declineReasonValue === 'other' ? declineCustomReason : declineReasonValue;
      if (!reason) {
        toast.error('Please select or enter a decline reason');
        setDeclineLoading(false);
        return;
      }

      await api.post(`/bids/new/decline`, {
        rfqId: declineRFQ.id,
        declineReason: reason,
      });

      toast.success(`RFQ declined successfully`);
      setShowDeclineModal(false);
      setDeclineRFQ(null);
      setDeclineReasonValue('');
      setDeclineCustomReason('');
      
      queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to decline RFQ');
    } finally {
      setDeclineLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-indigo-600" />
            Active RFQs
          </h1>
          <p className="text-sm text-gray-600 mt-1">Open RFQ invitations ready for bidding</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['vendor-rfqs'] })}
          disabled={isRefetching}
        >
          <RefreshCw className={cn('w-4 h-4', isRefetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-indigo-500 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Urgent</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.urgent}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="shadow-none border border-gray-200">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQ ID, equipment, buyer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <Select value={filterDeadline} onValueChange={setFilterDeadline}>
            <SelectTrigger className="w-44 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Deadline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RFQs</SelectItem>
              <SelectItem value="urgent">Urgent (≤2 days)</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* RFQ Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-none border border-gray-200">
          <CardContent className="py-16 px-6 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {rfqs.length === 0 ? 'No active RFQs yet' : 'No RFQs match your filters'}
            </h3>
            <p className="text-sm text-gray-500">
              {rfqs.length === 0
                ? 'Check back later for new RFQ invitations'
                : 'Try adjusting your search or filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rfq) => (
            <RFQCard
              key={rfq.id}
              rfq={rfq}
              onOpenDetail={setSelectedRFQ}
              onDecline={(r) => {
                setDeclineRFQ(r);
                setShowDeclineModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* RFQ Detail Dialog */}
      <Dialog open={!!selectedRFQ} onOpenChange={(open) => !open && setSelectedRFQ(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              RFQ-{selectedRFQ && String(selectedRFQ.id).padStart(4, '0')}
            </DialogTitle>
          </DialogHeader>

          {selectedRFQ && (
            <div className="space-y-5">
              {/* Equipment Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipment</h4>
                <p className="text-lg font-bold text-gray-900">{selectedRFQ.equipmentName}</p>
                {selectedRFQ.equipmentCategory && (
                  <p className="text-sm text-gray-600 mt-1">Category: {selectedRFQ.equipmentCategory}</p>
                )}
                {selectedRFQ.equipmentSpecs && (
                  <p className="text-sm text-gray-600 mt-2">{selectedRFQ.equipmentSpecs}</p>
                )}
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Buyer</h4>
                  <p className="font-semibold text-gray-900">{selectedRFQ.clientName}</p>
                  {selectedRFQ.clientEmail && (
                    <p className="text-xs text-gray-500 mt-1">{selectedRFQ.clientEmail}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Deadline</h4>
                  <p className="font-semibold text-gray-900">
                    {formatDeadlineCountdown(selectedRFQ.deadline).text}
                  </p>
                  {selectedRFQ.deadline && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(selectedRFQ.deadline).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Created */}
              <div className="text-xs text-gray-500">
                Posted {new Date(selectedRFQ.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedRFQ(null)}
            >
              Close
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              onClick={() => {
                setSelectedRFQ(null);
                // Navigate to bid form - will be implemented in Phase 2
                toast.info('Bid form will open (Phase 2)');
              }}
            >
              <Zap className="w-4 h-4" />
              Start Bidding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Decline RFQ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {declineRFQ?.equipmentName}
              </p>
              <p className="text-xs text-gray-500">
                RFQ-{declineRFQ && String(declineRFQ.id).padStart(4, '0')}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Reason for declining
              </label>
              <Select value={declineReasonValue} onValueChange={setDeclineReasonValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {DECLINE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {declineReasonValue === 'other' && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Please specify
                </label>
                <textarea
                  value={declineCustomReason}
                  onChange={(e) => setDeclineCustomReason(e.target.value)}
                  placeholder="Enter your reason…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeclineModal(false)}
              disabled={declineLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineLoading}
            >
              {declineLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Decline RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

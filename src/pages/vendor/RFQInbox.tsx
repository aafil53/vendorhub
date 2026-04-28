import { useState, useCallback, useEffect } from "react";
import {
  Search, Filter, Clock, Building2, CheckCircle,
  XCircle, Send, Eye, AlertTriangle, Inbox,
  Loader2, RefreshCw, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { BidSubmissionModal } from "@/components/bidding/BidSubmissionModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// ─── Countdown badge ──────────────────────────────────────────────────────────
function DeadlineBadge({ deadline }: { deadline: string | null | undefined }) {
  const [label, setLabel] = useState("");
  const [urgency, setUrgency] = useState<"ok" | "warn" | "urgent" | "expired">("ok");

  const compute = useCallback(() => {
    if (!deadline) return;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) { setLabel("Expired"); setUrgency("expired"); return; }
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setLabel(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    setUrgency(diff < 3_600_000 ? "urgent" : diff < 86_400_000 ? "warn" : "ok");
  }, [deadline]);

  useEffect(() => {
    if (!deadline) return;
    compute();
    const id = setInterval(compute, 1_000);
    return () => clearInterval(id);
  }, [deadline, compute]);

  if (!deadline) return <span className="text-xs text-gray-400">No deadline</span>;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
      urgency === "expired" ? "bg-red-50 text-red-600 border border-red-100" :
      urgency === "urgent"  ? "bg-red-50 text-red-600 border border-red-100" :
      urgency === "warn"    ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              "bg-slate-50 text-slate-500 border border-slate-100"
    )}>
      <Clock className="h-2.5 w-2.5" />{label}
    </span>
  );
}

// ─── Derive vendor-perspective status ─────────────────────────────────────────
function deriveStatus(rfq: any, userId?: string | number) {
  const accepted = Array.isArray(rfq.acceptedVendors)
    ? rfq.acceptedVendors.map(String).includes(String(userId))
    : false;

  if (rfq.myBid) {
    if (rfq.myBid.status === "accepted") return "won";
    if (rfq.myBid.status === "rejected") return "declined";
    return "quoted"; // pending bid
  }
  if (accepted) return "accepted";
  if (rfq.status === "closed" || rfq.status === "awarded" || rfq.status === "cancelled") return "closed";
  return "new";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  new:      { label: "New",      color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500" },
  accepted: { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500" },
  quoted:   { label: "Quoted",   color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  won:      { label: "Won",      color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-400" },
  closed:   { label: "Closed",   color: "bg-gray-50 text-gray-500 border-gray-200",       dot: "bg-gray-400" },
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
function RFQDetailDialog({
  rfq,
  onClose,
  onSubmitBid,
  onAccept,
  isAccepting,
  vendorStatus,
}: {
  rfq: any;
  onClose: () => void;
  onSubmitBid: (rfq: any) => void;
  onAccept: (id: number) => void;
  isAccepting: boolean;
  vendorStatus: string;
}) {
  if (!rfq) return null;
  const sc = STATUS_CONFIG[vendorStatus] ?? STATUS_CONFIG.new;

  return (
    <Dialog open={!!rfq} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-indigo-600">RFQ-{String(rfq.id).padStart(4, "0")}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sc.color}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sc.dot}`} />
              {sc.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          {[
            ["Equipment", rfq.equipmentName],
            ["From (Client)", rfq.clientName],
            ["RFQ Status", rfq.status],
            ["Deadline", rfq.deadline
              ? new Date(rfq.deadline).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
              : "No deadline"],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 font-medium">{String(k)}</span>
              <span className="text-gray-800 font-semibold">{String(v ?? "—")}</span>
            </div>
          ))}

          {/* Existing bid info */}
          {rfq.myBid && (
            <div className="bg-indigo-50 rounded-lg p-3 mt-2">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Your Submitted Bid</p>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-600">Price</span>
                <span className="font-bold text-indigo-800">${Number(rfq.myBid.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-indigo-600">Availability</span>
                <span className="font-semibold text-indigo-800">{rfq.myBid.availability || "—"}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {vendorStatus === "new" && !rfq.myBid && (
            <>
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                disabled={isAccepting}
                onClick={() => { onAccept(rfq.id); onClose(); }}
              >
                {isAccepting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Accept
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => { onClose(); onSubmitBid(rfq); }}
              >
                <Send className="h-4 w-4 mr-1" /> Submit Bid
              </Button>
            </>
          )}
          {(vendorStatus === "accepted" || vendorStatus === "new") && !rfq.myBid && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => { onClose(); onSubmitBid(rfq); }}
            >
              <Send className="h-4 w-4 mr-1" /> Submit Bid
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RFQInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [bidRfq, setBidRfq] = useState<any>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  // ── Live socket updates ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["vendor-rfqs-inbox"] });
    socket.on("notification:new", refresh);
    socket.on("rfq:expired", refresh);
    return () => {
      socket.off("notification:new", refresh);
      socket.off("rfq:expired", refresh);
    };
  }, [socket, queryClient]);

  // ── Fetch RFQs ───────────────────────────────────────────────────────────────
  const { data: rfqs = [], isLoading, isRefetching } = useQuery({
    queryKey: ["vendor-rfqs-inbox"],
    queryFn: async () => {
      const { data } = await api.get("/rfq/vendor-rfqs");
      return data;
    },
    refetchInterval: 30_000, // background refresh every 30s
  });

  // ── Accept mutation ───────────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: (id: number) => api.post(`/rfq/${id}/accept`),
    onSuccess: () => {
      toast.success("RFQ accepted — you can now submit your bid");
      queryClient.invalidateQueries({ queryKey: ["vendor-rfqs-inbox"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to accept RFQ"),
  });

  // ── Derived statuses ─────────────────────────────────────────────────────────
  const rfqsWithStatus = rfqs.map((r: any) => ({
    ...r,
    vendorStatus: deriveStatus(r, user?.id),
  }));

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = rfqsWithStatus.filter((r: any) => {
    const matchSearch =
      !search ||
      String(r.id).includes(search) ||
      r.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.vendorStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total:    rfqsWithStatus.length,
    newCount: rfqsWithStatus.filter((r: any) => r.vendorStatus === "new").length,
    accepted: rfqsWithStatus.filter((r: any) => r.vendorStatus === "accepted").length,
    expiring: rfqsWithStatus.filter((r: any) => {
      if (!r.deadline) return false;
      const diff = new Date(r.deadline).getTime() - Date.now();
      return diff > 0 && diff < 86_400_000;
    }).length,
  };

  const openBidModal = (rfq: any) => {
    setBidRfq(rfq);
    setBidModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">Active RFQs awaiting your response. Submitted bids appear in Quotations.</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.newCount > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {stats.newCount} new RFQ{stats.newCount > 1 ? "s" : ""} require action
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["vendor-rfqs-inbox"] })}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Active", val: stats.total,    border: "border-l-gray-400" },
          { label: "New",        val: stats.newCount,  border: "border-l-blue-500" },
          { label: "Accepted",   val: stats.accepted,  border: "border-l-green-500" },
          { label: "Expiring <24h", val: stats.expiring, border: "border-l-amber-500" },
        ].map(({ label, val, border }) => (
          <Card key={label} className={`border-l-4 ${border} shadow-none`}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-none">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQ ID, equipment, buyer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 text-sm">
              <Filter className="w-3 h-3 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* RFQ Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["RFQ ID", "Equipment", "From (Buyer)", "Deadline", "Your Bid", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((rfq: any) => {
                    const sc = STATUS_CONFIG[rfq.vendorStatus] ?? STATUS_CONFIG.new;
                    const isExpired = rfq.deadline && new Date(rfq.deadline) < new Date();
                    const canBid = (rfq.vendorStatus === "new" || rfq.vendorStatus === "accepted") && !rfq.myBid && !isExpired && rfq.status === "open";

                    return (
                      <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                        {/* RFQ ID */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold text-indigo-600">
                            RFQ-{String(rfq.id).padStart(4, "0")}
                          </span>
                        </td>

                        {/* Equipment */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-gray-800">{rfq.equipmentName}</span>
                        </td>

                        {/* Buyer */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-600">{rfq.clientName}</span>
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="px-5 py-3.5">
                          <DeadlineBadge deadline={rfq.deadline} />
                        </td>

                        {/* Your Bid */}
                        <td className="px-5 py-3.5">
                          {rfq.myBid ? (
                            <span className="text-sm font-bold text-indigo-700">
                              ${Number(rfq.myBid.price).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not submitted</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            sc.color
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {/* View */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => setSelectedRfq(rfq)}
                            >
                              <Eye className="w-3 h-3" /> View
                            </Button>

                            {/* Accept (only if new and not yet accepted) */}
                            {rfq.vendorStatus === "new" && !rfq.myBid && rfq.status === "open" && !isExpired && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => acceptMutation.mutate(rfq.id)}
                                disabled={acceptMutation.isPending}
                              >
                                {acceptMutation.isPending && acceptMutation.variables === rfq.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <CheckCircle className="w-3 h-3" />
                                }
                                Accept
                              </Button>
                            )}

                            {/* Submit Bid */}
                            {canBid && (
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => openBidModal(rfq)}
                              >
                                <Send className="w-3 h-3" /> Bid
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Inbox className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    {search || filterStatus !== "all" ? "No RFQs match your filters" : "No RFQs in your inbox yet"}
                  </p>
                  <p className="text-xs mt-1">
                    {!search && filterStatus === "all"
                      ? "When a client sends you an RFQ, it will appear here"
                      : "Try adjusting your search or filters"}
                  </p>
                </div>
              )}

              {filtered.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30">
                  <p className="text-xs text-gray-400">
                    Showing {filtered.length} of {rfqsWithStatus.length} RFQs
                    {filterStatus !== "all" && ` · filtered by "${filterStatus}"`}
                    {search && ` · search: "${search}"`}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFQ Detail Dialog */}
      {selectedRfq && (
        <RFQDetailDialog
          rfq={selectedRfq}
          vendorStatus={selectedRfq.vendorStatus}
          onClose={() => setSelectedRfq(null)}
          onSubmitBid={(rfq) => openBidModal(rfq)}
          onAccept={(id) => acceptMutation.mutate(id)}
          isAccepting={acceptMutation.isPending}
        />
      )}

      {/* Bid Submission Modal */}
      {bidRfq && (
        <BidSubmissionModal
          isOpen={bidModalOpen}
          onClose={() => {
            setBidModalOpen(false);
            setBidRfq(null);
            queryClient.invalidateQueries({ queryKey: ["vendor-rfqs-inbox"] });
          }}
          rfq={bidRfq}
        />
      )}
    </div>
  );
}

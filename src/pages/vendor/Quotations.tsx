import { useState, useEffect } from "react";
import {
  FileText, TrendingUp, CheckCircle2, Clock, Search, Download,
  Loader2, RefreshCw, Eye, Send, XCircle, AlertCircle, RotateCcw, LogOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { downloadAuthedBlob } from "@/lib/downloadFile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BidStatus = "draft" | "submitted" | "revised" | "won" | "lost" | "withdrawn" | "declined" | "expired";

interface VendorBid {
  bidId: number;
  quoteId: string;
  rfqId: number;
  rfqRef: string;
  equipmentName: string;
  equipmentCategory: string;
  buyerName: string;
  amount?: number;
  availability?: string;
  submittedAt?: string;
  validUntil?: string | null;
  status: BidStatus;
  rfqStatus: string;
  declineReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_CFG: Record<BidStatus, { label: string; dot: string; text: string; bg: string; description: string }> = {
  draft:       { label: "Draft",       dot: "bg-gray-500",     text: "text-gray-700",     bg: "bg-gray-50",     description: "In progress" },
  submitted:   { label: "Submitted",   dot: "bg-blue-500",     text: "text-blue-700",     bg: "bg-blue-50",     description: "Awaiting response" },
  revised:     { label: "Revised",     dot: "bg-purple-500",   text: "text-purple-700",   bg: "bg-purple-50",   description: "Buyer requested changes" },
  won:         { label: "Won",         dot: "bg-green-500",    text: "text-green-700",    bg: "bg-green-50",    description: "Award accepted" },
  lost:        { label: "Lost",        dot: "bg-red-500",      text: "text-red-700",      bg: "bg-red-50",      description: "Not selected" },
  withdrawn:   { label: "Withdrawn",   dot: "bg-orange-500",   text: "text-orange-700",   bg: "bg-orange-50",   description: "Cancelled by vendor" },
  declined:    { label: "Declined",    dot: "bg-slate-400",    text: "text-slate-700",    bg: "bg-slate-50",    description: "Could not bid" },
  expired:     { label: "Expired",     dot: "bg-gray-400",     text: "text-gray-600",     bg: "bg-gray-100",    description: "Deadline passed" },
};

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n?: number) {
  if (!n) return "—";
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Quotations() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [filter, setFilter] = useState<BidStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VendorBid | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  // Live updates whenever a new RFQ/bid event fires
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["vendor-bids"] });
    socket.on("notification:new", refresh);
    socket.on("bid:status-changed", refresh);
    socket.on("rfq:expired", refresh);
    return () => {
      socket.off("notification:new", refresh);
      socket.off("bid:status-changed", refresh);
      socket.off("rfq:expired", refresh);
    };
  }, [socket, queryClient]);

  const { data: bids = [], isLoading, isRefetching } = useQuery<VendorBid[]>({
    queryKey: ["vendor-bids"],
    queryFn: async () => {
      const { data } = await api.get("/rfq/vendor-bids");
      return data;
    },
    refetchInterval: 30_000,
  });

  // Show all bids as lifecycle history
  const allBids = bids;
  const counts = {
    all: allBids.length,
    draft: allBids.filter((b) => b.status === "draft").length,
    submitted: allBids.filter((b) => b.status === "submitted").length,
    revised: allBids.filter((b) => b.status === "revised").length,
    won: allBids.filter((b) => b.status === "won").length,
    lost: allBids.filter((b) => b.status === "lost").length,
    withdrawn: allBids.filter((b) => b.status === "withdrawn").length,
    declined: allBids.filter((b) => b.status === "declined").length,
    expired: allBids.filter((b) => b.status === "expired").length,
  };

  const winRate = counts.won + counts.lost > 0
    ? `${Math.round((counts.won / (counts.won + counts.lost)) * 100)}%`
    : "—";

  const stats = [
    { label: "Total Bids",  val: counts.all,        icon: FileText,     border: "border-l-indigo-500", iconBg: "bg-indigo-50",  iconColor: "text-indigo-600" },
    { label: "Submitted",   val: counts.submitted,  icon: Send,         border: "border-l-blue-500",   iconBg: "bg-blue-50",   iconColor: "text-blue-600" },
    { label: "Won",         val: counts.won,        icon: CheckCircle2, border: "border-l-green-500",  iconBg: "bg-green-50",  iconColor: "text-green-600" },
    { label: "Lost",        val: counts.lost,       icon: XCircle,      border: "border-l-red-500",    iconBg: "bg-red-50",    iconColor: "text-red-600" },
  ];

  const filtered = allBids.filter((b) => {
    const s = search.trim().toLowerCase();
    const matchSearch = !s ||
      b.quoteId.toLowerCase().includes(s) ||
      b.rfqRef.toLowerCase().includes(s) ||
      b.equipmentName.toLowerCase().includes(s) ||
      b.buyerName.toLowerCase().includes(s);
    return (filter === "all" || b.status === filter) && matchSearch;
  });

  const filterTabs: Array<{ key: BidStatus | "all"; label: string }> = [
    { key: "all",       label: "All Bids" },
    { key: "draft",     label: "Drafts" },
    { key: "submitted", label: "Submitted" },
    { key: "revised",   label: "Revised" },
    { key: "won",       label: "Won" },
    { key: "lost",      label: "Lost" },
    { key: "withdrawn", label: "Withdrawn" },
    { key: "declined",  label: "Declined" },
    { key: "expired",   label: "Expired" },
  ];

  const handleDownload = async (b: VendorBid) => {
    try {
      setDownloadingId(b.bidId);
      await downloadAuthedBlob(`/rfq/bids/${b.bidId}/pdf`, `Quotation-${b.quoteId}.pdf`);
      toast.success(`Downloaded ${b.quoteId}.pdf`);
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleWithdraw = async (b: VendorBid) => {
    try {
      setWithdrawingId(b.bidId);
      await api.post(`/bids/${b.bidId}/withdraw`);
      toast.success("Bid withdrawn successfully");
      queryClient.invalidateQueries({ queryKey: ["vendor-bids"] });
      setSelected(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to withdraw bid");
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bid Lifecycle</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track all your bids - from drafts through completion.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["vendor-bids"] })}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, val, icon: Icon, border, iconBg, iconColor }) => (
          <Card key={label} className={cn("border-l-4 shadow-none", border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                <Icon className={cn("w-5 h-5", iconColor)} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex gap-2 flex-wrap items-center overflow-x-auto pb-2">
        {filterTabs.map((t) => {
          const c = t.key === "all" ? counts.all : counts[t.key];
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all inline-flex items-center gap-1.5 whitespace-nowrap",
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              {t.label}
              <span className={cn(
                "rounded-full px-1.5 text-[10px] font-bold",
                active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              )}>
                {c}
              </span>
            </button>
          );
        })}

        <div className="relative ml-auto flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bids…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-700">
                {allBids.length === 0 ? "No bids yet" : "No bids match your filters"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {allBids.length === 0
                  ? "Start bidding on RFQs to see them appear here."
                  : "Try a different filter or search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {[
                      "Quote ID", "RFQ Ref", "Equipment", "Buyer",
                      "Amount", "Status", "Date", "Actions",
                    ].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => {
                    const sc = STATUS_CFG[b.status];
                    const canWithdraw = b.status === "submitted" || b.status === "revised";
                    return (
                      <tr key={b.bidId} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-indigo-600">{b.quoteId}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-semibold">
                            {b.rfqRef}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{b.equipmentName}</span>
                            {b.equipmentCategory && (
                              <span className="text-xs text-gray-500 mt-0.5">{b.equipmentCategory}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">{b.buyerName}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-gray-900">{fmtMoney(b.amount)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                            sc.bg, sc.text,
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-500">
                            {fmtDate(b.status === "draft" ? b.createdAt : b.submittedAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => setSelected(b)}
                            >
                              <Eye className="w-3 h-3" /> View
                            </Button>
                            {canWithdraw && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-xs gap-1 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                onClick={() => handleWithdraw(b)}
                                disabled={withdrawingId === b.bidId}
                              >
                                {withdrawingId === b.bidId
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <LogOut className="w-3 h-3" />}
                                Withdraw
                              </Button>
                            )}
                            {b.amount && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Download PDF"
                                onClick={() => handleDownload(b)}
                                disabled={downloadingId === b.bidId}
                              >
                                {downloadingId === b.bidId
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                  : <Download className="w-3.5 h-3.5 text-gray-500 hover:text-indigo-600" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-indigo-600">{selected?.quoteId}</span>
              {selected && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold",
                  STATUS_CFG[selected.status].bg, STATUS_CFG[selected.status].text,
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CFG[selected.status].dot)} />
                  {STATUS_CFG[selected.status].label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-1 text-sm">
              {/* Main details */}
              {[
                ["RFQ Reference", selected.rfqRef],
                ["Equipment", selected.equipmentName],
                ["Category", selected.equipmentCategory || "—"],
                ["Buyer", selected.buyerName],
                ...(selected.amount ? [["Amount", fmtMoney(selected.amount)]] : []),
                ...(selected.availability ? [["Availability", selected.availability]] : []),
                ["Status", STATUS_CFG[selected.status].description],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">{String(k)}</span>
                  <span className="text-gray-900 font-semibold">{String(v)}</span>
                </div>
              ))}

              {/* Decline reason if applicable */}
              {selected.status === "declined" && selected.declineReason && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Decline Reason:</p>
                  <p className="text-xs text-slate-600">{selected.declineReason}</p>
                </div>
              )}

              {/* Dates */}
              <div className="pt-3 space-y-2 border-t border-gray-100">
                {selected.status === "draft" && (
                  <p className="text-xs text-gray-500">Created: {fmtDate(selected.createdAt)}</p>
                )}
                {selected.status !== "draft" && (
                  <>
                    <p className="text-xs text-gray-500">Submitted: {fmtDate(selected.submittedAt)}</p>
                    {selected.validUntil && (
                      <p className="text-xs text-gray-500">Valid Until: {fmtDate(selected.validUntil)}</p>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-2">
                {selected.status === "submitted" || selected.status === "revised" ? (
                  <Button
                    variant="destructive"
                    className="w-full gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => handleWithdraw(selected)}
                    disabled={withdrawingId === selected.bidId}
                  >
                    {withdrawingId === selected.bidId
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <LogOut className="w-4 h-4" />}
                    Withdraw Bid
                  </Button>
                ) : selected.amount ? (
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                    onClick={() => handleDownload(selected)}
                    disabled={downloadingId === selected.bidId}
                  >
                    {downloadingId === selected.bidId
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    Download PDF
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
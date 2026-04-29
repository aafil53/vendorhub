import { useState, useEffect } from "react";
import {
  FileText, TrendingUp, CheckCircle2, Clock, Search, Download,
  Loader2, RefreshCw, Eye, Send, XCircle,
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

type BidStatus = "submitted" | "won" | "lost";

interface VendorBid {
  bidId: number;
  quoteId: string;
  rfqId: number;
  rfqRef: string;
  equipmentName: string;
  equipmentCategory: string;
  buyerName: string;
  amount: number;
  availability: string;
  submittedAt: string;
  validUntil: string | null;
  status: BidStatus;
  rfqStatus: string;
}

const STATUS_CFG: Record<BidStatus, { label: string; dot: string; text: string; bg: string }> = {
  submitted: { label: "Pending", dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50" },
  won:       { label: "Won",     dot: "bg-green-500",   text: "text-green-700",   bg: "bg-green-50" },
  lost:      { label: "Lost",    dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50" },
};

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Quotations() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [filter, setFilter] = useState<BidStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VendorBid | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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

  // Show all bids as transaction history (submitted, won, lost)
  const transactionBids = bids;
  const counts = {
    all: transactionBids.length,
    submitted: transactionBids.filter((b) => b.status === "submitted").length,
    won: transactionBids.filter((b) => b.status === "won").length,
    lost: transactionBids.filter((b) => b.status === "lost").length,
  };

  const winRate = counts.won + counts.lost > 0
    ? `${Math.round((counts.won / (counts.won + counts.lost)) * 100)}%`
    : "—";

  const stats = [
    { label: "Total Transactions", val: counts.all,        icon: FileText,     border: "border-l-indigo-500", iconBg: "bg-indigo-50",  iconColor: "text-indigo-600" },
    { label: "Won",                val: counts.won,        icon: CheckCircle2, border: "border-l-green-500",  iconBg: "bg-green-50",  iconColor: "text-green-600" },
    { label: "Lost",               val: counts.lost,       icon: XCircle,      border: "border-l-red-500",    iconBg: "bg-red-50",    iconColor: "text-red-600" },
    { label: "Win Rate",           val: winRate,           icon: TrendingUp,   border: "border-l-amber-500",  iconBg: "bg-amber-50",  iconColor: "text-amber-600" },
  ];

  const filtered = transactionBids.filter((b) => {
    const s = search.trim().toLowerCase();
    const matchSearch = !s ||
      b.quoteId.toLowerCase().includes(s) ||
      b.rfqRef.toLowerCase().includes(s) ||
      b.equipmentName.toLowerCase().includes(s) ||
      b.buyerName.toLowerCase().includes(s);
    return (filter === "all" || b.status === filter) && matchSearch;
  });

  const filterTabs: Array<{ key: BidStatus | "all"; label: string }> = [
    { key: "all",       label: "All Transactions" },
    { key: "submitted", label: "Pending" },
    { key: "won",       label: "Won" },
    { key: "lost",      label: "Lost" },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete record of all finalized deals - won and lost transactions.
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

      {/* Filter chips + search */}
      <div className="flex gap-2 flex-wrap items-center">
        {filterTabs.map((t) => {
          const c = t.key === "all" ? counts.all : counts[t.key];
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all inline-flex items-center gap-1.5",
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

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotations…"
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
                {transactionBids.length === 0 ? "No transaction history yet" : "No transactions match your filters"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {transactionBids.length === 0
                  ? "Bids you submit will appear here."
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
                      "Amount", "Submitted", "Valid Until", "Status", "Actions",
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
                          <span className="text-sm text-gray-500">{fmtDate(b.submittedAt)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-500">{fmtDate(b.validUntil)}</span>
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
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => setSelected(b)}
                            >
                              <Eye className="w-3 h-3" /> View
                            </Button>
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
              {[
                ["RFQ Reference", selected.rfqRef],
                ["Equipment", selected.equipmentName],
                ["Category", selected.equipmentCategory || "—"],
                ["Buyer", selected.buyerName],
                ["Quoted Amount", fmtMoney(selected.amount)],
                ["Availability", selected.availability],
                ["Submitted", fmtDate(selected.submittedAt)],
                ["Valid Until", fmtDate(selected.validUntil)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">{String(k)}</span>
                  <span className="text-gray-900 font-semibold">{String(v)}</span>
                </div>
              ))}
              <div className="pt-3">
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { FileText, TrendingUp, CheckCircle2, Clock, Search, Download, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

type QuoteStatus = "new" | "submitted" | "won" | "lost" | "closed";

const STATUS_CFG: Record<QuoteStatus, { label: string; color: string; dot: string }> = {
  new:       { label: "New RFQ",   color: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  submitted: { label: "Submitted", color: "bg-purple-50 text-purple-700 border-purple-200",   dot: "bg-purple-500" },
  won:       { label: "Won",       color: "bg-green-50 text-green-700 border-green-200",      dot: "bg-green-500" },
  lost:      { label: "Lost",      color: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-400" },
  closed:    { label: "Closed",    color: "bg-gray-50 text-gray-500 border-gray-200",         dot: "bg-gray-400" },
};

function deriveQuoteStatus(rfq: any): QuoteStatus {
  if (rfq.myBid) {
    if (rfq.myBid.status === "accepted") return "won";
    if (rfq.myBid.status === "rejected") return "lost";
    return "submitted";
  }
  if (rfq.status === "closed" || rfq.status === "awarded" || rfq.status === "cancelled") return "closed";
  return "new";
}

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Quotations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  // Live updates when client sends/cancels RFQ
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["vendor-quotations"] });
    socket.on("notification:new", refresh);
    socket.on("rfq:expired", refresh);
    return () => {
      socket.off("notification:new", refresh);
      socket.off("rfq:expired", refresh);
    };
  }, [socket, queryClient]);

  const { data: rfqs = [], isLoading, isRefetching } = useQuery({
    queryKey: ["vendor-quotations"],
    queryFn: async () => {
      const { data } = await api.get("/rfq/vendor-rfqs");
      return data;
    },
    refetchInterval: 30_000,
  });

  const quotes = (rfqs as any[]).map((r) => ({
    id: r.myBid ? `QT-${String(r.myBid.id).padStart(4, "0")}` : `RFQ-${String(r.id).padStart(4, "0")}`,
    rfqId: `RFQ-${String(r.id).padStart(4, "0")}`,
    equipment: r.equipmentName ?? "—",
    buyer: r.clientName ?? "Client",
    submitted: r.myBid ? fmtDate(r.myBid.submittedAt ?? r.createdAt) : fmtDate(r.createdAt),
    amount: r.myBid ? `$${Number(r.myBid.price).toLocaleString()}` : "—",
    status: deriveQuoteStatus(r),
    validity: fmtDate(r.deadline),
    availability: r.myBid?.availability ?? "—",
    raw: r,
  }));

  const won = quotes.filter((q) => q.status === "won").length;
  const lost = quotes.filter((q) => q.status === "lost").length;
  const winRate = won + lost > 0 ? `${Math.round((won / (won + lost)) * 100)}%` : "—";

  const stats = [
    { label: "Total RFQs",  val: quotes.length, icon: FileText, border: "border-l-gray-400" },
    { label: "Won", val: won, icon: CheckCircle2, border: "border-l-green-500" },
    { label: "In Progress", val: quotes.filter((q) => q.status === "submitted" || q.status === "new").length, icon: Clock, border: "border-l-blue-500" },
    { label: "Win Rate", val: winRate, icon: TrendingUp, border: "border-l-purple-500" },
  ];

  const filtered = quotes.filter((q) => {
    const s = search.toLowerCase();
    const matchSearch = !s ||
      q.id.toLowerCase().includes(s) ||
      q.rfqId.toLowerCase().includes(s) ||
      q.equipment.toLowerCase().includes(s) ||
      q.buyer.toLowerCase().includes(s);
    return (filter === "all" || q.status === filter) && matchSearch;
  });

  const tabs: ("all" | QuoteStatus)[] = ["all", "new", "submitted", "won", "lost", "closed"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live history of every RFQ a buyer sent you and your responses</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["vendor-quotations"] })}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, val, icon: Icon, border }) => (
          <Card key={label} className={`border-l-4 ${border} shadow-none`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900">{val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {tabs.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
              filter === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s === "all" ? "All" : STATUS_CFG[s].label}
            <span className="ml-1.5 opacity-70">
              {s === "all" ? quotes.length : quotes.filter((q) => q.status === s).length}
            </span>
          </button>
        ))}

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
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
              <p className="text-sm font-semibold text-gray-700">No quotations yet</p>
              <p className="text-xs text-gray-500 mt-1">When a buyer sends you an RFQ, it will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Quote ID", "RFQ Ref", "Equipment", "Buyer", "Amount", "Submitted", "Deadline", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((q) => {
                    const sc = STATUS_CFG[q.status];
                    return (
                      <tr key={q.rfqId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold text-indigo-600">{q.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">{q.rfqId}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-gray-800">{q.equipment}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-600">{q.buyer}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-gray-900">{q.amount}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-500">{q.submitted}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-500">{q.validity}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setSelected(q)}>
                              View
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Download className="w-3.5 h-3.5 text-gray-400" />
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.id}
              {selected && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_CFG[selected.status as QuoteStatus].color}`}>
                  {STATUS_CFG[selected.status as QuoteStatus].label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {selected && [
              ["RFQ Reference", selected.rfqId],
              ["Equipment", selected.equipment],
              ["Buyer", selected.buyer],
              ["Quoted Amount", selected.amount],
              ["Availability", selected.availability],
              ["Submitted", selected.submitted],
              ["Deadline", selected.validity],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{String(k)}</span>
                <span className="text-gray-900 font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

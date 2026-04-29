import { useState, useEffect } from "react";
import {
  Search, Filter, FileText, Eye,
  Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RFQInbox() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── Live socket updates ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["vendor-active-bids"] });
    socket.on("bid:status-changed", refresh);
    socket.on("rfq:expired", refresh);
    return () => {
      socket.off("bid:status-changed", refresh);
      socket.off("rfq:expired", refresh);
    };
  }, [socket, queryClient]);

  // ── Fetch Active Bids (pending/submitted only) ─────────────────────────────
  const { data: bids = [], isLoading, isRefetching } = useQuery({
    queryKey: ["vendor-active-bids"],
    queryFn: async () => {
      const { data } = await api.get("/rfq/vendor-bids");
      // Filter to only "submitted" (pending) bids - exclude won/lost
      return data.filter((b: any) => b.status === "submitted");
    },
    refetchInterval: 30_000,
  });

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = bids.filter((b: any) => {
    const matchSearch =
      !search ||
      String(b.rfqId).includes(search) ||
      b.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      b.buyerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: bids.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Bidding</h1>
          <p className="text-sm text-gray-500 mt-0.5">RFQs where you've sent or are actively bidding. Track your active bids and their status.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["vendor-active-bids"] })}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending Bids", val: stats.total, border: "border-l-blue-500" },
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
              <SelectItem value="all">All Bids</SelectItem>
              <SelectItem value="submitted">Pending</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Active Bids Table */}
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
                {bids.length === 0 ? "No active bids yet" : "No active bids match your filters"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {bids.length === 0
                  ? "Submit bids on RFQs and track their status here."
                  : "Try a different filter or search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Quote ID", "RFQ Ref", "Equipment", "Buyer", "Bid Amount", "Submitted", "Status", "Actions"].map((h) => (
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
                  {filtered.map((bid: any) => (
                    <tr key={bid.bidId} className="hover:bg-gray-50 transition-colors">
                      {/* Quote ID */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-indigo-600">{bid.quoteId}</span>
                      </td>

                      {/* RFQ Ref */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-semibold">
                          {bid.rfqRef}
                        </span>
                      </td>

                      {/* Equipment */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{bid.equipmentName}</span>
                          {bid.equipmentCategory && (
                            <span className="text-xs text-gray-500 mt-0.5">{bid.equipmentCategory}</span>
                          )}
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700">{bid.buyerName}</span>
                      </td>

                      {/* Bid Amount */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-900">${Number(bid.amount).toLocaleString()}</span>
                      </td>

                      {/* Submitted */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-500">
                          {new Date(bid.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Pending
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs gap-1"
                          disabled
                        >
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { FileText, TrendingUp, CheckCircle2, XCircle, Clock, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const QUOTES = [
  {
    id: "QT-2024-018", rfqId: "RFQ-2024-031", equipment: "Mobile Crane 50T",
    buyer: "Volvitech Construction", submitted: "2024-01-28", amount: "$17,500",
    status: "submitted", category: "Cranes", validity: "2024-02-15",
    notes: "Full operator + insurance included. 24h mobilization.",
  },
  {
    id: "QT-2024-015", rfqId: "RFQ-2024-025", equipment: "Tower Crane 150T",
    buyer: "Eastern Province Machinery", submitted: "2024-01-22", amount: "$88,000",
    status: "won", category: "Cranes", validity: "2024-02-10",
    notes: "Erection, dismantling, and 3-shift crew included.",
  },
  {
    id: "QT-2024-012", rfqId: "RFQ-2024-018", equipment: "Forklift 10T",
    buyer: "Gulf Heavy Equipment", submitted: "2024-01-18", amount: "$8,200",
    status: "draft", category: "Forklifts", validity: "2024-02-28",
    notes: "Electric, lithium battery. Delivery in 48h.",
  },
  {
    id: "QT-2024-010", rfqId: "RFQ-2024-015", equipment: "Excavator CAT 390",
    buyer: "Riyadh Heavy Lift", submitted: "2024-01-14", amount: "$21,800",
    status: "revised", category: "Excavators", validity: "2024-01-30",
    notes: "Price revised after site assessment. Fuel not included.",
  },
  {
    id: "QT-2024-008", rfqId: "RFQ-2024-012", equipment: "Drilling Rig",
    buyer: "Al-Madinah Rentals", submitted: "2024-01-10", amount: "$43,000",
    status: "lost", category: "Drilling", validity: "2024-01-25",
    notes: "Competitive bid. Price outmatched by competitor.",
  },
  {
    id: "QT-2024-006", rfqId: "RFQ-2024-010", equipment: "Boom Lift 40m",
    buyer: "Volvitech Construction", submitted: "2024-01-05", amount: "$11,500",
    status: "won", category: "Lifts", validity: "2024-01-20",
    notes: "Full fuel, operator safety training included.",
  },
];

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: "Draft",     color: "bg-gray-50 text-gray-600 border-gray-200",     dot: "bg-gray-400" },
  submitted: { label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
  revised:   { label: "Revised",   color: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  won:       { label: "Won",       color: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  lost:      { label: "Lost",      color: "bg-red-50 text-red-700 border-red-200",        dot: "bg-red-400" },
};

export default function Quotations() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof QUOTES[0] | null>(null);

  const stats = [
    { label: "Total Bids",  val: QUOTES.length,                                  icon: FileText,    border: "border-l-gray-400" },
    { label: "Won",         val: QUOTES.filter(q => q.status === "won").length,   icon: CheckCircle2, border: "border-l-green-500" },
    { label: "In Progress", val: QUOTES.filter(q => ["submitted","revised"].includes(q.status)).length, icon: Clock, border: "border-l-blue-500" },
    { label: "Win Rate",    val: `${Math.round((QUOTES.filter(q=>q.status==="won").length / QUOTES.filter(q=>["won","lost"].includes(q.status)).length)*100)}%`, icon: TrendingUp, border: "border-l-purple-500" },
  ];

  const filtered = QUOTES.filter((q) => {
    const matchSearch =
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.equipment.toLowerCase().includes(search.toLowerCase()) ||
      q.buyer.toLowerCase().includes(search.toLowerCase());
    return (filter === "all" || q.status === filter) && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track all submitted bids, drafts, and outcomes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
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

      {/* Pipeline tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "submitted", "revised", "won", "lost"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
              filter === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s === "all" ? "All Quotations" : STATUS_CFG[s]?.label}
            <span className="ml-1.5 opacity-70">
              {s === "all" ? QUOTES.length : QUOTES.filter(q => q.status === s).length}
            </span>
          </button>
        ))}

        {/* Search */}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Quote ID", "RFQ Ref", "Equipment", "Buyer", "Amount", "Submitted", "Valid Until", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((q) => {
                  const sc = STATUS_CFG[q.status];
                  return (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-indigo-600">{q.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">{q.rfqId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-800">{q.equipment}</span>
                        <p className="text-xs text-gray-400">{q.category}</p>
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
                          {q.status === "draft" && (
                            <Button size="sm" className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700">Submit</Button>
                          )}
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.id}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_CFG[selected?.status ?? "draft"]?.color}`}>
                {STATUS_CFG[selected?.status ?? "draft"]?.label}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {[
              ["RFQ Reference", selected?.rfqId],
              ["Equipment", selected?.equipment],
              ["Buyer", selected?.buyer],
              ["Quoted Amount", selected?.amount],
              ["Submitted", selected?.submitted],
              ["Valid Until", selected?.validity],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{String(k)}</span>
                <span className="text-gray-900 font-semibold">{String(v)}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-gray-500 mb-1">Notes</p>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-xs">{selected?.notes}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

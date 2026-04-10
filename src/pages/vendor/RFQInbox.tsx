import { useState } from "react";
import {
  Search, Filter, Clock, Building2, CheckCircle,
  XCircle, Send, Eye, AlertTriangle, Inbox
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const RFQS = [
  {
    id: "RFQ-2024-031", equipment: "Mobile Crane 50T", buyer: "Volvitech Construction",
    category: "Cranes", deadline: "2024-02-15", status: "new",
    description: "Need 1 mobile crane for 3 months, site: Al-Madinah. Operator required.",
    budget: "$18,000", qty: 1,
  },
  {
    id: "RFQ-2024-028", equipment: "Drilling Rig", buyer: "Gulf Heavy Equipment",
    category: "Drilling", deadline: "2024-02-10", status: "accepted",
    description: "Rotary drilling rig for 60-day offshore project.",
    budget: "$45,000", qty: 2,
  },
  {
    id: "RFQ-2024-025", equipment: "Tower Crane 150T", buyer: "Eastern Province Machinery",
    category: "Cranes", deadline: "2024-01-30", status: "quoted",
    description: "High-capacity tower crane, full erection and dismantling required.",
    budget: "$90,000", qty: 1,
  },
  {
    id: "RFQ-2024-020", equipment: "Excavator CAT 390", buyer: "Riyadh Heavy Lift",
    category: "Excavators", deadline: "2024-01-20", status: "declined",
    description: "Large excavator for foundation works. 45 days minimum.",
    budget: "$22,000", qty: 3,
  },
  {
    id: "RFQ-2024-018", equipment: "Forklift 10T", buyer: "Al-Madinah Rentals",
    category: "Forklifts", deadline: "2024-02-28", status: "new",
    description: "Warehouse forklift, electric preferred. 6-month contract.",
    budget: "$8,500", qty: 4,
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  new:      { label: "New",      color: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  accepted: { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  quoted:   { label: "Quoted",   color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border-red-200",      dot: "bg-red-400" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function RFQInbox() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selected, setSelected] = useState<typeof RFQS[0] | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = RFQS.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.equipment.toLowerCase().includes(search.toLowerCase()) ||
      r.buyer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchCat = filterCategory === "all" || r.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const newCount = RFQS.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and respond to incoming requests for quotation</p>
        </div>
        {newCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">{newCount} new RFQ{newCount > 1 ? "s" : ""} require action</span>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total RFQs",  val: RFQS.length,                                  color: "border-l-gray-400" },
          { label: "New",         val: RFQS.filter(r => r.status === "new").length,   color: "border-l-blue-500" },
          { label: "Quoted",      val: RFQS.filter(r => r.status === "quoted").length, color: "border-l-purple-500" },
          { label: "Accepted",    val: RFQS.filter(r => r.status === "accepted").length, color: "border-l-green-500" },
        ].map(({ label, val, color }) => (
          <Card key={label} className={`border-l-4 ${color} shadow-none`}>
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
            <SelectTrigger className="w-36 text-sm">
              <Filter className="w-3 h-3 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Cranes">Cranes</SelectItem>
              <SelectItem value="Drilling">Drilling</SelectItem>
              <SelectItem value="Excavators">Excavators</SelectItem>
              <SelectItem value="Forklifts">Forklifts</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* RFQ Table */}
      <Card className="shadow-none">
        <CardHeader className="pb-0 px-6 pt-5">
          <CardTitle className="text-base text-gray-800">
            Requests for Quotation
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length} results)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["RFQ ID", "Equipment", "Buyer", "Category", "Deadline", "Budget", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((rfq) => {
                  const sc = STATUS_CONFIG[rfq.status];
                  return (
                    <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-indigo-600">{rfq.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-800 font-medium">{rfq.equipment}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{rfq.buyer}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">{rfq.category}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{rfq.deadline}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-800">{rfq.budget}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs gap-1"
                            onClick={() => setSelected(rfq)}
                          >
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          {rfq.status === "new" && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => { setSelected(rfq); setQuoteOpen(true); }}
                              >
                                <Send className="w-3 h-3" /> Quote
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-3 h-3" /> Decline
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Inbox className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No RFQs found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!selected && !quoteOpen} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-indigo-600">{selected?.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_CONFIG[selected?.status ?? "new"]?.color}`}>
                {STATUS_CONFIG[selected?.status ?? "new"]?.label}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {[
              ["Equipment", selected?.equipment],
              ["Buyer", selected?.buyer],
              ["Category", selected?.category],
              ["Deadline", selected?.deadline],
              ["Budget", selected?.budget],
              ["Quantity", selected?.qty],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500 font-medium">{String(k)}</span>
                <span className="text-gray-800 font-semibold">{String(v)}</span>
              </div>
            ))}
            <div className="pt-1">
              <p className="text-gray-500 font-medium mb-1">Description</p>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-xs leading-relaxed">{selected?.description}</p>
            </div>
          </div>
          <DialogFooter>
            {selected?.status === "new" && (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setQuoteOpen(true)}
              >
                <Send className="w-4 h-4 mr-2" /> Submit Quotation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={quoteOpen} onOpenChange={(o) => { setQuoteOpen(o); if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Quotation — {selected?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-3 text-sm">
              <span className="font-semibold text-indigo-800">{selected?.equipment}</span>
              <span className="text-indigo-600 ml-2">· Budget: {selected?.budget}</span>
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-700">Your Price (USD)</Label>
              <Input
                id="price"
                placeholder="e.g. 16,500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Delivery & Terms Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe delivery timeline, terms, availability…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => { setQuoteOpen(false); setSelected(null); setPrice(""); setNotes(""); }}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Submit Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

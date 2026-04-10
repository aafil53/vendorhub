import { useState } from "react";
import {
  Receipt, Plus, Upload, Search, Download,
  CheckCircle2, Clock, DollarSign, AlertCircle, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const INVOICES = [
  {
    id: "INV-2024-009", poId: "PO-2024-035", equipment: "Boom Lift 40m",
    buyer: "Volvitech Construction", amount: "$11,500", date: "2024-01-31",
    dueDate: "2024-02-14", status: "approved", paidDate: null,
  },
  {
    id: "INV-2024-007", poId: "PO-2024-029", equipment: "Mobile Crane 50T",
    buyer: "Gulf Heavy Equipment", amount: "$8,750", date: "2024-01-20",
    dueDate: "2024-02-03", status: "pending", paidDate: null,
  },
  {
    id: "INV-2024-005", poId: "PO-2024-022", equipment: "Tower Crane 150T",
    buyer: "Eastern Province Machinery", amount: "$44,000", date: "2024-01-15",
    dueDate: "2024-01-29", status: "paid", paidDate: "2024-01-28",
  },
  {
    id: "INV-2024-003", poId: "PO-2024-018", equipment: "Excavator CAT 390",
    buyer: "Riyadh Heavy Lift", amount: "$21,800", date: "2024-01-05",
    dueDate: "2024-01-19", status: "paid", paidDate: "2024-01-18",
  },
  {
    id: "INV-2024-001", poId: "PO-2024-010", equipment: "Forklift 10T",
    buyer: "Al-Madinah Rentals", amount: "$8,200", date: "2023-12-28",
    dueDate: "2024-01-11", status: "overdue", paidDate: null,
  },
];

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:  { label: "Pending Review",  color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500" },
  approved: { label: "Approved",        color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-500" },
  paid:     { label: "Paid",            color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500" },
  overdue:  { label: "Overdue",         color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500" },
};

export default function Invoices() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<typeof INVOICES[0] | null>(null);

  // New invoice form state
  const [form, setForm] = useState({ poId: "", amount: "", notes: "", file: "" });

  const filtered = INVOICES.filter((inv) => {
    const matchSearch =
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.equipment.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer.toLowerCase().includes(search.toLowerCase());
    return (filter === "all" || inv.status === filter) && matchSearch;
  });

  const totalPaid = INVOICES.filter(i => i.status === "paid")
    .reduce((s, i) => s + parseFloat(i.amount.replace(/[$,]/g, "")), 0);
  const totalPending = INVOICES.filter(i => ["pending","approved"].includes(i.status))
    .reduce((s, i) => s + parseFloat(i.amount.replace(/[$,]/g, "")), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create, submit, and track all invoice payments</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Invoices",    val: INVOICES.length,                                         icon: Receipt,      border: "border-l-gray-400" },
          { label: "Pending / Approved",val: INVOICES.filter(i=>["pending","approved"].includes(i.status)).length, icon: Clock,      border: "border-l-amber-500" },
          { label: "Total Paid",        val: `$${(totalPaid/1000).toFixed(0)}K`,                      icon: CheckCircle2, border: "border-l-green-500" },
          { label: "Outstanding",       val: `$${(totalPending/1000).toFixed(1)}K`,                   icon: DollarSign,   border: "border-l-blue-500" },
        ].map(({ label, val, icon: Icon, border }) => (
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

      {/* Overdue alert */}
      {INVOICES.some(i => i.status === "overdue") && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            You have {INVOICES.filter(i=>i.status==="overdue").length} overdue invoice(s). Please follow up with the buyer.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search invoices…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 text-sm">
            <SelectValue placeholder="All Invoices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Invoice ID", "PO Reference", "Equipment", "Buyer", "Amount", "Invoice Date", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((inv) => {
                  const sc = STATUS_CFG[inv.status];
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-indigo-600">{inv.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">{inv.poId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-800">{inv.equipment}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600">{inv.buyer}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-900">{inv.amount}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-500">{inv.date}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm ${inv.status === "overdue" ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          {inv.dueDate}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setSelected(inv)}>View</Button>
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

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Linked PO</Label>
              <Select value={form.poId} onValueChange={(v) => setForm({ ...form, poId: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a Purchase Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PO-2024-041">PO-2024-041 — Tower Crane 150T</SelectItem>
                  <SelectItem value="PO-2024-029">PO-2024-029 — Mobile Crane 50T</SelectItem>
                  <SelectItem value="PO-2024-022">PO-2024-022 — Excavator CAT 390</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inv-amount" className="text-sm font-medium text-gray-700">Invoice Amount (USD)</Label>
              <Input id="inv-amount" placeholder="e.g. 17,500" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Upload Invoice PDF</Label>
              <div className="mt-1.5 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, up to 10MB</p>
              </div>
            </div>
            <div>
              <Label htmlFor="inv-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Input id="inv-notes" placeholder="Partial billing, milestone note…" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(false)}>
              Submit Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.id}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_CFG[selected?.status ?? "pending"]?.color}`}>
                {STATUS_CFG[selected?.status ?? "pending"]?.label}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {[
              ["PO Reference", selected?.poId],
              ["Equipment", selected?.equipment],
              ["Buyer", selected?.buyer],
              ["Amount", selected?.amount],
              ["Invoice Date", selected?.date],
              ["Due Date", selected?.dueDate],
              ...(selected?.paidDate ? [["Paid On", selected.paidDate]] : []),
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{String(k)}</span>
                <span className="text-gray-900 font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import {
  ShoppingCart, Truck, CheckCircle2, Clock, Package,
  Search, MapPin, Calendar, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const ORDERS = [
  {
    id: "PO-2024-041", rfqId: "RFQ-2024-025", equipment: "Tower Crane 150T",
    buyer: "Eastern Province Machinery", awarded: "2024-01-25", value: "$88,000",
    status: "active", delivery: "Al-Khobar Site A", dueDate: "2024-02-01",
    progress: 65, invoiceStatus: "pending",
    timeline: [
      { step: "PO Awarded", done: true, date: "Jan 25" },
      { step: "Mobilization", done: true, date: "Jan 28" },
      { step: "On-site Delivery", done: true, date: "Feb 1" },
      { step: "Operational", done: false, date: "Feb 3 (est.)" },
      { step: "Invoice Eligible", done: false, date: "—" },
    ],
  },
  {
    id: "PO-2024-035", rfqId: "RFQ-2024-020", equipment: "Boom Lift 40m",
    buyer: "Volvitech Construction", awarded: "2024-01-18", value: "$11,500",
    status: "completed", delivery: "Riyadh Site B", dueDate: "2024-01-30",
    progress: 100, invoiceStatus: "submitted",
    timeline: [
      { step: "PO Awarded", done: true, date: "Jan 18" },
      { step: "Mobilization", done: true, date: "Jan 20" },
      { step: "On-site Delivery", done: true, date: "Jan 22" },
      { step: "Operational", done: true, date: "Jan 23" },
      { step: "Invoice Eligible", done: true, date: "Jan 31" },
    ],
  },
  {
    id: "PO-2024-029", rfqId: "RFQ-2024-015", equipment: "Mobile Crane 50T",
    buyer: "Gulf Heavy Equipment", awarded: "2024-01-10", value: "$17,500",
    status: "dispatched", delivery: "Jeddah Port", dueDate: "2024-01-28",
    progress: 45, invoiceStatus: "not_submitted",
    timeline: [
      { step: "PO Awarded", done: true, date: "Jan 10" },
      { step: "Mobilization", done: true, date: "Jan 15" },
      { step: "On-site Delivery", done: false, date: "Jan 28 (est.)" },
      { step: "Operational", done: false, date: "—" },
      { step: "Invoice Eligible", done: false, date: "—" },
    ],
  },
  {
    id: "PO-2024-022", rfqId: "RFQ-2024-010", equipment: "Excavator CAT 390",
    buyer: "Riyadh Heavy Lift", awarded: "2024-01-03", value: "$21,800",
    status: "pending", delivery: "Al-Madinah Site C", dueDate: "2024-01-25",
    progress: 10, invoiceStatus: "not_submitted",
    timeline: [
      { step: "PO Awarded", done: true, date: "Jan 3" },
      { step: "Mobilization", done: false, date: "Pending" },
      { step: "On-site Delivery", done: false, date: "—" },
      { step: "Operational", done: false, date: "—" },
      { step: "Invoice Eligible", done: false, date: "—" },
    ],
  },
];

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "Pending Mobilization", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  dispatched:{ label: "Dispatched",           color: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  active:    { label: "On-site Active",       color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  completed: { label: "Completed",            color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
};

const INVOICE_CFG: Record<string, { label: string; color: string }> = {
  not_submitted:{ label: "Not Submitted", color: "text-gray-500" },
  pending:      { label: "Pending",       color: "text-amber-600" },
  submitted:    { label: "Submitted",     color: "text-blue-600 font-semibold" },
  paid:         { label: "Paid",          color: "text-green-600 font-semibold" },
};

export default function Orders() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof ORDERS[0] | null>(null);

  const filtered = ORDERS.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.equipment.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer.toLowerCase().includes(search.toLowerCase());
    return (filter === "all" || o.status === filter) && matchSearch;
  });

  const totalValue = ORDERS.reduce((s, o) => s + parseFloat(o.value.replace(/[$,]/g, "")), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage awarded purchase orders and track fulfillment</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Orders",  val: ORDERS.filter(o=>o.status==="active").length,    icon: Package,    border: "border-l-purple-500" },
          { label: "Dispatched",     val: ORDERS.filter(o=>o.status==="dispatched").length, icon: Truck,      border: "border-l-blue-500" },
          { label: "Completed",      val: ORDERS.filter(o=>o.status==="completed").length,  icon: CheckCircle2, border: "border-l-green-500" },
          { label: "Total Value",    val: `$${(totalValue/1000).toFixed(0)}K`,              icon: ShoppingCart, border: "border-l-indigo-500" },
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

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search orders…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending Mobilization</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="active">On-site Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((order) => {
          const sc = STATUS_CFG[order.status];
          const ic = INVOICE_CFG[order.invoiceStatus];
          return (
            <Card key={order.id} className="shadow-none border hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => setSelected(order)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-indigo-600">{order.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sc.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{order.equipment}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.buyer}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{order.value}</span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Fulfillment Progress</span>
                    <span className="font-semibold">{order.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        order.progress === 100 ? "bg-green-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.delivery}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {order.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${ic.color}`}>Invoice: {ic.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-indigo-600">{selected?.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_CFG[selected?.status ?? "pending"]?.color}`}>
                {STATUS_CFG[selected?.status ?? "pending"]?.label}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Equipment", selected?.equipment], ["Buyer", selected?.buyer],
                ["PO Value", selected?.value], ["Awarded", selected?.awarded],
                ["Delivery Site", selected?.delivery], ["Due Date", selected?.dueDate],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">{String(k)}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Fulfillment Timeline</p>
              <div className="relative pl-5">
                {selected?.timeline.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3 last:mb-0 relative">
                    <div className={`absolute -left-5 w-3 h-3 rounded-full border-2 ${t.done ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"}`} />
                    {i < (selected?.timeline.length ?? 0) - 1 && (
                      <div className={`absolute -left-[14.5px] top-3 w-0.5 h-5 ${t.done ? "bg-indigo-300" : "bg-gray-200"}`} />
                    )}
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-sm ${t.done ? "text-gray-800 font-medium" : "text-gray-400"}`}>{t.step}</span>
                      <span className="text-xs text-gray-400">{t.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            {selected?.status === "completed" && selected?.invoiceStatus === "not_submitted" && (
              <Button className="bg-indigo-600 hover:bg-indigo-700">Create Invoice</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

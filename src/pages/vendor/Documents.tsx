import { useState } from "react";
import {
  FolderOpen, Upload, FileText, Shield, AlertTriangle,
  CheckCircle2, Clock, Download, Eye, Trash2, Plus, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const DOCUMENTS = [
  {
    id: "DOC-001", name: "GST Registration Certificate", category: "Tax & Legal",
    type: "PDF", size: "1.2 MB", uploaded: "2024-01-15", expiry: "2025-01-15",
    status: "valid", required: true,
  },
  {
    id: "DOC-002", name: "Company PAN Card", category: "Tax & Legal",
    type: "PDF", size: "0.4 MB", uploaded: "2024-01-15", expiry: null,
    status: "valid", required: true,
  },
  {
    id: "DOC-003", name: "ISO 9001 Quality Certificate", category: "Certifications",
    type: "PDF", size: "2.1 MB", uploaded: "2023-09-01", expiry: "2024-09-01",
    status: "expiring_soon", required: true,
  },
  {
    id: "DOC-004", name: "Equipment Insurance Policy", category: "Insurance",
    type: "PDF", size: "3.8 MB", uploaded: "2024-01-01", expiry: "2025-01-01",
    status: "valid", required: true,
  },
  {
    id: "DOC-005", name: "Safety Compliance Certificate", category: "Safety",
    type: "PDF", size: "1.5 MB", uploaded: "2023-06-01", expiry: "2024-06-01",
    status: "expired", required: true,
  },
  {
    id: "DOC-006", name: "Company Registration Document", category: "Legal",
    type: "PDF", size: "0.9 MB", uploaded: "2024-01-10", expiry: null,
    status: "valid", required: true,
  },
  {
    id: "DOC-007", name: "Signed MSA — Volvitech Construction", category: "Contracts",
    type: "PDF", size: "2.4 MB", uploaded: "2024-01-20", expiry: "2025-01-20",
    status: "valid", required: false,
  },
  {
    id: "DOC-008", name: "Bank Account Verification Letter", category: "Financial",
    type: "PDF", size: "0.6 MB", uploaded: "2024-01-05", expiry: null,
    status: "pending_review", required: true,
  },
];

const CATEGORIES = ["Tax & Legal", "Legal", "Certifications", "Insurance", "Safety", "Contracts", "Financial"];

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  valid:          { label: "Valid",          color: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  expiring_soon:  { label: "Expiring Soon",  color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  expired:        { label: "Expired",        color: "bg-red-50 text-red-700 border-red-200",        icon: AlertTriangle },
  pending_review: { label: "Under Review",   color: "bg-blue-50 text-blue-700 border-blue-200",     icon: Clock },
};

const CAT_COLORS: Record<string, string> = {
  "Tax & Legal":   "bg-purple-50 text-purple-700",
  "Legal":         "bg-purple-50 text-purple-700",
  "Certifications":"bg-blue-50 text-blue-700",
  "Insurance":     "bg-cyan-50 text-cyan-700",
  "Safety":        "bg-orange-50 text-orange-700",
  "Contracts":     "bg-indigo-50 text-indigo-700",
  "Financial":     "bg-green-50 text-green-700",
};

export default function Documents() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", category: "", expiry: "" });

  const filtered = DOCUMENTS.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || d.category === filterCat;
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const validCount = DOCUMENTS.filter(d => d.status === "valid").length;
  const expiredCount = DOCUMENTS.filter(d => d.status === "expired").length;
  const expiringSoon = DOCUMENTS.filter(d => d.status === "expiring_soon").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage compliance files, certifications, and contracts</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setUploadOpen(true)}>
          <Plus className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Documents", val: DOCUMENTS.length,   border: "border-l-gray-400",   icon: FolderOpen },
          { label: "Valid",           val: validCount,          border: "border-l-green-500",  icon: CheckCircle2 },
          { label: "Expiring Soon",   val: expiringSoon,        border: "border-l-amber-500",  icon: Clock },
          { label: "Expired",         val: expiredCount,        border: "border-l-red-500",    icon: AlertTriangle },
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

      {/* Compliance alerts */}
      {(expiredCount > 0 || expiringSoon > 0) && (
        <div className="space-y-2">
          {expiredCount > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {expiredCount} document(s) have expired. Update them to remain compliant on the platform.
              </p>
              <Button size="sm" variant="outline" className="ml-auto border-red-300 text-red-700 hover:bg-red-100 h-7 text-xs">
                Review Now
              </Button>
            </div>
          )}
          {expiringSoon > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                {expiringSoon} document(s) will expire within 90 days. Renew them proactively.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search documents…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending_review">Under Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((doc) => {
          const sc = STATUS_CFG[doc.status];
          const StatusIcon = sc.icon;
          return (
            <Card key={doc.id} className="shadow-none hover:border-indigo-200 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* File icon */}
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[doc.category] ?? "bg-gray-100 text-gray-600"}`}>
                            {doc.category}
                          </span>
                          {doc.required && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5" /> Required
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-gray-400 space-x-3">
                        <span>{doc.type} · {doc.size}</span>
                        <span>Uploaded {doc.uploaded}</span>
                        {doc.expiry && <span>Expires {doc.expiry}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-indigo-50">
                          <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-50">
                          <Download className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Drop zone */}
            <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-indigo-50/40">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Drag & drop your file here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG — up to 10MB</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Document Name</Label>
              <Input placeholder="e.g. GST Registration Certificate" value={uploadForm.name}
                onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Category</Label>
              <Select value={uploadForm.category} onValueChange={(v) => setUploadForm({...uploadForm, category: v})}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Expiry Date (if applicable)</Label>
              <Input type="date" value={uploadForm.expiry}
                onChange={(e) => setUploadForm({...uploadForm, expiry: e.target.value})}
                className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setUploadOpen(false)}>
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

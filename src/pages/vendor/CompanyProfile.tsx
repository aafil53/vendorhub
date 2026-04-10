import { useState } from "react";
import {
  Building2, MapPin, Phone, Mail, Globe, Edit3,
  Save, X, Camera, CheckCircle2, Star, TrendingUp,
  Shield, Plus, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ─── Initial profile data ─────────────────────────────────────────────────────
const INITIAL_PROFILE = {
  companyName: "Cisco Equipment Co.",
  tagline: "Premium heavy equipment rental across Saudi Arabia",
  type: "Equipment Rental Company",
  founded: "2008",
  employees: "150–200",
  website: "https://cisco-equipment.sa",
  email: "ops@cisco-equipment.sa",
  phone: "+966 55 123 4567",
  address: "King Fahd Road, Al-Khobar",
  city: "Al-Khobar",
  region: "Eastern Province",
  country: "Saudi Arabia",
  about: "Cisco Equipment Co. is a leading heavy machinery rental provider with over 15 years of experience. We specialize in cranes, excavators, and specialized lifting equipment for construction, oil & gas, and infrastructure sectors.",
  categories: ["Cranes", "Excavators", "Forklifts", "Boom Lifts", "Drilling"],
  regions: ["Eastern Province", "Riyadh", "Jeddah", "Al-Madinah"],
  certifications: ["ISO 9001:2015", "OHSAS 18001", "Saudi Aramco Approved", "SEC Registered"],
};

const CONTACTS = [
  { name: "Usman Tariq", role: "Operations Manager", phone: "+966 55 111 2222", email: "usman@cisco-equipment.sa" },
  { name: "Aafil Rahmani", role: "Finance Controller", phone: "+966 55 333 4444", email: "aafil@cisco-equipment.sa" },
];

const BANK = {
  bank: "Riyad Bank",
  accountName: "Cisco Equipment Co.",
  iban: "SA0380000000608010167519",
  swift: "RIBLSARI",
  currency: "SAR",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompanyProfile() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...INITIAL_PROFILE });
  const [newCategory, setNewCategory] = useState("");
  const [newRegion, setNewRegion] = useState("");

  const startEdit = (section: string) => { setDraft({ ...profile }); setEditing(section); };
  const cancelEdit = () => setEditing(null);
  const saveEdit = () => { setProfile({ ...draft }); setEditing(null); };

  const removeCategory = (c: string) => setDraft(d => ({ ...d, categories: d.categories.filter(x => x !== c) }));
  const addCategory = () => {
    if (newCategory.trim()) { setDraft(d => ({ ...d, categories: [...d.categories, newCategory.trim()] })); setNewCategory(""); }
  };
  const removeRegion = (r: string) => setDraft(d => ({ ...d, regions: d.regions.filter(x => x !== r) }));
  const addRegion = () => {
    if (newRegion.trim()) { setDraft(d => ({ ...d, regions: [...d.regions, newRegion.trim()] })); setNewRegion(""); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your business identity, contacts, and preferences</p>
      </div>

      {/* Header card */}
      <Card className="shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {/* Logo placeholder */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">CE</span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50">
                <Camera className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{profile.companyName}</h2>
                <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{profile.tagline}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.type}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}, {profile.country}</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{profile.website}</span>
              </div>
            </div>
            {/* Performance mini */}
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-bold text-indigo-600">B+</div>
              <div className="text-xs text-gray-400">Performance Grade</div>
              <div className="flex items-center gap-1 justify-end mt-1">
                {[1,2,3,4].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                <Star className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-500 ml-1">4.0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: About + Business Info */}
        <div className="lg:col-span-2 space-y-4">

          {/* About */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">About Company</CardTitle>
                {editing !== "about" ? (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit("about")}>
                    <Edit3 className="w-3 h-3" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={cancelEdit}><X className="w-3 h-3" /></Button>
                    <Button size="sm" className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={saveEdit}><Save className="w-3 h-3 mr-1" />Save</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {editing === "about" ? (
                <Textarea value={draft.about} onChange={(e) => setDraft({...draft, about: e.target.value})} className="resize-none text-sm" rows={4} />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">{profile.about}</p>
              )}
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Business Information</CardTitle>
                {editing !== "business" ? (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit("business")}>
                    <Edit3 className="w-3 h-3" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={cancelEdit}><X className="w-3 h-3" /></Button>
                    <Button size="sm" className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={saveEdit}><Save className="w-3 h-3 mr-1" />Save</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {editing === "business" ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Company Name", "companyName"], ["Tagline", "tagline"],
                    ["Company Type", "type"], ["Founded", "founded"],
                    ["Employees", "employees"], ["Website", "website"],
                    ["Email", "email"], ["Phone", "phone"],
                    ["Address", "address"], ["City", "city"],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <Label className="text-xs text-gray-500">{label}</Label>
                      <Input className="mt-1 h-8 text-sm" value={(draft as Record<string, string>)[key] ?? ""} onChange={(e) => setDraft({...draft, [key]: e.target.value})} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Company Type", profile.type],
                    ["Founded", profile.founded],
                    ["Employees", profile.employees],
                    ["Email", profile.email],
                    ["Phone", profile.phone],
                    ["Address", `${profile.address}, ${profile.city}`],
                    ["Region", profile.region],
                    ["Country", profile.country],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="py-1.5 border-b border-gray-50">
                      <p className="text-xs text-gray-400">{String(k)}</p>
                      <p className="text-sm font-medium text-gray-800">{String(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Categories */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Service Categories</CardTitle>
                {editing !== "categories" ? (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit("categories")}>
                    <Edit3 className="w-3 h-3" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={cancelEdit}><X className="w-3 h-3" /></Button>
                    <Button size="sm" className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={saveEdit}><Save className="w-3 h-3 mr-1" />Save</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex flex-wrap gap-2">
                {(editing === "categories" ? draft : profile).categories.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium border border-indigo-100">
                    {c}
                    {editing === "categories" && (
                      <button onClick={() => removeCategory(c)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    )}
                  </span>
                ))}
                {editing === "categories" && (
                  <div className="flex items-center gap-1.5">
                    <Input className="h-7 w-28 text-xs" placeholder="Add category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={addCategory}><Plus className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operating Regions */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Operating Regions</CardTitle>
                {editing !== "regions" ? (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit("regions")}>
                    <Edit3 className="w-3 h-3" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={cancelEdit}><X className="w-3 h-3" /></Button>
                    <Button size="sm" className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={saveEdit}><Save className="w-3 h-3 mr-1" />Save</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex flex-wrap gap-2">
                {(editing === "regions" ? draft : profile).regions.map((r) => (
                  <span key={r} className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium border border-green-100">
                    <MapPin className="w-2.5 h-2.5" /> {r}
                    {editing === "regions" && (
                      <button onClick={() => removeRegion(r)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    )}
                  </span>
                ))}
                {editing === "regions" && (
                  <div className="flex items-center gap-1.5">
                    <Input className="h-7 w-28 text-xs" placeholder="Add region" value={newRegion} onChange={(e) => setNewRegion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRegion()} />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={addRegion}><Plus className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Contacts + Bank + Certifications */}
        <div className="space-y-4">

          {/* Key Contacts */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Key Contacts</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              {CONTACTS.map((c) => (
                <div key={c.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{c.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.role}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5 pl-9">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{c.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2 text-xs">
              {[
                ["Bank", BANK.bank], ["Account Name", BANK.accountName],
                ["IBAN", BANK.iban], ["SWIFT", BANK.swift], ["Currency", BANK.currency],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-400">{String(k)}</span>
                  <span className="text-gray-700 font-medium">{String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Certifications</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              {profile.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2 text-xs">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{cert}</span>
                  <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance summary */}
          <Card className="shadow-none border-indigo-100">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              {[
                { label: "Bid Acceptance", val: 75 },
                { label: "PO Completion",  val: 88 },
                { label: "Invoice Turnaround", val: 62 },
                { label: "Response Speed", val: 91 },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-700">{val}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

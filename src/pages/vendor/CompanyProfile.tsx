import { useState } from "react";
import {
  Building2, MapPin, Phone, Mail, Globe, Edit3,
  Save, X, Camera, CheckCircle2, Star, TrendingUp,
  Shield, Plus, Loader2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const COMPANY_TYPES = [
  "Equipment Rental Company", "Construction Company", "Heavy Machinery Dealer",
  "Logistics & Transport", "Engineering Services", "Oil & Gas Services",
  "Mining Services", "Other",
];

const CERT_SUGGESTIONS = [
  "ISO 9001:2015", "OHSAS 18001", "Saudi Aramco Approved",
  "SEC Registered", "SASO Certified", "Third-Party Safety", "ARAMCO", "ISO 14001",
];

function parseJSON(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [certInput, setCertInput] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRegion, setNewRegion] = useState("");

  // Fetch real profile from API
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const { data } = await api.get("/auth/profile");
      return data;
    },
  });

  // Fetch vendor score
  const { data: scoreData } = useQuery({
    queryKey: ["vendor-score-self"],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await api.get(`/vendor-scores/${user.id}`);
      return data;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data } = await api.put("/auth/profile", updates);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["vendor-profile"], data);
      toast.success("Profile updated successfully");
      setEditing(null);
      setDraft(null);
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const startEdit = (section: string) => {
    setDraft({ ...profile });
    setEditing(section);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    updateMutation.mutate(draft);
  };

  const addCert = (cert: string) => {
    const c = cert.trim();
    if (!c) return;
    const current = parseJSON(draft?.certifications);
    if (!current.includes(c)) {
      setDraft((d: any) => ({ ...d, certifications: [...current, c] }));
    }
    setCertInput("");
  };

  const removeCert = (c: string) => {
    setDraft((d: any) => ({ ...d, certifications: parseJSON(d?.certifications).filter((x: string) => x !== c) }));
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    const current = parseJSON(draft?.categories);
    if (!current.includes(newCategory.trim())) {
      setDraft((d: any) => ({ ...d, categories: [...current, newCategory.trim()] }));
    }
    setNewCategory("");
  };

  const removeCategory = (c: string) => {
    setDraft((d: any) => ({ ...d, categories: parseJSON(d?.categories).filter((x: string) => x !== c) }));
  };

  const addRegion = () => {
    if (!newRegion.trim()) return;
    const current = parseJSON(draft?.operatingRegions);
    if (!current.includes(newRegion.trim())) {
      setDraft((d: any) => ({ ...d, operatingRegions: [...current, newRegion.trim()] }));
    }
    setNewRegion("");
  };

  const removeRegion = (r: string) => {
    setDraft((d: any) => ({ ...d, operatingRegions: parseJSON(d?.operatingRegions).filter((x: string) => x !== r) }));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <AlertCircle className="h-10 w-10 text-red-300" />
        <p className="text-sm font-medium text-gray-400">Failed to load profile</p>
      </div>
    );
  }

  // Use draft when editing, otherwise use fetched profile
  const p = (section: string) => editing === section ? draft : profile;

  const categories = parseJSON(p("categories")?.categories ?? profile.categories);
  const regions = parseJSON(p("regions")?.operatingRegions ?? profile.operatingRegions);
  const certifications = parseJSON(p("certifications")?.certifications ?? profile.certifications);
  const draftCategories = parseJSON(draft?.categories);
  const draftRegions = parseJSON(draft?.operatingRegions);
  const draftCertifications = parseJSON(draft?.certifications);

  const gradeLabel = scoreData
    ? `${scoreData.grade} (${scoreData.score}/100)`
    : profile.rating
      ? `${Number(profile.rating).toFixed(1)}/5`
      : "—";

  const initials = (profile.companyName || profile.name || "?")
    .split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

  const SaveCancelButtons = ({ section }: { section: string }) => (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={cancelEdit}>
        <X className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700"
        onClick={saveEdit}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
        Save
      </Button>
    </div>
  );

  const EditButton = ({ section }: { section: string }) => (
    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit(section)}>
      <Edit3 className="w-3 h-3" /> Edit
    </Button>
  );

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
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50">
                <Camera className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{profile.companyName || profile.name}</h2>
                <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
              {profile.about && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{profile.about}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                {profile.companyType && (
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.companyType}</span>
                )}
                {(profile.city || profile.region || profile.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[profile.city, profile.region, profile.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {profile.website && (
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{profile.website}</span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {scoreData ? (
                <>
                  <div className="text-3xl font-bold text-indigo-600">{scoreData.grade}</div>
                  <div className="text-xs text-gray-400">Performance Grade</div>
                  <div className="text-xs font-semibold text-gray-600 mt-0.5">{scoreData.score}/100</div>
                </>
              ) : profile.rating > 0 ? (
                <>
                  <div className="flex items-center gap-1 justify-end">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i <= Math.round(Number(profile.rating)) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{Number(profile.rating).toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {profile.ordersCount || 0} completed orders
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">

          {/* About */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">About Company</CardTitle>
                {editing !== "about" ? <EditButton section="about" /> : <SaveCancelButtons section="about" />}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {editing === "about" ? (
                <Textarea
                  value={draft?.about || ""}
                  onChange={(e) => setDraft((d: any) => ({ ...d, about: e.target.value }))}
                  className="resize-none text-sm"
                  rows={4}
                  placeholder="Describe your company…"
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.about || <span className="text-gray-400 italic">No description added yet. Click Edit to add one.</span>}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Business Information</CardTitle>
                {editing !== "business" ? <EditButton section="business" /> : <SaveCancelButtons section="business" />}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {editing === "business" ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Company Name", "companyName", "text"],
                    ["Contact Name", "contactName", "text"],
                    ["Phone", "phone", "text"],
                    ["Website", "website", "text"],
                    ["Address", "address", "text"],
                    ["Region", "region", "text"],
                    ["Country", "country", "text"],
                    ["Experience (Years)", "experienceYears", "number"],
                  ].map(([label, key, type]) => (
                    <div key={key}>
                      <Label className="text-xs text-gray-500">{label}</Label>
                      <Input
                        className="mt-1 h-8 text-sm"
                        type={type}
                        value={draft?.[key] ?? ""}
                        onChange={(e) => setDraft((d: any) => ({ ...d, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs text-gray-500">Company Type</Label>
                    <select
                      value={draft?.companyType || ""}
                      onChange={(e) => setDraft((d: any) => ({ ...d, companyType: e.target.value }))}
                      className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Select type…</option>
                      {COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Founded Year</Label>
                    <Input
                      className="mt-1 h-8 text-sm"
                      type="number"
                      placeholder="2008"
                      value={draft?.founded ?? ""}
                      onChange={(e) => setDraft((d: any) => ({ ...d, founded: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Company Type", profile.companyType],
                    ["Contact Name", profile.contactName],
                    ["Founded", profile.founded],
                    ["Experience", profile.experienceYears ? `${profile.experienceYears} years` : null],
                    ["Email", profile.email],
                    ["Phone", profile.phone],
                    ["Address", profile.address],
                    ["Region", profile.region],
                    ["Country", profile.country],
                    ["Website", profile.website],
                  ].map(([k, v]) => v ? (
                    <div key={String(k)} className="py-1.5 border-b border-gray-50">
                      <p className="text-xs text-gray-400">{String(k)}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{String(v)}</p>
                    </div>
                  ) : null)}
                  {!profile.companyType && !profile.phone && (
                    <p className="text-xs text-gray-400 italic col-span-2">No business information added yet. Click Edit to fill in your details.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Service Categories</CardTitle>
                {editing !== "categories" ? <EditButton section="categories" /> : <SaveCancelButtons section="categories" />}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex flex-wrap gap-2">
                {(editing === "categories" ? draftCategories : categories).map((c: string) => (
                  <span key={c} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium border border-indigo-100">
                    {c}
                    {editing === "categories" && (
                      <button onClick={() => removeCategory(c)}><X className="w-3 h-3" /></button>
                    )}
                  </span>
                ))}
                {editing === "categories" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      className="h-7 w-36 text-xs"
                      placeholder="Add category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCategory()}
                    />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={addCategory}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {!editing && categories.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No categories added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regions */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Operating Regions</CardTitle>
                {editing !== "regions" ? <EditButton section="regions" /> : <SaveCancelButtons section="regions" />}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex flex-wrap gap-2">
                {(editing === "regions" ? draftRegions : regions).map((r: string) => (
                  <span key={r} className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium border border-green-100">
                    <MapPin className="w-2.5 h-2.5" /> {r}
                    {editing === "regions" && (
                      <button onClick={() => removeRegion(r)}><X className="w-3 h-3" /></button>
                    )}
                  </span>
                ))}
                {editing === "regions" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      className="h-7 w-36 text-xs"
                      placeholder="Add region"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addRegion()}
                    />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={addRegion}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {!editing && regions.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No regions added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* Certifications */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Certifications</CardTitle>
                {editing !== "certifications" ? <EditButton section="certifications" /> : <SaveCancelButtons section="certifications" />}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              {editing === "certifications" ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draftCertifications.map((c: string) => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <Shield className="h-3 w-3" />{c}
                        <button onClick={() => removeCert(c)}><X className="h-3 w-3 ml-0.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CERT_SUGGESTIONS.filter((s) => !draftCertifications.includes(s)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addCert(s)}
                        className="h-7 px-2.5 rounded-full border border-dashed border-slate-300 text-[11px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom certification…"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(certInput); } }}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addCert(certInput)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : certifications.length > 0 ? (
                certifications.map((cert: string) => (
                  <div key={cert} className="flex items-center gap-2 text-xs">
                    <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{cert}</span>
                    <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No certifications added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          {scoreData && (
            <Card className="shadow-none border-indigo-100">
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-3">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-indigo-600">{scoreData.grade}</span>
                  <span className="text-lg font-bold text-slate-700">· {scoreData.score}/100</span>
                  <span className="text-xs text-gray-400 ml-1">{scoreData.gradeLabel}</span>
                </div>
                {[
                  { label: "Bid Acceptance", pts: scoreData.breakdown?.bidAcceptance?.pts, max: 40, pct: scoreData.breakdown?.bidAcceptance?.pct },
                  { label: "PO Completion", pts: scoreData.breakdown?.poCompletion?.pts, max: 35, pct: scoreData.breakdown?.poCompletion?.pct },
                  { label: "Response Rate", pts: scoreData.breakdown?.responseRate?.pts, max: 15, pct: scoreData.breakdown?.responseRate?.pct },
                  { label: "Experience", pts: scoreData.breakdown?.experienceBonus?.pts, max: 10, pct: null },
                ].map(({ label, pts, max, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-700">
                        {pts}/{max} pts {pct != null ? `(${pct}%)` : ""}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.round(((pts || 0) / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stats summary */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2 text-xs">
              {[
                ["Rating", profile.rating > 0 ? `${Number(profile.rating).toFixed(1)} / 5.0` : "Not rated yet"],
                ["Orders Completed", profile.ordersCount || 0],
                ["Experience", profile.experienceYears ? `${profile.experienceYears} years` : "Not specified"],
                ["Categories", parseJSON(profile.categories).length || "None added"],
                ["Certifications", parseJSON(profile.certifications).length || "None added"],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-400">{String(k)}</span>
                  <span className="text-gray-700 font-medium">{String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

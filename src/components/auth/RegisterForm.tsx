import { useState } from 'react';
import {
  Building2, Mail, Lock, User, Phone, Globe, MapPin,
  ChevronRight, ChevronLeft, Check, Loader2, Plus, X,
  Briefcase, Shield, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EQUIPMENT_CATEGORIES = [
  'Cranes', 'Excavators', 'Bulldozers', 'Dump Trucks',
  'Forklifts', 'Drilling Rigs', 'Piling Equipment', 'Concrete Pumps',
  'Lifting Equipment', 'Earthmoving Equipment', 'Transport Equipment',
  'Power Equipment', 'Generators', 'Compressors', 'Scaffolding', 'Trucks',
];

const REGIONS = [
  'Riyadh', 'Eastern Province', 'Jeddah', 'Mecca', 'Medina',
  'Dammam', 'Al-Khobar', 'Jubail', 'Yanbu', 'Tabuk', 'Abha',
];

const COMPANY_TYPES = [
  'Equipment Rental Company', 'Construction Company', 'Heavy Machinery Dealer',
  'Logistics & Transport', 'Engineering Services', 'Oil & Gas Services',
  'Mining Services', 'Other',
];

const CERT_SUGGESTIONS = [
  'ISO 9001:2015', 'OHSAS 18001', 'Saudi Aramco Approved',
  'SEC Registered', 'SASO Certified', 'Third-Party Safety', 'ARAMCO', 'ISO 14001',
];

interface RegisterFormProps {
  role: 'client' | 'vendor' | 'admin';
  onSuccess: () => void;
  onError: (msg: string) => void;
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border-2 transition-all',
              i < current  ? 'bg-blue-600 border-blue-600 text-white' :
              i === current ? 'border-blue-600 text-blue-600 bg-blue-50' :
                             'border-slate-200 text-slate-400 bg-white'
            )}>
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-[10px] font-semibold mt-1 whitespace-nowrap',
              i === current ? 'text-blue-600' : 'text-slate-400'
            )}>{label}</span>
          </div>
          {i < total - 1 && (
            <div className={cn('flex-1 h-0.5 mx-2 mb-4', i < current ? 'bg-blue-600' : 'bg-slate-100')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Input wrapper ──────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children, hint }: { label: string; icon?: any; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />}
        {children}
      </div>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function TextInput({ icon, placeholder, value, onChange, type = 'text', required }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className={cn(
        'h-10 w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400',
        'focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all',
        icon ? 'pl-9 pr-3' : 'px-3'
      )}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function RegisterForm({ role, onSuccess, onError }: RegisterFormProps) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [certInput, setCertInput] = useState('');

  const [form, setForm] = useState({
    // Step 0 — Account
    email: '', password: '', confirmPassword: '', name: '',
    // Step 1 — Company (vendor only)
    companyName: '', companyType: '', founded: '', employees: '',
    website: '', about: '', address: '', region: '', country: 'Saudi Arabia',
    phone: '',
    // Step 2 — Services (vendor only)
    categories: [] as string[],
    operatingRegions: [] as string[],
    certifications: [] as string[],
    experienceYears: '',
    // Step 3 — (optional) Contacts & Bank — simplified
    contactName: '',
  });

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));
  const toggle = (field: 'categories' | 'operatingRegions', val: string) => {
    setForm(p => ({
      ...p,
      [field]: p[field].includes(val) ? p[field].filter(x => x !== val) : [...p[field], val],
    }));
  };

  const isVendor  = role === 'vendor';
  const stepLabels = isVendor
    ? ['Account', 'Company', 'Services', 'Review']
    : ['Account', 'Review'];
  const totalSteps = stepLabels.length;

  const addCert = (cert: string) => {
    const c = cert.trim();
    if (c && !form.certifications.includes(c)) {
      setForm(p => ({ ...p, certifications: [...p.certifications, c] }));
    }
    setCertInput('');
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.email || !form.password || !form.name) return 'Please fill all required fields';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
    }
    if (step === 1 && isVendor) {
      if (!form.companyName) return 'Company name is required';
      if (!form.phone) return 'Phone number is required';
    }
    if (step === 2 && isVendor) {
      if (form.categories.length === 0) return 'Select at least one equipment category';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { onError(err); return; }
    if (step < totalSteps - 1) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { onError(err); return; }

    setIsLoading(true);
    try {
      const payload = {
        email:       form.email,
        password:    form.password,
        name:        form.name,
        role,
        ...(isVendor && {
          companyName:      form.companyName,
          contactName:      form.contactName || form.name,
          phone:            form.phone,
          companyType:      form.companyType,
          founded:          form.founded ? parseInt(form.founded) : null,
          employees:        form.employees,
          website:          form.website,
          about:            form.about,
          address:          form.address,
          region:           form.region,
          country:          form.country,
          categories:       form.categories,
          operatingRegions: form.operatingRegions,
          certifications:   form.certifications,
          experienceYears:  form.experienceYears ? parseInt(form.experienceYears) : 0,
        }),
      };

      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Store token
      if (data.token) localStorage.setItem('token', data.token);
      toast.success('Account created successfully!');
      onSuccess();
    } catch (err: any) {
      onError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <StepIndicator current={step} total={totalSteps} labels={stepLabels} />

      {/* ── Step 0: Account ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4 animate-reveal">
          <Field label="Full Name *" icon={User}>
            <TextInput icon placeholder="Your full name" value={form.name} onChange={(v: string) => set('name', v)} required />
          </Field>
          <Field label="Email Address *" icon={Mail}>
            <TextInput icon type="email" placeholder="you@company.com" value={form.email} onChange={(v: string) => set('email', v)} required />
          </Field>
          <Field label="Password *" icon={Lock}>
            <TextInput icon type="password" placeholder="Min 6 characters" value={form.password} onChange={(v: string) => set('password', v)} required />
          </Field>
          <Field label="Confirm Password *" icon={Lock}>
            <TextInput icon type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(v: string) => set('confirmPassword', v)} required />
          </Field>
        </div>
      )}

      {/* ── Step 1: Company (vendor only) ────────────────────────────────────── */}
      {step === 1 && isVendor && (
        <div className="space-y-4 animate-reveal">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company Name *" icon={Building2}>
              <TextInput icon placeholder="Cisco Equipment Co." value={form.companyName} onChange={(v: string) => set('companyName', v)} required />
            </Field>
            <Field label="Phone *" icon={Phone}>
              <TextInput icon placeholder="+966 55 000 0000" value={form.phone} onChange={(v: string) => set('phone', v)} required />
            </Field>
          </div>

          <Field label="Company Type">
            <select
              value={form.companyType}
              onChange={e => set('companyType', e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select type…</option>
              {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Founded Year">
              <TextInput placeholder="2008" value={form.founded} onChange={(v: string) => set('founded', v)} />
            </Field>
            <Field label="Employees">
              <select
                value={form.employees}
                onChange={e => set('employees', e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select range…</option>
                {['1-10','11-50','51-150','150-200','200-500','500+'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Website" icon={Globe}>
            <TextInput icon placeholder="https://your-company.com" value={form.website} onChange={(v: string) => set('website', v)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Region / City" icon={MapPin}>
              <select
                value={form.region}
                onChange={e => set('region', e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select region…</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Experience (Years)">
              <TextInput type="number" placeholder="0" value={form.experienceYears} onChange={(v: string) => set('experienceYears', v)} />
            </Field>
          </div>

          <Field label="Address">
            <TextInput placeholder="King Fahd Road, Al-Khobar" value={form.address} onChange={(v: string) => set('address', v)} />
          </Field>

          <Field label="About Company" hint="Brief description of your company and services">
            <textarea
              placeholder="We are a leading heavy machinery rental provider…"
              value={form.about}
              onChange={e => set('about', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </Field>
        </div>
      )}

      {/* ── Step 2: Services (vendor only) ────────────────────────────────────── */}
      {step === 2 && isVendor && (
        <div className="space-y-5 animate-reveal">

          {/* Equipment categories */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Equipment Categories * <span className="text-blue-600">({form.categories.length} selected)</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-3">These determine which client RFQs you appear in.</p>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle('categories', cat)}
                  className={cn(
                    'flex items-center gap-2 h-9 px-3 rounded-lg border text-[12px] font-medium text-left transition-all',
                    form.categories.includes(cat)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  <div className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                    form.categories.includes(cat) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  )}>
                    {form.categories.includes(cat) && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Operating regions */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Operating Regions <span className="text-blue-600">({form.operatingRegions.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggle('operatingRegions', r)}
                  className={cn(
                    'h-8 px-3 rounded-full border text-[12px] font-medium transition-all',
                    form.operatingRegions.includes(r)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Certifications
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.certifications.map(c => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <Shield className="h-3 w-3" />{c}
                  <button onClick={() => setForm(p => ({ ...p, certifications: p.certifications.filter(x => x !== c) }))}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              ))}
            </div>
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CERT_SUGGESTIONS.filter(s => !form.certifications.includes(s)).map(s => (
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
              <input
                placeholder="Type custom certification…"
                value={certInput}
                onChange={e => setCertInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(certInput); } }}
                className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => addCert(certInput)}
                className="h-9 px-3 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 / Final: Review (vendor) or Step 1 (client) ────────────────── */}
      {((isVendor && step === 3) || (!isVendor && step === 1)) && (
        <div className="space-y-4 animate-reveal">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-[13px] font-semibold text-blue-700 mb-3">Review your details</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-semibold text-slate-800">{form.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold text-slate-800">{form.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-semibold text-slate-800 capitalize">{role}</span></div>
              {isVendor && <>
                <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="font-semibold text-slate-800">{form.companyName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-semibold text-slate-800">{form.companyType || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Region</span><span className="font-semibold text-slate-800">{form.region || '—'}</span></div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 shrink-0">Categories</span>
                  <span className="font-semibold text-slate-800 text-right">{form.categories.join(', ') || '—'}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 shrink-0">Certifications</span>
                  <span className="font-semibold text-slate-800 text-right">{form.certifications.join(', ') || '—'}</span>
                </div>
              </>}
            </div>
          </div>

          {isVendor && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex gap-2">
              <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                Your profile will be visible to clients browsing vendors in your equipment categories. You can update all details from your profile page after registration.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}

        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Phone, User, Award, History, Package, Loader2, ArrowRight, CheckCircle2, Star, ListChecks } from 'lucide-react';

const EQUIPMENT_CATEGORIES = [
  'Cranes', 'Excavators', 'Bulldozers', 'Dump Trucks', 'Forklifts', 
  'Drilling Rigs', 'Piling Equipment', 'Concrete Pumps'
];

export default function VendorProfile() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    phone: user?.phone || '',
    contactName: user?.contactName || '',
    experienceYears: user?.experienceYears || 0,
    certifications: user?.certifications?.join(', ') || '',
    categories: user?.categories || [],
    rating: user?.rating || 0,
    ordersCount: user?.ordersCount || 0,
  });

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...(prev.categories || []), category]
        : (prev.categories || []).filter(c => c !== category)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const updatedData = {
      ...formData,
      experienceYears: Number(formData.experienceYears),
      rating: Number(formData.rating),
      ordersCount: Number(formData.ordersCount),
      certifications: typeof formData.certifications === 'string' 
        ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean)
        : formData.certifications,
    };

    const success = await updateProfile(updatedData);
    setIsLoading(false);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }
  };

  if (!user) return null;

  const isProfileComplete = !!user.companyName;

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <Card className="max-w-3xl w-full glass border-none ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16" />
        
        <CardHeader className="space-y-1 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-white/5 border-none">
              Account Setup
            </Badge>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">
            {isProfileComplete ? 'Vendor Profile' : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription className="text-muted-foreground/60 font-medium">
            {isProfileComplete 
              ? 'Keep your business details updated for procurement opportunities.' 
              : 'Add your company details to start submitting bids and receiving RFQs.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="companyName"
                    placeholder="e.g. Saudi Heavy Industries"
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 font-bold"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Primary Contact</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="contactName"
                    placeholder="Contact person name"
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 font-bold"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="phone"
                    placeholder="+966"
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 font-bold"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Experience (Years)</Label>
                <div className="relative">
                  <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="experience"
                    type="number"
                    placeholder="0"
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 font-bold"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label htmlFor="rating" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Rating (0-5)</Label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="4.8"
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 font-bold"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>
              </div>

              {/* Orders Completed */}
              <div className="space-y-2">
                <Label htmlFor="ordersCount" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Orders Completed</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="ordersCount"
                    type="number"
                    placeholder="0"
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 font-bold"
                    value={formData.ordersCount}
                    onChange={(e) => setFormData({ ...formData, ordersCount: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Equipment Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
                    <Checkbox 
                      id={category} 
                      checked={formData.categories?.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                    />
                    <label
                      htmlFor={category}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-2">
              <Label htmlFor="certs" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Certifications (Comma separated)</Label>
              <div className="relative">
                <Award className="absolute left-3 top-4 h-4 w-4 text-muted-foreground/40" />
                <textarea
                  id="certs"
                  placeholder="ARAMCO, ISO 9001, Third-Party Safety"
                  className="w-full min-h-[100px] pl-10 pt-3 pb-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none font-bold text-sm resize-none"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Profile Updated
                </>
              ) : (
                <>
                  Save Profile Details
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

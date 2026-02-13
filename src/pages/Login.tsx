import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Users, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/auth';
import { toast } from 'sonner';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

const roleConfig: Record<AppRole, { icon: React.ElementType; label: string; color: string; desc: string }> = {
  client: { icon: User, label: 'Client', color: 'text-blue-500', desc: 'Equipment & RFQs' },
  vendor: { icon: Users, label: 'Vendor', color: 'text-emerald-500', desc: 'Bids & Orders' },
  admin: { icon: Shield, label: 'Admin', color: 'text-purple-500', desc: 'Management' },
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<AppRole>('client');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    toast.success('Authentication successful!');
    const redirectPath = selectedRole === 'vendor' ? '/vendor' :
      selectedRole === 'admin' ? '/admin' : '/';
    navigate(redirectPath);
  };

  const handleDemoLogin = async (role: AppRole) => {
    setIsLoading(true);
    setSelectedRole(role);
    const demoCredentials: Record<AppRole, { email: string; password: string }> = {
      client: { email: 'client@example.com', password: '123' },
      vendor: { email: 'vendor1@example.com', password: '123' },
      admin: { email: 'admin@example.com', password: '123' },
    };

    const { email, password } = demoCredentials[role];
    const success = await login(email, password, role);
    setIsLoading(false);

    if (success) {
      toast.success(`Logged in as ${roleConfig[role].label}`);
      const redirectPath = role === 'vendor' ? '/vendor' :
        role === 'admin' ? '/admin' : '/';
      navigate(redirectPath);
    } else {
      toast.error('Demo login failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-transform hover:scale-110">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                VendorHub
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Professional Portal v2.1</p>
            </div>
          </div>
        </div>

        <Card className="glass overflow-hidden border-none ring-1 ring-white/10">
          <CardHeader className="p-8 pb-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/20 p-1 rounded-xl">
                <TabsTrigger value="login" className="text-sm font-bold py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-bold py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                  Register
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4 mb-8">
                <p className="text-[11px] uppercase tracking-widest font-bold text-center text-muted-foreground/80">
                  Identify your access role
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(roleConfig) as [AppRole, typeof roleConfig[AppRole]][]).map(([role, config], idx) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${selectedRole === role
                        ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)] -translate-y-1'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 grayscale'
                        }`}
                    >
                      <config.icon className={`h-6 w-6 ${selectedRole === role ? config.color : 'text-muted-foreground'}`} />
                      <span className="text-[11px] font-bold tracking-tight">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <TabsContent value="login" className="mt-0">
                <LoginForm
                  role={selectedRole}
                  onSuccess={handleAuthSuccess}
                  onError={(msg) => toast.error(msg)}
                />
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                    <span className="bg-transparent px-3 text-muted-foreground">Demo Access</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full py-6 bg-white/5 border-dashed border-white/10 hover:bg-white/10 hover:border-primary/50 text-xs font-bold transition-all"
                  onClick={() => handleDemoLogin(selectedRole)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Enter Workspace as ${roleConfig[selectedRole].label}`}
                </Button>
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 text-[10px] text-center text-muted-foreground leading-relaxed">
                  <span className="opacity-60">Credentials for evaluation</span><br />
                  <b className="text-primary/80 font-mono">{selectedRole}@example.com</b> | Pass: <b className="text-primary/80 font-mono">123</b>
                </div>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <RegisterForm
                  role={selectedRole}
                  onSuccess={handleAuthSuccess}
                  onError={(msg) => toast.error(msg)}
                />
                <p className="text-[10px] text-center text-muted-foreground/60 mt-6 px-4 leading-relaxed italic">
                  By joining, you acknowledge our professional protocols and privacy standards.
                </p>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent className="p-8" />
        </Card>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/40 font-medium">Volvitech © 2026. All rights secured.</p>
        </div>
      </div>
    </div>
  );
}

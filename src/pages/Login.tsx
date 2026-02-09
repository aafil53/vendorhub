import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Users, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">VendorHub <span className="text-xs font-normal text-muted-foreground opacity-50">v2.1</span></h1>
          </div>
          <p className="text-muted-foreground">Access your supplier management portal</p>
        </div>

        <Card className="border-2 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" className="text-base py-2">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-base py-2">Register</TabsTrigger>
              </TabsList>
              
              <div className="space-y-4 mb-6">
                <p className="text-sm font-medium text-center text-muted-foreground">Select your role</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(roleConfig) as [AppRole, typeof roleConfig[AppRole]][]).map(([role, config]) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        selectedRole === role 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <config.icon className={`h-5 w-5 ${selectedRole === role ? config.color : 'text-muted-foreground'}`} />
                      <span className="text-xs font-semibold">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <TabsContent value="login">
                <LoginForm 
                  role={selectedRole} 
                  onSuccess={handleAuthSuccess} 
                  onError={(msg) => toast.error(msg)} 
                />
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or demo login</span></div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => handleDemoLogin(selectedRole)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Quick Demo as ${roleConfig[selectedRole].label}`}
                </Button>
                
                <div className="mt-4 p-3 rounded-lg bg-muted/30 text-[10px] text-center text-muted-foreground">
                  Demo User: {selectedRole}@example.com | Pass: 123
                </div>
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm 
                  role={selectedRole} 
                  onSuccess={handleAuthSuccess} 
                  onError={(msg) => toast.error(msg)} 
                />
                <p className="text-[10px] text-center text-muted-foreground mt-4 px-6">
                  By registering, you agree to our terms of service and privacy policy.
                </p>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6" />
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Users, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/auth';
import { toast } from 'sonner';

const roleConfig: Record<AppRole, { icon: React.ElementType; label: string; description: string; color: string }> = {
  client: {
    icon: User,
    label: 'Client',
    description: 'Manage equipment and create RFQs',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  vendor: {
    icon: Users,
    label: 'Vendor',
    description: 'View RFQs and submit bids',
    color: 'bg-emerald-500 hover:bg-emerald-600',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'System administration',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    const success = await login(email, password, selectedRole);
    setIsLoading(false);

    if (success) {
      toast.success('Login successful!');
      const redirectPath = selectedRole === 'vendor' ? '/vendor' : 
                           selectedRole === 'admin' ? '/admin' : '/';
      navigate(redirectPath);
    } else {
      toast.error('Invalid credentials', {
        description: 'Please check your email, password, and role selection.',
      });
    }
  };

  const handleDemoLogin = async (role: AppRole) => {
    setIsLoading(true);
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">VendorHub</h1>
          </div>
          <p className="text-muted-foreground">Select your role to continue</p>
        </div>

        {/* Role Selection */}
        {!selectedRole ? (
          <div className="grid md:grid-cols-3 gap-4">
            {(Object.entries(roleConfig) as [AppRole, typeof roleConfig[AppRole]][]).map(([role, config]) => (
              <Card 
                key={role} 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
                onClick={() => setSelectedRole(role)}
              >
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${config.color} mb-3`}>
                    <config.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle>{config.label}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin(role);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Quick Demo Login'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedRole(null)}
                >
                  ← Back
                </Button>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${roleConfig[selectedRole].color}`}>
                  {(() => {
                    const Icon = roleConfig[selectedRole].icon;
                    return <Icon className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <div>
                  <CardTitle className="text-lg">{roleConfig[selectedRole].label} Login</CardTitle>
                  <CardDescription className="text-sm">{roleConfig[selectedRole].description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">Demo Credentials:</p>
                <p className="text-muted-foreground">
                  Email: {selectedRole}@example.com<br />
                  Password: 123
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

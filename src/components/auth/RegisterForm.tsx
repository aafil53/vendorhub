import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegisterFormProps {
  role: AppRole;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function RegisterForm({ role, onSuccess, onError }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await register(email, password, name, role);
    setIsLoading(false);

    if (success) {
      if (role === 'vendor') {
        navigate('/vendor'); // Redirect to dashboard, which will redirect to /vendor/profile if needed
      }
      onSuccess();
    } else {
      onError('Registration failed. Email might already be in use.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="fullname">Full Name</Label>
        <Input
          id="fullname"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Register as ' + (role.charAt(0).toUpperCase() + role.slice(1))
        )}
      </Button>
    </form>
  );
}

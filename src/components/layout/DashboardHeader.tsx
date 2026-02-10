import { Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-xl px-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground animate-reveal">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground/50 animate-reveal delay-100">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 animate-reveal delay-200">
        {/* Search */}
        <div className="relative hidden lg:block group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search equipment, vendors..." 
            className="w-80 pl-10 bg-white/5 border-none ring-1 ring-white/10 focus-visible:ring-primary/50 transition-all rounded-xl h-10 text-sm"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-foreground leading-none">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground/60 font-medium">Active Session</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            className="h-10 w-10 rounded-xl bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground transition-all group"
            title="Logout"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}


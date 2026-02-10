import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Building2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },
  { icon: Package, label: 'Equipment', path: 'equipment', badge: 4 },
  { icon: Users, label: 'Vendors', path: 'vendors' },
  { icon: FileText, label: 'RFQ & Bids', path: 'rfq', badge: 12 },
  { icon: Package, label: 'Purchase Orders', path: 'orders' },
  { icon: BarChart3, label: 'Reports', path: 'reports' },
  { icon: Settings, label: 'Settings', path: 'settings' },
];

interface DashboardSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function DashboardSidebar({ currentView, onNavigate }: DashboardSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass border-r-0 ring-1 ring-white/10 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-4 px-6 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-glow">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">VendorHub</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">Core Operations</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-2">
          {navItems.map((item, idx) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "group relative flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 animate-reveal",
                currentView === item.path
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.05)] ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {currentView === item.path && (
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              )}
              
              <div className="flex items-center gap-3.5">
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  currentView === item.path 
                    ? "brightness-125 scale-110" 
                    : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                )} />
                <span className="tracking-tight">{item.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-lg px-2 text-[10px] font-bold",
                    currentView === item.path
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted/30 text-muted-foreground group-hover:bg-muted/50"
                  )}>
                    {item.badge}
                  </span>
                )}
                {currentView === item.path && (
                  <ChevronRight className="h-4 w-4 animate-in fade-in slide-in-from-left-1" />
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 mt-auto">
          <div className="glass rounded-2xl p-4 ring-1 ring-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                  <span className="text-sm font-black text-white">JD</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-success shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">John Doe</p>
                <p className="text-[10px] uppercase tracking-tighter font-extrabold text-muted-foreground/60 truncate">Client Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}


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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">VendorHub</h1>
            <p className="text-xs text-sidebar-muted">Management System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                currentView === item.path
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  currentView === item.path ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"
                )} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    currentView === item.path
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-sidebar-muted text-sidebar-foreground"
                  )}>
                    {item.badge}
                  </span>
                )}
                {currentView === item.path && (
                  <ChevronRight className="h-4 w-4 text-sidebar-primary" />
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
              <p className="text-xs text-sidebar-muted truncate">Client Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

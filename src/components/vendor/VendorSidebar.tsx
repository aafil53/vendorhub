import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  ShoppingCart,
  Receipt,
  FolderOpen,
  Building2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext"; // adjust to your auth hook

const navItems = [
  { label: "Dashboard",     icon: LayoutDashboard, to: "/vendor/dashboard" },
  { label: "RFQ Inbox",     icon: Inbox,           to: "/vendor/rfq-inbox",  badge: 3 },
  { label: "Quotations",    icon: FileText,         to: "/vendor/quotations" },
  { label: "Orders",        icon: ShoppingCart,     to: "/vendor/orders" },
  { label: "Invoices",      icon: Receipt,          to: "/vendor/invoices" },
  { label: "Documents",     icon: FolderOpen,       to: "/vendor/documents" },
  { label: "Company Profile", icon: Building2,      to: "/vendor/profile" },
];

export function VendorSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex flex-col z-40 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">VH</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">VendorHub</p>
          <p className="text-xs text-gray-400">Supplier Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span className="flex-1">{label}</span>
                {badge !== undefined && (
                  <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {badge}
                  </span>
                )}
                {isActive && !badge && (
                  <ChevronRight className="w-3 h-3 text-indigo-400 ml-auto" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() ?? "V"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.name ?? "Vendor"}</p>
            <p className="text-[10px] text-gray-400">Vendor</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

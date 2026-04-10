import { Outlet } from "react-router-dom";
import { VendorSidebar } from "./VendorSidebar";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function VendorLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar />

      {/* Main content */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment, vendor…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "V"}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name ?? "Vendor"}</p>
                <p className="text-xs text-gray-400">Supplier</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

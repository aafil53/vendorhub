import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { VendorSelection } from '@/components/vendors/VendorSelection';
import { VendorList } from '@/components/vendors/VendorList';
import { RFQList } from '@/components/rfq/RFQList';
import { BidComparison } from '@/components/rfq/BidComparison';
import { OrderHistory } from '@/components/orders/OrderHistory';
import { AdminBids } from '@/components/admin/AdminBids';
import { Equipment, RFQ, Bid } from '@/types/vendor';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

type ViewState =
  | { type: 'dashboard' }
  | { type: 'equipment' }
  | { type: 'vendors' }
  | { type: 'vendor-selection'; equipment: Equipment }
  | { type: 'rfq' }
  | { type: 'bidding'; rfq: RFQ }
  | { type: 'orders' }
  | { type: 'reports' }
  | { type: 'settings' }
  | { type: 'admin-bids' }; // New view for admin

const viewTitles: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your vendor management system' },
  equipment: { title: 'Equipment Inventory', subtitle: 'Manage equipment and detect shortages' },
  vendors: { title: 'Vendor Management', subtitle: 'Browse and manage vendor relationships' },
  'vendor-selection': { title: 'Vendor Bidding System', subtitle: 'Select vendors for RFQ' },
  rfq: { title: 'RFQ & Bids', subtitle: 'Manage requests for quotation and compare bids' },
  bidding: { title: 'Bid Comparison', subtitle: 'Compare and select vendor bids' },
  orders: { title: 'Purchase Orders', subtitle: 'Track and manage orders' },
  'admin-bids': { title: 'Admin Dashboard', subtitle: 'Review and approve bids' },
  reports: { title: 'Reports', subtitle: 'Analytics and reporting' },
  settings: { title: 'Settings', subtitle: 'System configuration' },
};

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'dashboard' });
  const [userRole, setUserRole] = useState<string>('client');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role);
        // Default admin to admin view
        if (decoded.role === 'admin') {
          setViewState({ type: 'admin-bids' });
        }
      } catch (e) { }
    }
  }, []);

  const handleNavigate = (path: string) => {
    switch (path) {
      case 'dashboard':
        setViewState({ type: 'dashboard' });
        break;
      case 'equipment':
        setViewState({ type: 'equipment' });
        break;
      case 'vendors':
        setViewState({ type: 'vendors' });
        break;
      case 'rfq':
        setViewState({ type: 'rfq' });
        break;
      case 'orders':
        setViewState({ type: 'orders' });
        break;
      case 'reports':
        setViewState({ type: 'reports' });
        break;
      case 'settings':
        setViewState({ type: 'settings' });
        break;
      default:
        console.warn('Unknown path:', path);
    }
  };

  const handleCheckVendors = (equipment: Equipment) => {
    setViewState({ type: 'vendor-selection', equipment });
  };

  const handleSendRFQ = (vendorIds: number[]) => {
    // Toast is handled in component
    setViewState({ type: 'rfq' });
  };

  const handleViewBids = (rfq: RFQ) => {
    setViewState({ type: 'bidding', rfq });
  };

  const handleOrderCreated = () => {
    setViewState({ type: 'orders' });
  };

  const currentViewKey = viewState.type === 'vendor-selection' ? 'vendor-selection' :
    viewState.type === 'bidding' ? 'bidding' :
      viewState.type;
  const headerInfo = viewTitles[currentViewKey] || { title: 'Dashboard' };

  const renderContent = () => {
    // Admin Override
    if (viewState.type === 'admin-bids' || (userRole === 'admin' && viewState.type === 'dashboard')) {
      return <AdminBids />;
    }

    switch (viewState.type) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'equipment':
        return <EquipmentTable onCheckVendors={handleCheckVendors} />;
      case 'vendors':
        return <VendorList />;
      case 'vendor-selection':
        return (
          <VendorSelection
            equipment={viewState.equipment}
            onSendRFQ={handleSendRFQ}
            onBack={() => setViewState({ type: 'equipment' })}
          />
        );
      case 'rfq':
        return <RFQList onViewBids={handleViewBids} />;
      case 'bidding':
        return (
          <BidComparison
            rfq={viewState.rfq}
            onOrderCreated={handleOrderCreated}
            onBack={() => setViewState({ type: 'rfq' })}
          />
        );
      case 'orders':
        return <OrderHistory />;
      case 'reports':
        return (
          <div className="flex items-center justify-center h-96 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Reports section coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-96 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Settings section coming soon...</p>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        currentView={viewState.type === 'vendor-selection' ? 'equipment' :
          viewState.type === 'bidding' ? 'rfq' :
            viewState.type}
        onNavigate={handleNavigate}
      />
      <div className="pl-64">
        <DashboardHeader {...headerInfo} />
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;

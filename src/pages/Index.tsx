import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { EquipmentCatalog } from '@/components/equipment/EquipmentCatalog';
import { VendorSelection } from '@/components/vendors/VendorSelection';
import { VendorList } from '@/components/vendors/VendorList';
import { RFQList } from '@/components/rfq/RFQList';
import { BidComparison } from '@/components/rfq/BidComparison';
import { OrderHistory } from '@/components/orders/OrderHistory';
import { AdminBids } from '@/components/admin/AdminBids';
import { Equipment, RFQ, Bid } from '@/types/vendor';
import { jwtDecode } from 'jwt-decode';

type ViewState =
  | { type: 'dashboard' }
  | { type: 'equipment' }
  | { type: 'equipment-catalog' }
  | { type: 'vendors' }
  | { type: 'vendor-selection'; category: string; equipmentId?: number; equipmentName?: string }
  | { type: 'rfq' }
  | { type: 'bidding'; rfq: RFQ }
  | { type: 'orders' }
  | { type: 'reports' }
  | { type: 'settings' }
  | { type: 'admin-bids' };

const viewMeta: Record<string, { title: string; subtitle?: string }> = {
  dashboard:          { title: 'Dashboard',         subtitle: 'Overview of your vendor management system' },
  equipment:          { title: 'System Inventory',  subtitle: 'Manage equipment and detect shortages' },
  'equipment-catalog':{ title: 'Equipment Catalog', subtitle: 'Browse available equipment by vendor category' },
  vendors:            { title: 'Vendor Directory',  subtitle: 'Browse and connect with vendors' },
  'vendor-selection': { title: 'Send RFQ',          subtitle: 'Select vendors and send a request for quotation' },
  rfq:                { title: 'RFQ & Bids',        subtitle: 'Manage requests for quotation and compare bids' },
  bidding:            { title: 'Bid Comparison',    subtitle: 'Compare and select vendor bids' },
  orders:             { title: 'Purchase Orders',   subtitle: 'Track and manage orders' },
  'admin-bids':       { title: 'Admin Dashboard',   subtitle: 'Review and approve bids' },
  reports:            { title: 'Reports',           subtitle: 'Analytics and reporting' },
  settings:           { title: 'Settings',          subtitle: 'System configuration' },
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
        if (decoded.role === 'admin') {
          setViewState({ type: 'admin-bids' });
        } else if (decoded.role === 'client') {
          setViewState({ type: 'equipment-catalog' });
        }
      } catch {}
    }
  }, []);

  const handleNavigate = (path: string) => {
    switch (path) {
      case 'dashboard': setViewState({ type: 'dashboard' }); break;
      case 'equipment': setViewState(userRole === 'client' ? { type: 'equipment-catalog' } : { type: 'equipment' }); break;
      case 'vendors':   setViewState({ type: 'vendors' }); break;
      case 'rfq':       setViewState({ type: 'rfq' }); break;
      case 'orders':    setViewState({ type: 'orders' }); break;
      case 'reports':   setViewState({ type: 'reports' }); break;
      case 'settings':  setViewState({ type: 'settings' }); break;
    }
  };

  const handleCheckVendors = (equipment: Equipment) => {
    setViewState({ type: 'vendor-selection', category: equipment.category, equipmentId: parseInt(equipment.id), equipmentName: equipment.name });
  };
  const handleSelectCategory = (category: string) => setViewState({ type: 'vendor-selection', category });
  const handleSendRFQ = (_vendorIds: number[]) => setViewState({ type: 'rfq' });
  const handleViewBids = (rfq: RFQ) => setViewState({ type: 'bidding', rfq });
  const handleOrderCreated = () => setViewState({ type: 'orders' });

  const currentViewKey =
    viewState.type === 'vendor-selection' ? 'vendor-selection' :
    viewState.type === 'bidding'          ? 'bidding' :
    viewState.type;
  const { title, subtitle } = viewMeta[currentViewKey] || { title: 'Dashboard' };

  const sidebarKey =
    viewState.type === 'vendor-selection' ? 'equipment' :
    viewState.type === 'bidding'          ? 'rfq' :
    viewState.type === 'equipment-catalog'? 'equipment' :
    viewState.type;

  const renderContent = () => {
    if (viewState.type === 'admin-bids' || (userRole === 'admin' && viewState.type === 'dashboard')) {
      return <AdminBids />;
    }
    switch (viewState.type) {
      case 'dashboard':         return <DashboardOverview />;
      case 'equipment':         return <EquipmentTable onCheckVendors={handleCheckVendors} />;
      case 'equipment-catalog': return <EquipmentCatalog onSelectCategory={handleSelectCategory} />;
      case 'vendors':           return <VendorList onSendRFQ={handleSelectCategory} />;
      case 'vendor-selection':  return (
        <VendorSelection
          category={viewState.category}
          equipmentId={viewState.equipmentId}
          equipmentName={viewState.equipmentName}
          onSendRFQ={handleSendRFQ}
          onBack={() => setViewState(userRole === 'client' ? { type: 'equipment-catalog' } : { type: 'equipment' })}
        />
      );
      case 'rfq':     return <RFQList onViewBids={handleViewBids} />;
      case 'bidding': return (
        <BidComparison
          rfq={viewState.rfq}
          onOrderCreated={handleOrderCreated}
          onBack={() => setViewState({ type: 'rfq' })}
        />
      );
      case 'orders': return <OrderHistory />;
      case 'reports': return (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-slate-200 bg-white">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-base font-semibold text-slate-500">Reports coming soon</p>
          <p className="text-sm text-slate-400 mt-1">Advanced analytics will be available here.</p>
        </div>
      );
      case 'settings': return (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-slate-200 bg-white">
          <div className="text-4xl mb-3">⚙️</div>
          <p className="text-base font-semibold text-slate-500">Settings coming soon</p>
          <p className="text-sm text-slate-400 mt-1">System configuration will be available here.</p>
        </div>
      );
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentView={sidebarKey} onNavigate={handleNavigate} />

      {/* pl-60 matches the new sidebar w-60 (240px) */}
      <div className="pl-60 flex flex-col min-h-screen">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">
          <div className="max-w-[1440px] mx-auto animate-reveal">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

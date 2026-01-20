import { useState } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { VendorSelection } from '@/components/vendors/VendorSelection';
import { VendorList } from '@/components/vendors/VendorList';
import { RFQList } from '@/components/rfq/RFQList';
import { BiddingComparison } from '@/components/bidding/BiddingComparison';
import { Equipment, RFQ, Bid } from '@/types/vendor';
import { mockRFQs } from '@/data/mockData';
import { toast } from 'sonner';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'equipment' }
  | { type: 'vendors' }
  | { type: 'vendor-selection'; equipment: Equipment }
  | { type: 'rfq' }
  | { type: 'bidding'; rfq: RFQ }
  | { type: 'reports' }
  | { type: 'settings' };

const viewTitles: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your vendor management system' },
  equipment: { title: 'Equipment Inventory', subtitle: 'Manage equipment and detect shortages' },
  vendors: { title: 'Vendor Management', subtitle: 'Browse and manage vendor relationships' },
  'vendor-selection': { title: 'Vendor Bidding System', subtitle: 'Select vendors for RFQ' },
  rfq: { title: 'RFQ & Bids', subtitle: 'Manage requests for quotation and compare bids' },
  bidding: { title: 'Bid Comparison', subtitle: 'Compare and select vendor bids' },
  reports: { title: 'Reports', subtitle: 'Analytics and reporting' },
  settings: { title: 'Settings', subtitle: 'System configuration' },
};

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'dashboard' });

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
      case 'reports':
        setViewState({ type: 'reports' });
        break;
      case 'settings':
        setViewState({ type: 'settings' });
        break;
    }
  };

  const handleCheckVendors = (equipment: Equipment) => {
    setViewState({ type: 'vendor-selection', equipment });
  };

  const handleSendRFQ = (vendorIds: string[]) => {
    toast.success(`RFQ sent to ${vendorIds.length} vendor(s)`, {
      description: 'Vendors will be notified and can submit their bids.',
    });
    setViewState({ type: 'rfq' });
  };

  const handleViewBids = (rfq: RFQ) => {
    setViewState({ type: 'bidding', rfq });
  };

  const handleSelectVendor = (bid: Bid) => {
    toast.success(`Vendor ${bid.vendorName} selected!`, {
      description: 'A purchase order will be generated.',
    });
    setViewState({ type: 'rfq' });
  };

  const currentViewKey = viewState.type === 'vendor-selection' ? 'vendor-selection' : 
                          viewState.type === 'bidding' ? 'bidding' : 
                          viewState.type;
  const headerInfo = viewTitles[currentViewKey] || { title: 'Dashboard' };

  const renderContent = () => {
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
          <BiddingComparison 
            bids={viewState.rfq.bids}
            equipmentName={viewState.rfq.equipmentName}
            quantity={viewState.rfq.quantity}
            onSelectVendor={handleSelectVendor}
            onBack={() => setViewState({ type: 'rfq' })}
          />
        );
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

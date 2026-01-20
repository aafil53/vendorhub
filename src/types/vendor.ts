export type CertificationType = 'ARAMCO' | 'Third-Party' | 'Labour';
export type RentalPeriod = 'Daily' | 'Weekly' | 'Monthly';
export type EquipmentCategory = 'Lifting' | 'Earthmoving' | 'Transport' | 'Power';
export type BidStatus = 'pending' | 'submitted' | 'accepted' | 'rejected';
export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'completed';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  specifications: string;
  rentalPeriod: RentalPeriod;
  certificationRequired: CertificationType;
  available: number;
  required: number;
  shortage: number;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  equipmentCategories: EquipmentCategory[];
  certifications: CertificationType[];
  rating: number;
  completedOrders: number;
}

export interface Bid {
  id: string;
  vendorId: string;
  vendorName: string;
  rfqId: string;
  price: number;
  availability: string;
  certification: CertificationType;
  status: BidStatus;
  submittedAt: string;
  notes?: string;
}

export interface RFQ {
  id: string;
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  specifications: string;
  createdAt: string;
  deadline: string;
  selectedVendors: string[];
  bids: Bid[];
  status: 'open' | 'closed' | 'awarded';
}

export interface PurchaseOrder {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  equipmentName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

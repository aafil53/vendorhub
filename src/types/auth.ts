export type AppRole = 'client' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  companyName?: string;
  phone?: string;
  contactName?: string;
  certifications?: string[];
  categories?: string[];
  experienceYears?: number;
  ordersCount?: number;
  rating?: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: AppRole) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: AppRole) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: AppRole) => boolean;
}

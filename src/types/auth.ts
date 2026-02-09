export type AppRole = 'client' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: AppRole) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: AppRole) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: AppRole) => boolean;
}

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AppRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  'client@example.com': {
    password: 'client123',
    user: { id: 'u1', email: 'client@example.com', name: 'John Doe', role: 'client' }
  },
  'vendor@example.com': {
    password: 'vendor123',
    user: { id: 'u2', email: 'vendor@example.com', name: 'Ahmed Al-Rashid', role: 'vendor' }
  },
  'admin@example.com': {
    password: 'admin123',
    user: { id: 'u3', email: 'admin@example.com', name: 'System Admin', role: 'admin' }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string, role: AppRole): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = mockUsers[email.toLowerCase()];
    
    if (mockUser && mockUser.password === password && mockUser.user.role === role) {
      setUser(mockUser.user);
      localStorage.setItem('currentUser', JSON.stringify(mockUser.user));
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const hasRole = useCallback((role: AppRole): boolean => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

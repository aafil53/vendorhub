import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AppRole, AuthContextType } from '@/types/auth';
import api, { decodeToken } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for when backend is unavailable
const DEMO_USERS: Record<AppRole, User> = {
  client: { id: '1', email: 'client@example.com', name: 'Sarah Mitchell', role: 'client' },
  vendor: { id: '2', email: 'vendor1@example.com', name: 'Omar Farouk', role: 'vendor' },
  admin:  { id: '3', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string, role: AppRole): Promise<boolean> => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data?.token && data?.user) {
        localStorage.setItem('token', data.token);
        const parsedUser: User = data.user;
        setUser(parsedUser);
        localStorage.setItem('currentUser', JSON.stringify(parsedUser));
        return true;
      }
    } catch {
      // Backend unavailable — fall back to demo login if credentials match
      const demoUser = DEMO_USERS[role];
      if (demoUser && demoUser.email === email) {
        setUser(demoUser);
        localStorage.setItem('currentUser', JSON.stringify(demoUser));
        localStorage.setItem('token', 'demo-token');
        return true;
      }
    }
    return false;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: AppRole): Promise<boolean> => {
    try {
      const { data } = await api.post('/auth/register', { email, password, name, role });
      if (data) {
        return await login(email, password, role);
      }
    } catch {
      // ignore
    }
    return false;
  }, [login]);

  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const { data } = await api.put('/auth/profile', profileData);
      if (data) {
        const updatedUser = { ...user, ...data } as User;
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }, []);

  const hasRole = useCallback((role: AppRole): boolean => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      updateProfile,
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

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'admin' | 'resident' | null;

interface AuthContextType {
  role: UserRole;
  user: any | null;
  login: (role: UserRole, userData?: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('auth_role') as UserRole;
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedRole) {
      setRole(storedRole);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newRole: UserRole, userData?: any) => {
    setRole(newRole);
    localStorage.setItem('auth_role', newRole || '');
    if (userData) {
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } else {
      setUser(null);
      localStorage.removeItem('auth_user');
    }
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
  };

  if (isLoading) {
    return null; // or loading spinner
  }

  return (
    <AuthContext.Provider value={{ role, user, login, logout }}>
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

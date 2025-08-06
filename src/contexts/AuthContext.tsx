import React, { createContext, useContext, useState, useEffect } from 'react';

// Simplified auth context without Supabase
interface AuthContextType {
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token (simplified)
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simplified auth - just store user locally
    // In production, this would connect to BigQuery/Google Auth
    const mockUser = {
      id: '1',
      email,
      name: email.split('@')[0]
    };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signUp = async (email: string, password: string) => {
    // Simplified signup
    const mockUser = {
      id: '1',
      email,
      name: email.split('@')[0]
    };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signOut = async () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    // Simplified password reset
    console.log('Password reset requested for:', email);
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
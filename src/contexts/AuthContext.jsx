import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, auth } from '../lib/firebase';

const AuthContext = createContext({});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener...');
    
    const unsubscribe = onAuthChange((user) => {
      console.log('AuthProvider: Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setUser(user);
      setLoading(false);
      
      if (!initialized) {
        setInitialized(true);
        console.log('AuthProvider: Authentication initialized');
      }
    });

    // Also check current user immediately
    if (auth.currentUser) {
      console.log('AuthProvider: Found existing user:', auth.currentUser.uid);
      setUser(auth.currentUser);
      setLoading(false);
      setInitialized(true);
    }

    return unsubscribe;
  }, [initialized]);

  const value = {
    user,
    loading,
    initialized,
    isAuthenticated: !!user
  };

  console.log('AuthProvider render:', { user: !!user, loading, initialized });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
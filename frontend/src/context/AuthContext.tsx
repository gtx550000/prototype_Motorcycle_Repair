'use client';

import React, { createContext, useState, useEffect } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import { authAPI } from '@/lib/api';
import { setToken, removeToken, getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (error) {
          removeToken();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const res = await authAPI.login(credentials);
    setToken(res.data.access_token);
    const userRes = await authAPI.getMe();
    setUser(userRes.data);
    router.push('/dashboard/categories');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  const isOwner = user?.role === 'owner';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

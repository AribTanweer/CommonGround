import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginResponse } from '../api/types';
import { apiClient, setAccessToken } from '../api/axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    password2?: string;
    bio?: string;
    location?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get<User>('/users/me/');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [logout]);

  // Initial silent auth on startup
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.post<{ access: string }>('/auth/refresh/', {
          refresh: refreshToken,
        });
        setAccessToken(data.access);
        await fetchProfile();
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('refresh_token');
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const login = async (username: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', {
      username,
      password,
    });
    setAccessToken(data.access);
    localStorage.setItem('refresh_token', data.refresh);

    if (data.user) {
      setUser(data.user);
    } else {
      await fetchProfile();
    }
  };

  const register = async (payload: {
    username: string;
    email: string;
    password: string;
    password2?: string;
    bio?: string;
    location?: string;
  }) => {
    await apiClient.post('/auth/register/', {
      ...payload,
      password2: payload.password2 ?? payload.password,
    });
    // Automatically log in after registration
    await login(payload.username, payload.password);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

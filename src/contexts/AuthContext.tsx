import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { apiClient } from '../lib/apiClient';
import { useError } from './ErrorContext';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileAuthOpen, setIsMobileAuthOpen] = useState(false);
  const [mobileAuthMode, setMobileAuthMode] = useState<'login' | 'signup' | 'profile'>('login');
  const { setError } = useError();

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure token is properly restored
        const token = localStorage.getItem('auth_token');
        if (token) {
          apiClient.setToken(token);
          const response = await apiClient.getCurrentUser();
          if (response.user) {
            setUser(response.user);
            setError(null);
          } else {
            // If user fetch fails, clear the token
            localStorage.removeItem('auth_token');
            apiClient.setToken(null);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        // User not authenticated or token invalid, clear token
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Standard Authentication Methods
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);

      if (response.token && response.user) {
        // Ensure token is set in apiClient
        apiClient.setToken(response.token);
        setUser(response.user);
        setError(null);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      // Clear any invalid token
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> => {
    try {
      setLoading(true);
      // Extract fullName from additionalData, or combine firstName and lastName
      let fullName = additionalData?.fullName as string;
      if (!fullName) {
        const firstName = (additionalData?.firstName as string) || '';
        const lastName = (additionalData?.lastName as string) || '';
        fullName = `${firstName} ${lastName}`.trim() || 'User';
      }
      const role = (additionalData?.role as string) || 'customer';
      const response = await apiClient.register(email, password, fullName, role);

      if (response.token && response.user) {
        // Ensure token is set in apiClient
        apiClient.setToken(response.token);
        setUser(response.user);
        setError(null);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      // Clear any invalid token
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.logout();
      setUser(null);
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('cart_items');
      setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signIn(email, password);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Login failed';
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      await signUp(
        userData.email!,
        userData.password!,
        { fullName: userData.name || 'User' }
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!user) {
        throw new Error('No user is currently authenticated');
      }

      const response = await apiClient.updateProfile(updates);
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      setError(message);
      throw error;
    }
  };

  // Refresh user data from server
  const refreshUser = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await apiClient.getCurrentUser();
        if (response.user) {
          setUser(response.user);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Mobile Authentication Methods
  const openMobileAuth = (mode: 'login' | 'signup' | 'profile' = 'login') => {
    setMobileAuthMode(mode);
    setIsMobileAuthOpen(true);
  };

  const closeMobileAuth = () => {
    setIsMobileAuthOpen(false);
  };

  // Placeholder methods for required interface methods
  const resetPassword = async (email: string): Promise<void> => {
    throw new Error('Password reset not yet implemented');
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    throw new Error('Password update not yet implemented');
  };

  const resendVerification = async (): Promise<void> => {
    throw new Error('Email verification not yet implemented');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    updateProfile,
    refreshUser,

    openMobileAuth,
    closeMobileAuth,
    isMobileAuthOpen,
    mobileAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import authService from '../services/auth';
import { 
  generateDeviceFingerprint, 
  getDeviceName, 
  isDeviceTrusted as checkDeviceTrusted, 
  setDeviceTrusted, 
  getStoredDeviceFingerprint 
} from '../utils/deviceFingerprint';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  signup: (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  trustDevice: () => Promise<void>;
  isDeviceTrusted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceTrusted, setIsDeviceTrustedState] = useState(checkDeviceTrusted());

  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.me();
      setUser(response.user);
    } catch (error) {
      setUser(null);
      console.log('User not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<void> => {
    try {
      const response = await authService.login({ email, password, rememberMe });
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithPin = async (pin: string): Promise<void> => {
    try {
      const deviceFingerprint = getStoredDeviceFingerprint() || generateDeviceFingerprint();
      const response = await authService.loginWithPin(pin, deviceFingerprint);
      setUser(response.user);
    } catch (error) {
      console.error('PIN login failed:', error);
      throw error;
    }
  };

  const setupPin = async (pin: string): Promise<void> => {
    try {
      await authService.setupPin(pin);
      // Update user to reflect PIN is now enabled
      if (user) {
        setUser({ ...user, pinEnabled: true });
      }
    } catch (error) {
      console.error('Setup PIN failed:', error);
      throw error;
    }
  };

  const trustDevice = async (): Promise<void> => {
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const deviceName = getDeviceName();
      await authService.trustDevice(deviceFingerprint, deviceName);
      setDeviceTrusted(true);
      setIsDeviceTrustedState(true);
    } catch (error) {
      console.error('Trust device failed:', error);
      throw error;
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> => {
    try {
      const response = await authService.signup(userData);
      setUser(response.user);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on backend, clear user locally
      setUser(null);
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithPin,
    signup,
    logout,
    checkAuth,
    setupPin,
    trustDevice,
    isDeviceTrusted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

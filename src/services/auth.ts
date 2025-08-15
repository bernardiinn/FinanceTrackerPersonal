import type { User, AuthResponse } from '../types';
import { withCsrf } from './csrf.ts';

const API_BASE_URL = '/api/auth';

// API configuration for authenticated requests
const apiConfig = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const authService = {
  // Sign up a new user
  async signup(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  },

  // Log in user
  async login(credentials: { 
    email: string; 
    password: string; 
    rememberMe?: boolean; 
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  // Log out user
  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Logout failed');
    }

    return response.json();
  },

  // Get current user info
  async me(): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      ...apiConfig,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user info');
    }

    return response.json();
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },

  // Set up PIN for quick access
  async setupPin(pin: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/setup-pin`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
      body: JSON.stringify({ pin }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set up PIN');
    }

    return response.json();
  },

  // Login with PIN
  async loginWithPin(pin: string, deviceFingerprint: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login-pin`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
      body: JSON.stringify({ pin, deviceFingerprint }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'PIN login failed');
    }

    return response.json();
  },

  // Trust current device
  async trustDevice(deviceFingerprint: string, deviceName?: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/trust-device`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
      body: JSON.stringify({ deviceFingerprint, deviceName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trust device');
    }

    return response.json();
  },

  // Get trusted devices
  async getTrustedDevices(): Promise<{ devices: any[] }> {
    const response = await fetch(`${API_BASE_URL}/trusted-devices`, {
      method: 'GET',
      ...apiConfig,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get trusted devices');
    }

    return response.json();
  },

  // Remove trusted device
  async removeTrustedDevice(deviceId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/remove-device`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
      body: JSON.stringify({ deviceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove device');
    }

    return response.json();
  },

  // Disable PIN
  async disablePin(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/disable-pin`, {
      method: 'POST',
  ...apiConfig,
  headers: await withCsrf(apiConfig.headers),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disable PIN');
    }

    return response.json();
  },
};

export default authService;

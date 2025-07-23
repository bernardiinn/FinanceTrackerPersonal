import type { User, AuthResponse } from '../types';

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
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  },

  // Log in user
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      ...apiConfig,
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
};

export default authService;

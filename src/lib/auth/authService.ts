import { ApiConfig } from '@/types/types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'meshflow_access_token';
const REFRESH_TOKEN_KEY = 'meshflow_refresh_token';
const AUTH_PROVIDER_KEY = 'meshflow_auth_provider';

// Token interface
export interface AuthTokens {
  access: string;
  refresh: string;
}

// Auth provider type
export type AuthProvider = 'password' | 'google' | null;

// Authentication service
export const authService = {
  // Store tokens in local storage
  setTokens(tokens: AuthTokens, provider: AuthProvider = 'password'): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    localStorage.setItem(AUTH_PROVIDER_KEY, provider || '');
  },

  // Get access token from local storage
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Get refresh token from local storage
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Get auth provider from local storage
  getAuthProvider(): AuthProvider {
    const provider = localStorage.getItem(AUTH_PROVIDER_KEY);
    return (provider as AuthProvider) || null;
  },

  // Clear tokens from local storage
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_PROVIDER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // Login with username and password
  async login(baseUrl: string, username: string, password: string): Promise<AuthTokens> {
    const response = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  },

  // Refresh access token using refresh token
  async refreshToken(baseUrl: string): Promise<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${baseUrl}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens(); // Clear tokens if refresh fails
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update only the access token
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);

    return data.access;
  },

  // Logout user
  logout(): void {
    this.clearTokens();
  },

  // Login with Google
  async loginWithGoogle(baseUrl: string, googleToken: string): Promise<AuthTokens> {
    const response = await fetch(`${baseUrl}/api/auth/social/google/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: googleToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Google login failed');
    }

    const tokens = await response.json();
    this.setTokens(tokens, 'google');
    return tokens;
  },

  // Get Google auth URL and redirect
  async getGoogleAuthUrl(baseUrl: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/auth/social/google/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Google authorization URL');
    }

    const data = await response.json();
    return data.authorization_url;
  },

  // Update API config with current token
  updateApiConfig(config: ApiConfig): ApiConfig {
    const accessToken = this.getAccessToken();

    if (accessToken) {
      return {
        ...config,
        auth: {
          ...config.auth,
          type: 'token',
          token: accessToken,
        },
      };
    }

    return config;
  },

  // Decode JWT access token and extract user info
  getCurrentUser(): { id: number; username: string } | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      // JWT format: header.payload.signature
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      // Typical JWT user fields: user_id or id, and username
      const id = decoded.user_id || decoded.id;
      const username = decoded.username;
      if (typeof id === 'number' && typeof username === 'string') {
        return { id, username };
      }
      return null;
    } catch {
      return null;
    }
  },
};

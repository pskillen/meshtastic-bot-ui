import { ApiConfig } from '@/types/types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'meshflow_access_token';
const REFRESH_TOKEN_KEY = 'meshflow_refresh_token';

// Token interface
export interface AuthTokens {
  access: string;
  refresh: string;
}

// Authentication service
export const authService = {
  // Store tokens in local storage
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },

  // Get access token from local storage
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Get refresh token from local storage
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Clear tokens from local storage
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
};

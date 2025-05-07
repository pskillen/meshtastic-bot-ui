import { ApiConfig } from '@/types/types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'meshflow_access_token';
const REFRESH_TOKEN_KEY = 'meshflow_refresh_token';
const AUTH_PROVIDER_KEY = 'meshflow_auth_provider';
const USER_DETAILS_KEY = 'meshflow_user_details';

// Token interface
export interface AuthTokens {
  access: string;
  refresh: string;
}

// User interface
export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // For any additional fields
}

// Auth provider type
export type AuthProvider = 'password' | 'google' | 'github' | null;

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
    localStorage.removeItem(USER_DETAILS_KEY);
  },

  // Store user details in local storage
  setUserDetails(user: User): void {
    localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(user));
  },

  // Get user details from local storage
  getUserDetails(): User | null {
    const userJson = localStorage.getItem(USER_DETAILS_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },

  // Update user details
  async updateUserDetails(baseUrl: string, userData: { email?: string; display_name?: string }): Promise<User> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${baseUrl}/api/auth/user/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user details');
    }

    const user = await response.json();
    this.setUserDetails(user);
    return user;
  },

  // Change password
  async changePassword(baseUrl: string, passwords: { new_password1: string; new_password2: string }): Promise<void> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${baseUrl}/api/auth/password/change/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwords),
    });

    if (!response.ok) {
      throw new Error('Failed to change password');
    }
  },

  // Fetch user details from the server
  async fetchUserDetails(baseUrl: string): Promise<User> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${baseUrl}/api/auth/user/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    const user = await response.json();
    this.setUserDetails(user);
    return user;
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

    // Fetch user details after successful login
    try {
      await this.fetchUserDetails(baseUrl);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }

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

  // Initialize user details if authenticated
  async initializeUser(baseUrl: string): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    // If we already have user details, return them
    const storedUser = this.getUserDetails();
    if (storedUser) {
      return storedUser;
    }

    // Otherwise fetch user details from the server
    try {
      return await this.fetchUserDetails(baseUrl);
    } catch (error) {
      console.error('Failed to initialize user details:', error);
      return null;
    }
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

    // Fetch user details after successful login
    try {
      await this.fetchUserDetails(baseUrl);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }

    return tokens;
  },

  // Login with GitHub
  async loginWithGitHub(baseUrl: string, githubToken: string): Promise<AuthTokens> {
    const response = await fetch(`${baseUrl}/api/auth/social/github/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: githubToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'GitHub login failed');
    }

    const tokens = await response.json();
    this.setTokens(tokens, 'github');

    // Fetch user details after successful login
    try {
      await this.fetchUserDetails(baseUrl);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }

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

  // Get GitHub auth URL and redirect
  async getGitHubAuthUrl(baseUrl: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/auth/social/github/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get GitHub authorization URL');
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

  // Get current user from stored user details or decode JWT as fallback
  getCurrentUser(): User | null {
    // First try to get user from stored details
    const storedUser = this.getUserDetails();
    if (storedUser) {
      return storedUser;
    }

    // Fallback to decoding JWT if no stored user details
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

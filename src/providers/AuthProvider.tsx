import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService, AuthProvider as AuthProviderType } from '@/lib/auth/authService';
import { useConfig } from './ConfigProvider';

// Auth context interface
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  handleGoogleCallback: (code: string) => Promise<void>;
  handleGitHubCallback: (code: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  authProvider: AuthProviderType;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<AuthProviderType>(null);
  const config = useConfig();
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const provider = authService.getAuthProvider();
        setAuthProvider(provider);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      // Check if this is a callback from OAuth
      if (location.pathname === '/auth/callback' && location.search) {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const provider = state ? state.split(':')[0] : 'google'; // Default to google if no state

        if (code) {
          try {
            setIsLoading(true);
            if (provider === 'github') {
              await handleGitHubCallback(code);
            } else {
              await handleGoogleCallback(code);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : `${provider} authentication failed`);
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    handleCallback();
  }, [location]);

  // Login function
  const login = async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.login(config.apis.meshBot.baseUrl, username, password);
      setIsAuthenticated(true);
      setAuthProvider('password');
      navigate('/'); // Redirect to home page after login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Get the Google auth URL and redirect to it
      const googleAuthUrl = await authService.getGoogleAuthUrl(config.apis.meshBot.baseUrl);
      window.location.href = googleAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Google authorization URL');
      setIsLoading(false);
    }
  };

  // Login with GitHub
  const loginWithGitHub = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Get the GitHub auth URL and redirect to it
      const githubAuthUrl = await authService.getGitHubAuthUrl(config.apis.meshBot.baseUrl);
      window.location.href = githubAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get GitHub authorization URL');
      setIsLoading(false);
    }
  };

  // Handle Google callback
  const handleGoogleCallback = async (code: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Exchange the code for tokens
      await authService.loginWithGoogle(config.apis.meshBot.baseUrl, code);
      setIsAuthenticated(true);
      setAuthProvider('google');
      navigate('/'); // Redirect to home page after login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle GitHub callback
  const handleGitHubCallback = async (code: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Exchange the code for tokens
      await authService.loginWithGitHub(config.apis.meshBot.baseUrl, code);
      setIsAuthenticated(true);
      setAuthProvider('github');
      navigate('/'); // Redirect to home page after login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login page after logout
  };

  // Context value
  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    loginWithGoogle,
    loginWithGitHub,
    handleGoogleCallback,
    handleGitHubCallback,
    logout,
    error,
    authProvider,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

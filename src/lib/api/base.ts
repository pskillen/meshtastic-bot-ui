import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
}

export interface AuthConfig {
  type: 'token' | 'basic';
  credentials: {
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

export abstract class BaseApi {
  protected axios: AxiosInstance;
  private authConfig?: AuthConfig;

  constructor(config: ApiConfig) {
    this.axios = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash if present
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Store auth config if provided
    if (config.auth) {
      this.setAuth(config.auth);
    }

    // Add request interceptor for auth
    this.axios.interceptors.request.use(
      (config) => {
        if (this.authConfig) {
          switch (this.authConfig.type) {
            case 'token':
              if (this.authConfig.credentials.token) {
                config.headers.Authorization = `Token ${this.authConfig.credentials.token}`;
              }
              break;
            case 'basic':
              if (this.authConfig.credentials.username && this.authConfig.credentials.password) {
                const credentials = btoa(
                  `${this.authConfig.credentials.username}:${this.authConfig.credentials.password}`
                );
                config.headers.Authorization = `Basic ${credentials}`;
              }
              break;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError: ApiError = {
          message: error.message || 'An error occurred',
          status: error.response?.status,
          data: error.response?.data,
        };

        // Handle authentication errors
        if (error.response?.status === 401) {
          apiError.message = 'Authentication failed. Please check your credentials.';
        }

        throw apiError;
      }
    );
  }

  /**
   * Set or update authentication configuration
   */
  public setAuth(auth: AuthConfig): void {
    this.authConfig = auth;
  }

  /**
   * Clear authentication configuration
   */
  public clearAuth(): void {
    this.authConfig = undefined;
  }

  protected async request<T>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axios({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          data: error,
        } as ApiError;
      }
      throw error;
    }
  }

  protected async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  protected async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data });
  }

  protected async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data });
  }

  protected async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  protected async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', data });
  }
} 
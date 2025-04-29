import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiAuthConfig, ApiConfig, ApiError } from '@/types/types';

export abstract class BaseApi {
  protected readonly axios: AxiosInstance;
  private readonly authConfig?: ApiAuthConfig;

  constructor(config: ApiConfig) {
    // Remove trailing slash from baseUrl and leading slash from basePath if present
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const basePath = (config.basePath || '').replace(/^\//, '');

    // Combine baseUrl and basePath
    const fullBaseUrl = basePath ? `${baseUrl}/${basePath}` : baseUrl;

    this.axios = axios.create({
      baseURL: fullBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Store auth config if provided
    if (config.auth) {
      this.authConfig = config.auth;
    }

    // Add request interceptor for auth
    this.axios.interceptors.request.use(
      (config) => {
        if (this.authConfig) {
          switch (this.authConfig.type) {
            case 'token':
              if (this.authConfig.token) {
                // Updated to use Bearer token for JWT authentication
                config.headers.Authorization = `Bearer ${this.authConfig.token}`;
              }
              break;
            case 'basic':
              if (this.authConfig.username && this.authConfig.password) {
                const credentials = btoa(`${this.authConfig.username}:${this.authConfig.password}`);
                config.headers.Authorization = `Basic ${credentials}`;
              }
              break;
            case 'apiKey':
              if (this.authConfig.apiKey && this.authConfig.apiKeyHeader) {
                config.headers[this.authConfig.apiKeyHeader] = this.authConfig.apiKey;
              }
              break;
            case 'oauth':
              // OAuth implementation would go here
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

  protected async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
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

  protected async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data });
  }

  protected async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data });
  }

  protected async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  protected async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', data });
  }
}

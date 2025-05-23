import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiAuthConfig, ApiConfig, ApiError, NotFoundError, ServerError } from '@/lib/types';
import { authService } from '@/lib/auth/authService';
import { eventService } from '@/lib/events/eventService';
import { AuthEventType } from '@/lib/auth/authService';

export abstract class BaseApi {
  protected readonly axios: AxiosInstance;
  private readonly authConfig?: ApiAuthConfig;
  private readonly baseUrl: string;

  constructor(config: ApiConfig) {
    // Remove trailing slash from baseUrl and leading slash from basePath if present
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const basePath = (config.basePath || '').replace(/^\//, '');

    // Combine baseUrl and basePath
    const fullBaseUrl = basePath ? `${baseUrl}/${basePath}` : baseUrl;
    this.baseUrl = baseUrl;

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
        // Always check for JWT token first
        const accessToken = authService.getAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          return config;
        }

        // Fall back to other auth methods if no JWT token
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

    // Add response interceptor for error handling and token refresh
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Try to refresh token if we get a 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry && authService.getRefreshToken()) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh the token
            const newToken = await authService.refreshToken(this.baseUrl);

            // Emit token refreshed event
            eventService.emit(AuthEventType.AUTH_TOKEN_REFRESHED);

            // Update the request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry the request
            return this.axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, emit auth error event instead of directly redirecting
            eventService.emit(AuthEventType.AUTH_ERROR, {
              message: 'Session expired. Please log in again.',
              status: 401,
              data: refreshError,
            });

            // Create and throw an API error
            const apiError: ApiError = {
              message: 'Session expired. Please log in again.',
              status: 401,
              data: refreshError,
            };
            throw apiError;
          }
        } else if (error.response?.status === 401 && !authService.getRefreshToken()) {
          // If we get a 401 and there's no refresh token, emit auth error event
          eventService.emit(AuthEventType.AUTH_ERROR, {
            message: 'Authentication failed. Please log in again.',
            status: 401,
            data: error.response?.data,
          });
        }

        // Handle 404 errors with NotFoundError
        if (error.response?.status === 404) {
          throw new NotFoundError(error.message || 'Not Found', error.response?.data);
        }

        // Handle 5xx errors with ServerError
        if (error.response?.status >= 500 && error.response?.status < 600) {
          throw new ServerError(error.message || 'Server Error', error.response?.status, error.response?.data);
        }

        // Handle other errors
        const apiError: ApiError = {
          message: error.message || 'An error occurred',
          status: error.response?.status,
          data: error.response?.data,
        };

        // Handle authentication errors
        if (error.response?.status === 401) {
          apiError.message = 'Authentication failed. Please check your credentials.';

          // Emit auth error event for any 401 that wasn't handled by the refresh token logic
          if (!originalRequest._retry) {
            eventService.emit(AuthEventType.AUTH_ERROR, apiError);
          }
        }

        throw apiError;
      }
    );
  }

  protected async request<T>(
    endpoint: string,
    options: AxiosRequestConfig = {},
    searchParams?: URLSearchParams
  ): Promise<T> {
    const queryString = searchParams?.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const response: AxiosResponse<T> = await this.axios({
      url,
      ...options,
    });
    return response.data;
  }

  protected async get<T>(endpoint: string, searchParams?: URLSearchParams, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' }, searchParams);
  }

  protected async post<T>(
    endpoint: string,
    data?: unknown,
    searchParams?: URLSearchParams,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data }, searchParams);
  }

  protected async put<T>(
    endpoint: string,
    data?: unknown,
    searchParams?: URLSearchParams,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data }, searchParams);
  }

  protected async delete<T>(endpoint: string, searchParams?: URLSearchParams, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' }, searchParams);
  }

  protected async patch<T>(
    endpoint: string,
    data?: unknown,
    searchParams?: URLSearchParams,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', data }, searchParams);
  }
}

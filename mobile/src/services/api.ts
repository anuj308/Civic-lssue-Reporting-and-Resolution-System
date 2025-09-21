import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - Update this to match your backend URL
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ 
  ? 'http://192.168.18.101:5000/api' // Your computer's WiFi IP for Expo Go
  : 'https://your-production-api.com/api');

console.log('🌐 API Service initialized with BASE_URL:', BASE_URL);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔧 Axios instance created with config:', {
      baseURL: BASE_URL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log outgoing requests
        console.log('📤 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          data: config.data,
          headers: config.headers,
        });
        
        return config;
      },
      (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Log successful responses
        console.log('📥 API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      async (error) => {
        // Log error responses
        console.error('📥 API Error Response:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
          message: error.message,
        });

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('🔄 Access token expired, attempting refresh...');
          
          try {
            // Get stored refresh token
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            
            if (!refreshToken) {
              console.log('❌ No refresh token available, redirecting to login');
              await AsyncStorage.multiRemove(['token', 'refreshToken']);
              return Promise.reject(error);
            }
            
            console.log('🔄 Using refresh token to get new access token');
            
            // Create a separate axios instance for refresh to avoid recursion
            const refreshAxios = axios.create({
              baseURL: BASE_URL,
              timeout: 10000,
            });
            
            // Call refresh token API
            const refreshResponse = await refreshAxios.post('/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
            
            console.log('✅ Token refresh successful');
            
            // Store new tokens
            await AsyncStorage.setItem('token', accessToken);
            if (newRefreshToken) {
              await AsyncStorage.setItem('refreshToken', newRefreshToken);
            }
            
            // Update original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            console.log('🔄 Retrying original request with new token');
            
            // Retry original request
            return this.api(originalRequest);
            
          } catch (refreshError: any) {
            console.error('❌ Token refresh failed:', refreshError);
            
            // Refresh failed, clear tokens and redirect to login
            await AsyncStorage.multiRemove(['token', 'refreshToken']);
            
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Helper method for file uploads
  private createFormData(data: any): FormData {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          data[key].forEach((item: any, index: number) => {
            if (typeof item === 'object' && item.uri) {
              // File object
              formData.append(`${key}[${index}]`, {
                uri: item.uri,
                type: item.type || 'image/jpeg',
                name: item.name || `file_${index}.jpg`,
              } as any);
            } else {
              formData.append(`${key}[${index}]`, item);
            }
          });
        } else if (typeof data[key] === 'object' && data[key].uri) {
          // Single file object
          formData.append(key, {
            uri: data[key].uri,
            type: data[key].type || 'image/jpeg',
            name: data[key].name || 'file.jpg',
          } as any);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    return formData;
  }

  // Network test method
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to:', BASE_URL);
      const response = await this.api.get('/test', { timeout: 5000 });
      console.log('✅ Connection test successful:', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ Connection test failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        baseURL: BASE_URL,
      });
      return false;
    }
  }

  // Generic API methods
  get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  // File upload method
  upload<T = any>(url: string, data: any, config?: any): Promise<AxiosResponse<T>> {
    const formData = this.createFormData(data);
    return this.api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }
}

const apiService = new ApiService();

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiService.post('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; phone: string; password: string }) =>
    apiService.post('/auth/register', userData),
  
  verifyOTP: (data: { email: string; otpCode: string }) =>
    apiService.post('/auth/verify-otp', data),

  verifyAndLogin: (data: { email: string; otpCode: string; password?: string }) =>
    apiService.post('/auth/verify-and-login', data),
  
  resendOTP: (data: { email: string }) =>
    apiService.post('/auth/resend-otp', data),

  resendLoginOTP: (data: { email: string }) =>
    apiService.post('/auth/resend-login-otp', data),
  
  refreshToken: (refreshToken: string) =>
    apiService.post('/auth/refresh', { refreshToken }),
  
  logout: () =>
    apiService.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    apiService.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; password: string }) =>
    apiService.post('/auth/reset-password', data),
  
  deleteAccount: () =>
    apiService.delete('/auth/account'),
};

// Issue API
export const issueApi = {
  create: (issueData: any) => {
    console.log('🚀 IssueAPI.create called with:', typeof issueData, issueData);
    console.log('🔍 Media data detailed inspection:');
    console.log('  - media object:', issueData.media);
    console.log('  - images array:', issueData.media?.images);
    console.log('  - images type check:', issueData.media?.images?.map((img: any, i: number) => 
      ({ index: i, value: img, type: typeof img, isString: typeof img === 'string' })));
    return apiService.post('/issues', issueData);
  },
  
  getMyIssues: (params: { page?: number; limit?: number } = {}) =>
    apiService.get('/issues/my', { params }),
  
  getNearbyIssues: (params: { latitude: number; longitude: number; radius?: number }) =>
    apiService.get('/issues/nearby', { params }),
  
  getById: (issueId: string) =>
    apiService.get(`/issues/${issueId}`),
  
  update: (issueId: string, data: any) =>
    apiService.patch(`/issues/${issueId}`, data),
  
  delete: (issueId: string) =>
    apiService.delete(`/issues/${issueId}`),
  
  submitFeedback: (issueId: string, feedback: { rating: number; comment: string }) =>
    apiService.post(`/issues/${issueId}/feedback`, feedback),
  
  getCategories: () =>
    apiService.get('/issues/categories'),
};

// User API
export const userApi = {
  getProfile: () =>
    apiService.get('/users/profile'),
  
  updateProfile: (data: any) =>
    apiService.patch('/users/profile', data),
  
  uploadAvatar: (imageData: any) =>
    apiService.upload('/users/avatar', { avatar: imageData }),
};

// Notification API
export const notificationApi = {
  getNotifications: (params: { page?: number; limit?: number } = {}) =>
    apiService.get('/notifications', { params }),
  
  markAsRead: (notificationId: string) =>
    apiService.patch(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    apiService.patch('/notifications/read-all'),
  
  updatePushToken: (token: string) =>
    apiService.post('/notifications/push-token', { token }),
};

// Session Management API
export const sessionApi = {
  // Session Management
  getMySessions: () =>
    apiService.get('/sessions/my-sessions'),
  
  getSecurityOverview: () =>
    apiService.get('/sessions/security-overview'),
  
  getSessionDetails: (sessionId: string) =>
    apiService.get(`/sessions/${sessionId}/details`),
  
  revokeSession: (sessionId: string) =>
    apiService.delete(`/sessions/${sessionId}`),
  
  revokeAllSessions: () =>
    apiService.post('/sessions/revoke-all'),
  
  updateSecuritySettings: (settings: {
    enableLocationAlerts?: boolean;
    enableNewDeviceAlerts?: boolean;
    sessionTimeout?: number;
    requireStrongAuth?: boolean;
  }) =>
    apiService.patch('/sessions/security-settings', settings),
  
  reportSuspiciousActivity: (data: {
    sessionId: string;
    reason: string;
    description?: string;
  }) =>
    apiService.post('/sessions/report-suspicious', data),

  // Security Alerts
  getSecurityAlerts: (params: {
    page?: number;
    limit?: number;
    severity?: 'low' | 'medium' | 'high';
    status?: 'active' | 'resolved';
    type?: string;
    unreadOnly?: boolean;
  } = {}) =>
    apiService.get('/sessions/security/alerts', { params }),
  
  getSecurityAlertStats: (params: { days?: number } = {}) =>
    apiService.get('/sessions/security/alerts/stats', { params }),
  
  getSecurityAlertDetails: (alertId: string) =>
    apiService.get(`/sessions/security/alerts/${alertId}`),
  
  acknowledgeSecurityAlert: (alertId: string) =>
    apiService.patch(`/sessions/security/alerts/${alertId}/acknowledge`),
  
  dismissSecurityAlert: (alertId: string) =>
    apiService.patch(`/sessions/security/alerts/${alertId}/dismiss`),
  
  markAllAlertsRead: (alertIds?: string[]) =>
    apiService.patch('/sessions/security/alerts/mark-all-read', { alertIds }),
  
  getAlertPreferences: () =>
    apiService.get('/sessions/security/alert-preferences'),
  
  updateAlertPreferences: (preferences: {
    enableEmailNotifications?: boolean;
    enablePushNotifications?: boolean;
    alertTypes?: string[];
    severityThreshold?: 'low' | 'medium' | 'high';
  }) =>
    apiService.patch('/sessions/security/alert-preferences', preferences),

  // Development/Testing
  createTestAlert: (data: {
    type?: string;
    severity?: 'info' | 'low' | 'medium' | 'high';
  } = {}) =>
    apiService.post('/sessions/security/alerts/test', data),
};

export default apiService;

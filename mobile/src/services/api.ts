import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - Update this to match your backend URL
const BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api' // Android emulator
  : 'https://your-production-api.com/api';

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
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await store.dispatch(refreshToken()).unwrap();
            const newToken = await AsyncStorage.getItem('token');
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            store.dispatch(logout());
            return Promise.reject(refreshError);
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
  
  verifyOTP: (data: { userId: string; otp: string }) =>
    apiService.post('/auth/verify-otp', data),
  
  resendOTP: (data: { email: string; phone: string }) =>
    apiService.post('/auth/resend-otp', data),
  
  refreshToken: (refreshToken: string) =>
    apiService.post('/auth/refresh', { refreshToken }),
  
  logout: () =>
    apiService.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    apiService.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; password: string }) =>
    apiService.post('/auth/reset-password', data),
};

// Issue API
export const issueApi = {
  create: (issueData: FormData) =>
    apiService.upload('/issues', issueData),
  
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
  
  deleteAccount: () =>
    apiService.delete('/users/profile'),
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

export default apiService;

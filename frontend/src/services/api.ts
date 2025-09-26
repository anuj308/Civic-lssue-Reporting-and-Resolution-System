import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Extend window interface for toast notifications
declare global {
  interface Window {
    toast?: {
      error: (message: string) => void;
      success: (message: string) => void;
      info: (message: string) => void;
      warning: (message: string) => void;
    };
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory token storage (more secure than Redux)
let accessToken: string | null = null;
let isRefreshing = false; // Prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<any> | null = null;
let isRedirecting = false; // Prevent multiple redirects // Store the refresh promise

// Load access token from sessionStorage on startup
const loadAccessToken = () => {
  try {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      accessToken = token;
      console.log('🔑 API: Loaded access token from sessionStorage');
    }
  } catch (error) {
    console.warn('⚠️ API: Failed to load access token from sessionStorage:', error);
  }
};

// Save access token to sessionStorage
const saveAccessToken = (token: string | null) => {
  try {
    if (token) {
      sessionStorage.setItem('accessToken', token);
      console.log('💾 API: Saved access token to sessionStorage');
    } else {
      sessionStorage.removeItem('accessToken');
      console.log('🗑️ API: Cleared access token from sessionStorage');
    }
  } catch (error) {
    console.warn('⚠️ API: Failed to save access token to sessionStorage:', error);
  }
};

// Initialize token on module load
loadAccessToken();

// Token management functions
export const setAccessToken = (token: string) => {
  accessToken = token;
  saveAccessToken(token);
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  saveAccessToken(null);
};

// Clear all authentication data
export const clearAllAuthData = () => {
  clearAccessToken();
  // Clear refresh token cookie
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  // Clear any other auth-related localStorage items
  localStorage.removeItem('user');
  localStorage.removeItem('authState');
};

// Reset redirecting flag (call this after successful login)
export const resetRedirectingFlag = () => {
  isRedirecting = false;
};

// Handle authentication errors
export const handleAuthError = (error: any) => {
  if (error.code === 'SESSION_EXPIRED' || error.code === 'SESSION_REVOKED' || error.type === 'auth') {
    clearAllAuthData();
    const errorMessage = error.message || 'Your session has expired. Please log in again.';
    
    // Show toast notification if available
    if (window.toast) {
      window.toast.error(errorMessage);
    }
    
    // Redirect to login
    if (window.location.pathname !== '/login') {
      window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
    }
    return true; // Handled
  }
  return false; // Not handled
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists in memory
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already redirecting, don't try to refresh
      if (isRedirecting) {
        console.log('🔄 API: Already redirecting, rejecting request');
        return Promise.reject(error);
      }

      // If already refreshing, wait for the existing refresh to complete
      if (isRefreshing) {
        console.log('🔄 API: Refresh already in progress, waiting...');
        return refreshPromise?.then(() => api(originalRequest)).catch(() => Promise.reject(error));
      }

      console.log('🔄 API: Starting token refresh...');
      isRefreshing = true;

      // Create a single refresh promise
      refreshPromise = api.post('/auth/refresh-token')
        .then((refreshResponse) => {
          const newToken = refreshResponse.data.data.accessToken;

          if (newToken) {
            console.log('✅ API: Token refreshed successfully');
            // Update token in memory
            setAccessToken(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            throw new Error('No token received');
          }
        })
        .catch((refreshError) => {
          console.log('❌ API: Token refresh failed:', refreshError.message);
          
          // Set redirecting flag to prevent further refreshes
          isRedirecting = true;
          
          // Clear all auth data immediately
          clearAllAuthData();
          
          // Force redirect to login - use setTimeout to ensure cleanup happens first
          const errorMessage = 'Your session has expired. Please log in again.';
          console.log('🔄 API: Redirecting to login due to session expiry');
          
          setTimeout(() => {
            window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
          }, 100);
          
          return Promise.reject({
            message: errorMessage,
            type: 'auth',
            code: 'SESSION_EXPIRED'
          });
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

      return refreshPromise;
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        type: 'network',
      });
    }

    // Handle other errors
    const errorMessage = (error.response?.data as any)?.message || error.message || 'An error occurred';

    // Return detailed error information for validation errors
    return Promise.reject({
      message: errorMessage,
      status: error.response.status,
      data: error.response.data,
      validationErrors: (error.response?.data as any)?.errors || null,
    });
  }
);

// API response wrapper
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Generic API methods
export const apiService = {
  // Handle API errors globally
  handleError: (error: any) => {
    // Check if it's an auth error
    if (handleAuthError(error)) {
      return; // Auth error handled
    }
    
    // Handle other error types
    if (error.type === 'network') {
      console.error('Network error:', error.message);
      // Show network error message
      if (window.toast) {
        window.toast.error('Network error. Please check your connection.');
      }
    } else if (error.status === 403) {
      console.error('Permission denied:', error.message);
      if (window.toast) {
        window.toast.error('You do not have permission to perform this action.');
      }
    } else if (error.status === 404) {
      console.error('Not found:', error.message);
      if (window.toast) {
        window.toast.error('The requested resource was not found.');
      }
    } else {
      console.error('API error:', error);
      if (window.toast) {
        window.toast.error(error.message || 'An error occurred. Please try again.');
      }
    }
  },

  // GET request
  get: async <T = any>(url: string, params?: any): Promise<T> => {
    console.log('🌐 Frontend apiService.get - Requesting:', url, 'with params:', params);
    const response = await api.get<ApiResponse<T>>(url, { params });
    console.log('📥 Frontend apiService.get - Raw response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    console.log('📦 Frontend apiService.get - Returning response.data.data:', response.data.data);
    return response.data.data;
  },

  // POST request
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data.data;
  },

  // PUT request
  put: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data.data;
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  },

  // DELETE request
  delete: async <T = any>(url: string): Promise<T> => {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data.data;
  },

  // File upload
  upload: async <T = any>(url: string, formData: FormData): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // File download
  download: async (url: string, filename?: string): Promise<void> => {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    // Create blob link to download
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = downloadUrl;

    // Get filename from response headers or use provided filename
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        downloadFilename = filenameMatch[1];
      }
    }

    link.download = downloadFilename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// Authentication API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiService.post('/auth/login', credentials),

  logout: () =>
    apiService.post('/auth/logout'),

  refresh: () =>
    apiService.post('/auth/refresh-token'),

  getCurrentUser: () =>
    apiService.get('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiService.post('/auth/change-password', data),

  // OTP-related endpoints
  verifyOTP: (data: { email: string; otpCode: string }) =>
    apiService.post('/auth/verify-otp', data),

  resendOTP: (data: { email: string }) =>
    apiService.post('/auth/resend-otp', data),

  verifyAndLogin: (data: { email: string; otpCode: string; password?: string }) =>
    apiService.post('/auth/verify-and-login', data),

  resendLoginOTP: (data: { email: string }) =>
    apiService.post('/auth/resend-login-otp', data),

  forgotPassword: (email: string) =>
    apiService.post('/auth/forgot-password', { email }),

  resetPassword: (data: { email: string; token: string; newPassword: string }) =>
    apiService.post('/auth/reset-password', data),
};

// Users API
export const usersAPI = {
  getUsers: (params?: any) =>
    apiService.get('/users', params),

  getUserById: (userId: string) =>
    apiService.get(`/users/${userId}`),

  createUser: (userData: any) =>
    apiService.post('/users', userData),

  updateUser: (userId: string, userData: any) =>
    apiService.put(`/users/${userId}`, userData),

  deleteUser: (userId: string) =>
    apiService.delete(`/users/${userId}`),

  bulkOperations: (data: { operation: string; userIds: string[]; data?: any }) =>
    apiService.post('/admin/users/bulk', data),
};

// Issues API
export const issuesAPI = {
  getIssues: (params?: any) => {
    console.log('📡 Frontend API: getIssues called with params:', params);
    console.log('📡 Frontend API: Making request to /issues/public');
    return apiService.get('/issues/public', params);
  },

  getMyIssues: (params?: any) => {
    console.log('📡 Frontend API: getMyIssues called with params:', params);
    console.log('📡 Frontend API: Making request to /issues/my');
    return apiService.get('/issues/my', params);
  },

  getNearbyIssues: (params: { latitude: number; longitude: number; radius?: number; page?: number; limit?: number }) => {
    console.log('📡 Frontend API: getNearbyIssues called with params:', params);
    console.log('📡 Frontend API: Making request to /issues/nearby');
    return apiService.get('/issues/nearby', params);
  },

  getMapIssues: (params?: { status?: string; category?: string; priority?: string }) => {
    console.log('📡 Frontend API: getMapIssues called with params:', params);
    console.log('📡 Frontend API: Making request to /issues/map');
    return apiService.get('/issues/map', params);
  },

  getIssueById: (issueId: string) =>
    apiService.get(`/issues/${issueId}`),

  createIssue: (issueData: any) =>
    apiService.post('/issues', issueData),

  updateIssue: (issueId: string, issueData: any) =>
    apiService.put(`/issues/${issueId}`, issueData),

  deleteIssue: (issueId: string) =>
    apiService.delete(`/issues/${issueId}`),

  addComment: (issueId: string, comment: { content: string; isInternal: boolean }) =>
    apiService.post(`/issues/${issueId}/comments`, { message: comment.content }),

  voteOnIssue: (issueId: string, voteType: 'upvote' | 'downvote') =>
    apiService.post(`/issues/${issueId}/vote`, { type: voteType }),

  removeVote: (issueId: string) =>
    apiService.delete(`/issues/${issueId}/vote`),

  assignIssue: (issueId: string, data: { assignedTo?: string; assignedDepartment?: string }) =>
    apiService.put(`/issues/${issueId}/assign`, data),

  updateStatus: (issueId: string, status: string) =>
    apiService.put(`/issues/${issueId}/status`, { status }),

  bulkUpdateIssues: (data: { issueIds: string[]; updates: any }) =>
    apiService.put('/issues/bulk-update', data),
};

// Departments API
export const departmentsAPI = {
  getDepartments: (params?: { page?: number; limit?: number; isActive?: boolean; search?: string; category?: string }) =>
    apiService.get('/departments', params),

  getById: (id: string) =>
    apiService.get(`/departments/${id}`),

  createDepartment: (data: {
    name: string;
    code: string;
    contactEmail: string;
    contactPhone?: string;
    categories?: string[];
    isActive?: boolean;
  }) => apiService.post('/departments', data),

  updateDepartment: (id: string, data: Partial<{
    name: string;
    code: string;
    contactEmail: string;
    contactPhone?: string;
    categories?: string[];
    isActive?: boolean;
  }>) => apiService.put(`/departments/${id}`, data),

  deleteDepartment: (id: string) =>
    apiService.delete(`/departments/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboardMetrics: () =>
    apiService.get('/analytics/dashboard'),

  getPerformanceMetrics: (params?: { startDate?: string; endDate?: string }) =>
    apiService.get('/analytics/performance', params),

  getTrendingIssues: (params?: { period?: string; limit?: number }) =>
    apiService.get('/analytics/trending', params),

  exportData: (params: { format: string; startDate?: string; endDate?: string }) =>
    apiService.download('/analytics/export', `analytics-export.${params.format}`),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: any) =>
    apiService.get('/notifications', params),

  markAsRead: (notificationId: string) =>
    apiService.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiService.put('/notifications/read-all'),

  deleteNotification: (notificationId: string) =>
    apiService.delete(`/notifications/${notificationId}`),

  createSystemAnnouncement: (data: any) =>
    apiService.post('/notifications/system-announcement', data),

  createCustomNotification: (data: any) =>
    apiService.post('/notifications/custom', data),

  getStats: () =>
    apiService.get('/notifications/stats'),
};

// User Profile API
export const userApi = {
  getProfile: () =>
    apiService.get('/users/profile'),

  updateProfile: (data: any) =>
    apiService.patch('/users/profile', data),

  getStats: () =>
    apiService.get('/users/stats'),

  uploadAvatar: (imageData: FormData) =>
    apiService.upload('/users/avatar', imageData),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiService.post('/auth/change-password', data),
};

// Admin API
export const adminAPI = {
  signup: (data: { name: string; email: string; username?: string; password: string }) =>
    apiService.post('/admin/signup', data),

  login: (data: { identifier: string; password: string }) =>
    apiService.post('/admin/login', data),

  me: () => apiService.get('/admin/me'),

  refresh: (data?: { refreshToken?: string }) =>
    apiService.post('/admin/refresh', data),
};

export default api;

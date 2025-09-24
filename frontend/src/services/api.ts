import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { store } from '../store/store';
import { logoutUser, refreshToken } from '../store/slices/authSlice';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const state = store.getState();
    const token = state.auth.token;
    
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
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await store.dispatch(refreshToken());
        
        // Retry the original request
        const state = store.getState();
        const newToken = state.auth.token;
        
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logoutUser());
        
        // Redirect to login if we're not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
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
    
    return Promise.reject({
      message: errorMessage,
      status: error.response.status,
      data: error.response.data,
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
    apiService.post('/auth/refresh'),
  
  getCurrentUser: () =>
    apiService.get('/auth/me'),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiService.put('/auth/change-password', data),
  
  // OTP-related endpoints
  verifyOTP: (data: { email: string; otpCode: string }) =>
    apiService.post('/auth/verify-otp', data),
  
  resendOTP: (data: { email: string }) =>
    apiService.post('/auth/resend-otp', data),
  
  verifyAndLogin: (data: { email: string; otpCode: string; password?: string }) =>
    apiService.post('/auth/verify-and-login', data),
  
  resendLoginOTP: (data: { email: string }) =>
    apiService.post('/auth/resend-login-otp', data),
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
  
  getIssueById: (issueId: string) =>
    apiService.get(`/issues/${issueId}`),
  
  createIssue: (formData: FormData) =>
    apiService.upload('/issues', formData),
  
  updateIssue: (issueId: string, issueData: any) =>
    apiService.put(`/issues/${issueId}`, issueData),
  
  deleteIssue: (issueId: string) =>
    apiService.delete(`/issues/${issueId}`),
  
  addComment: (issueId: string, comment: { content: string; isInternal: boolean }) =>
    apiService.post(`/issues/${issueId}/comments`, comment),
  
  voteOnIssue: (issueId: string) =>
    apiService.post(`/issues/${issueId}/vote`),
  
  assignIssue: (issueId: string, data: { assignedTo?: string; assignedDepartment?: string }) =>
    apiService.put(`/issues/${issueId}/assign`, data),
  
  updateStatus: (issueId: string, status: string) =>
    apiService.put(`/issues/${issueId}/status`, { status }),

  bulkUpdateIssues: (data: { issueIds: string[]; updates: any }) =>
    apiService.put('/issues/bulk-update', data),
};

// Departments API
export const departmentsAPI = {
  getDepartments: () =>
    apiService.get('/departments'),
  
  getDepartmentById: (departmentId: string) =>
    apiService.get(`/departments/${departmentId}`),
  
  createDepartment: (departmentData: any) =>
    apiService.post('/departments', departmentData),
  
  updateDepartment: (departmentId: string, departmentData: any) =>
    apiService.put(`/departments/${departmentId}`, departmentData),
  
  deleteDepartment: (departmentId: string) =>
    apiService.delete(`/departments/${departmentId}`),
  
  addStaff: (departmentId: string, userId: string) =>
    apiService.post(`/departments/${departmentId}/staff`, { userId }),
  
  removeStaff: (departmentId: string, userId: string) =>
    apiService.delete(`/departments/${departmentId}/staff/${userId}`),
  
  getStatistics: (departmentId: string) =>
    apiService.get(`/departments/${departmentId}/statistics`),
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

// Admin API
export const adminAPI = {
  getSystemOverview: () =>
    apiService.get('/admin/overview'),
  
  getSystemLogs: (params?: any) =>
    apiService.get('/admin/logs', params),
  
  updateSystemConfig: (config: any) =>
    apiService.put('/admin/config', config),
  
  generateReport: (params: { reportType: string; startDate?: string; endDate?: string; format?: string }) =>
    apiService.get('/admin/reports', params),
  
  performMaintenance: (operation: string) =>
    apiService.post('/admin/maintenance', { operation }),
};

export default api;

0import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  targetUsers?: string[];
  targetRoles?: string[];
  targetDepartments?: string[];
  expiresAt?: string;
  createdAt: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: string;
  priority?: string;
  actionUrl?: string;
  actionText?: string;
  targetUsers?: string[];
  targetRoles?: string[];
  targetDepartments?: string[];
  expiresAt?: string;
}

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  priority?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  filters: NotificationFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 0,
    total: 0,
  },
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: { page?: number; limit?: number; filters?: NotificationFilters }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.filters?.type) searchParams.append('type', params.filters.type);
      if (params.filters?.isRead !== undefined) searchParams.append('isRead', params.filters.isRead.toString());
      if (params.filters?.priority) searchParams.append('priority', params.filters.priority);
      if (params.filters?.startDate) searchParams.append('startDate', params.filters.startDate);
      if (params.filters?.endDate) searchParams.append('endDate', params.filters.endDate);

      const response = await fetch(`/api/notifications?${searchParams.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch notifications');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to mark notification as read');
      }

      return { notificationId };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to mark all notifications as read');
      }

      return {};
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to delete notification');
      }

      return { notificationId };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const createSystemAnnouncement = createAsyncThunk(
  'notifications/createAnnouncement',
  async (announcementData: CreateNotificationData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/system-announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(announcementData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create system announcement');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const createCustomNotification = createAsyncThunk(
  'notifications/createCustomNotification',
  async (notificationData: CreateNotificationData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(notificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create custom notification');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/stats', {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch notification stats');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<NotificationFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data.notifications;
        state.unreadCount = action.payload.data.unreadCount;
        state.pagination = {
          page: action.payload.data.currentPage,
          limit: action.payload.data.limit,
          totalPages: action.payload.data.totalPages,
          total: action.payload.data.total,
        };
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.notificationId);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Mark all as read
    builder
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.loading = false;
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.notificationId);
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload.notificationId);
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Create system announcement
    builder
      .addCase(createSystemAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSystemAnnouncement.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createSystemAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create custom notification
    builder
      .addCase(createCustomNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomNotification.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createCustomNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch stats
    builder
      .addCase(fetchNotificationStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationStats.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchNotificationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  setLoading,
  addNotification,
  updateUnreadCount,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications;
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount;
export const selectNotificationLoading = (state: { notifications: NotificationState }) => state.notifications.loading;
export const selectNotificationError = (state: { notifications: NotificationState }) => state.notifications.error;
export const selectNotificationFilters = (state: { notifications: NotificationState }) => state.notifications.filters;
export const selectNotificationPagination = (state: { notifications: NotificationState }) => state.notifications.pagination;

export default notificationSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface DashboardMetrics {
  totalIssues: number;
  pendingIssues: number;
  resolvedIssues: number;
  activeUsers: number;
  totalDepartments: number;
  avgResolutionTime: number;
  recentActivity: {
    todayIssues: number;
    weeklyIssues: number;
    monthlyIssues: number;
  };
  resolutionRate: number;
}

export interface PerformanceMetrics {
  departmentPerformance: Array<{
    department: string;
    totalIssues: number;
    resolvedIssues: number;
    avgResolutionTime: number;
    resolutionRate: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    reported: number;
    resolved: number;
  }>;
}

export interface TrendingIssue {
  id: string;
  title: string;
  category: string;
  location: string;
  voteCount: number;
  status: string;
  createdAt: string;
}

export interface AnalyticsState {
  dashboardMetrics: DashboardMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  trendingIssues: TrendingIssue[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Initial state
const initialState: AnalyticsState = {
  dashboardMetrics: null,
  performanceMetrics: null,
  trendingIssues: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchDashboardMetrics = createAsyncThunk(
  'analytics/fetchDashboardMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch dashboard metrics');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const fetchPerformanceMetrics = createAsyncThunk(
  'analytics/fetchPerformanceMetrics',
  async (params: { startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await fetch(`/api/analytics/performance?${searchParams.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch performance metrics');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const fetchTrendingIssues = createAsyncThunk(
  'analytics/fetchTrendingIssues',
  async (params: { period?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.period) searchParams.append('period', params.period);
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`/api/analytics/trending?${searchParams.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch trending issues');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const exportAnalyticsData = createAsyncThunk(
  'analytics/exportData',
  async (params: { format: string; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('format', params.format);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await fetch(`/api/analytics/export?${searchParams.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Failed to export data');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${params.format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// Analytics slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    refreshData: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardMetrics = action.payload.data.metrics;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch performance metrics
    builder
      .addCase(fetchPerformanceMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.performanceMetrics = action.payload.data.metrics;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch trending issues
    builder
      .addCase(fetchTrendingIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingIssues = action.payload.data.issues;
        state.error = null;
      })
      .addCase(fetchTrendingIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Export data
    builder
      .addCase(exportAnalyticsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportAnalyticsData.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(exportAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, refreshData } = analyticsSlice.actions;

// Selectors
export const selectDashboardMetrics = (state: { analytics: AnalyticsState }) => state.analytics.dashboardMetrics;
export const selectPerformanceMetrics = (state: { analytics: AnalyticsState }) => state.analytics.performanceMetrics;
export const selectTrendingIssues = (state: { analytics: AnalyticsState }) => state.analytics.trendingIssues;
export const selectAnalyticsLoading = (state: { analytics: AnalyticsState }) => state.analytics.loading;
export const selectAnalyticsError = (state: { analytics: AnalyticsState }) => state.analytics.error;
export const selectLastUpdated = (state: { analytics: AnalyticsState }) => state.analytics.lastUpdated;

export default analyticsSlice.reducer;

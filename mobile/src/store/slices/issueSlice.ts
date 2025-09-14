import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { issueApi } from '../../services/api';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
}

export interface IssueFilters {
  status?: string[];
  category?: string[];
  priority?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface IssueState {
  issues: Issue[];
  myIssues: Issue[];
  nearbyIssues: Issue[];
  currentIssue: Issue | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filters: IssueFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: IssueState = {
  issues: [],
  myIssues: [],
  nearbyIssues: [],
  currentIssue: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const createIssue = createAsyncThunk(
  'issues/create',
  async (issueData: FormData, { rejectWithValue }) => {
    try {
      const response = await issueApi.create(issueData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create issue');
    }
  }
);

export const fetchMyIssues = createAsyncThunk(
  'issues/fetchMy',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await issueApi.getMyIssues(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch issues');
    }
  }
);

export const fetchNearbyIssues = createAsyncThunk(
  'issues/fetchNearby',
  async (params: { latitude: number; longitude: number; radius?: number }, { rejectWithValue }) => {
    try {
      const response = await issueApi.getNearbyIssues(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nearby issues');
    }
  }
);

export const fetchIssueById = createAsyncThunk(
  'issues/fetchById',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const response = await issueApi.getById(issueId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch issue');
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/update',
  async ({ issueId, data }: { issueId: string; data: Partial<Issue> }, { rejectWithValue }) => {
    try {
      const response = await issueApi.update(issueId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update issue');
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'issues/submitFeedback',
  async ({ issueId, feedback }: { issueId: string; feedback: { rating: number; comment: string } }, { rejectWithValue }) => {
    try {
      const response = await issueApi.submitFeedback(issueId, feedback);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit feedback');
    }
  }
);

const issueSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<IssueFilters>) => {
      state.filters = action.payload;
    },
    clearCurrentIssue: (state) => {
      state.currentIssue = null;
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        hasMore: true,
      };
    },
    updateIssueStatus: (state, action: PayloadAction<{ issueId: string; status: Issue['status'] }>) => {
      const { issueId, status } = action.payload;
      
      // Update in myIssues
      const myIssueIndex = state.myIssues.findIndex(issue => issue.id === issueId);
      if (myIssueIndex !== -1) {
        state.myIssues[myIssueIndex].status = status;
      }
      
      // Update in nearbyIssues
      const nearbyIssueIndex = state.nearbyIssues.findIndex(issue => issue.id === issueId);
      if (nearbyIssueIndex !== -1) {
        state.nearbyIssues[nearbyIssueIndex].status = status;
      }
      
      // Update current issue
      if (state.currentIssue && state.currentIssue.id === issueId) {
        state.currentIssue.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // Create Issue
    builder
      .addCase(createIssue.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.myIssues.unshift(action.payload);
        state.error = null;
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Fetch My Issues
    builder
      .addCase(fetchMyIssues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyIssues.fulfilled, (state, action) => {
        state.isLoading = false;
        const { issues, pagination } = action.payload;
        
        if (pagination.page === 1) {
          state.myIssues = issues;
        } else {
          state.myIssues.push(...issues);
        }
        
        state.pagination = pagination;
        state.error = null;
      })
      .addCase(fetchMyIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Nearby Issues
    builder
      .addCase(fetchNearbyIssues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyIssues.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyIssues = action.payload.issues;
        state.error = null;
      })
      .addCase(fetchNearbyIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Issue By ID
    builder
      .addCase(fetchIssueById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIssueById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentIssue = action.payload;
        state.error = null;
      })
      .addCase(fetchIssueById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Issue
    builder
      .addCase(updateIssue.fulfilled, (state, action) => {
        const updatedIssue = action.payload;
        
        // Update in myIssues
        const myIssueIndex = state.myIssues.findIndex(issue => issue.id === updatedIssue.id);
        if (myIssueIndex !== -1) {
          state.myIssues[myIssueIndex] = updatedIssue;
        }
        
        // Update current issue
        if (state.currentIssue && state.currentIssue.id === updatedIssue.id) {
          state.currentIssue = updatedIssue;
        }
      });

    // Submit Feedback
    builder
      .addCase(submitFeedback.fulfilled, (state, action) => {
        const updatedIssue = action.payload;
        
        // Update in myIssues
        const myIssueIndex = state.myIssues.findIndex(issue => issue.id === updatedIssue.id);
        if (myIssueIndex !== -1) {
          state.myIssues[myIssueIndex] = updatedIssue;
        }
        
        // Update current issue
        if (state.currentIssue && state.currentIssue.id === updatedIssue.id) {
          state.currentIssue = updatedIssue;
        }
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearCurrentIssue, 
  resetPagination,
  updateIssueStatus
} = issueSlice.actions;

export default issueSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { issuesAPI } from '../../services/api';

// Types
export interface IssueLocation {
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  coordinates: [number, number]; // [longitude, latitude]
  landmark?: string;
}

export interface IssueAttachment {
  _id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface IssueComment {
  _id: string;
  user: {
    _id: string;
    name: string;
    role?: string;
  };
  message: string;
  timestamp: string;
  isOfficial: boolean;
}

export interface IssueVote {
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  location: IssueLocation;
  media: {
    images: string[];
    videos?: string[];
    audio?: string;
  };
  reportedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  assignedDepartment?: {
    _id: string;
    name: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
  };
  timeline: {
    reported: string;
    acknowledged?: string;
    started?: string;
    resolved?: string;
    closed?: string;
  };
  comments: IssueComment[];
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  voteScore?: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  commentsCount?: number;
  upvotes?: number;
}

export interface CreateIssueData {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  images?: File[];
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  assignedDepartment?: string;
  dueDate?: string;
  notes?: string;
}

export interface IssueFilters {
  status?: string;
  category?: string;
  priority?: string;
  assignedDepartment?: string;
  assignedTo?: string;
  reportedBy?: string;
  isPublic?: boolean;
  search?: string;
}

export interface IssueState {
  issues: Issue[];
  selectedIssue: Issue | null;
  totalIssues: number;
  loading: boolean;
  error: string | null;
  filters: IssueFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    currentPage: number;
  };
  categories: string[];
  mapMode: boolean;
}

// Initial state
const initialState: IssueState = {
  issues: [],
  selectedIssue: null,
  totalIssues: 0,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    currentPage: 1,
  },
  categories: [
    'pothole',
    'streetlight',
    'garbage',
    'water_supply',
    'sewerage',
    'traffic',
    'park_maintenance',
    'road_maintenance',
    'electrical',
    'construction',
    'noise_pollution',
    'air_pollution',
    'water_pollution',
    'stray_animals',
    'illegal_parking',
    'illegal_construction',
    'public_transport',
    'healthcare',
    'education',
    'other'
  ],
  mapMode: false,
};

// Async thunks
export const fetchIssues = createAsyncThunk(
  'issues/fetchIssues',
  async (params: { page?: number; limit?: number; status?: string; category?: string; priority?: string; reportedBy?: string; search?: string }, { rejectWithValue }) => {
    try {
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.status) queryParams.status = params.status;
      if (params.category) queryParams.category = params.category;
      if (params.priority) queryParams.priority = params.priority;
      if (params.reportedBy) queryParams.reportedBy = params.reportedBy;
      if (params.search) queryParams.search = params.search;

      const data = await issuesAPI.getIssues(queryParams);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch issues');
    }
  }
);

export const fetchIssueById = createAsyncThunk(
  'issues/fetchIssueById',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const data = await issuesAPI.getIssueById(issueId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch issue');
    }
  }
);

export const createIssue = createAsyncThunk(
  'issues/createIssue',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const data = await issuesAPI.createIssue(formData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create issue');
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/updateIssue',
  async ({ issueId, issueData }: { issueId: string; issueData: UpdateIssueData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(issueData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update issue');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const deleteIssue = createAsyncThunk(
  'issues/deleteIssue',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to delete issue');
      }

      return { issueId };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const addIssueComment = createAsyncThunk(
  'issues/addComment',
  async ({ issueId, content, isInternal }: { issueId: string; content: string; isInternal: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content, isInternal }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to add comment');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const voteOnIssue = createAsyncThunk(
  'issues/vote',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to vote on issue');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const assignIssue = createAsyncThunk(
  'issues/assignIssue',
  async ({ issueId, assigneeId, priority, dueDate, notes }: { 
    issueId: string; 
    assigneeId?: string; 
    priority?: string; 
    dueDate?: string; 
    notes?: string; 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          assignedTo: assigneeId,
          priority,
          dueDate,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to assign issue');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const bulkUpdateIssues = createAsyncThunk(
  'issues/bulkUpdateIssues',
  async ({ issueIds, updates }: { issueIds: string[]; updates: UpdateIssueData }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/issues/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issueIds,
          updates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to bulk update issues');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// Issue slice
const issueSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedIssue: (state, action: PayloadAction<Issue | null>) => {
      state.selectedIssue = action.payload;
    },
    setFilters: (state, action: PayloadAction<IssueFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setMapMode: (state, action: PayloadAction<boolean>) => {
      state.mapMode = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch issues
    builder
      .addCase(fetchIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload.issues.map((issue: any) => ({
          ...issue,
          _id: issue.id,
          commentsCount: issue.comments?.length || 0,
          upvotes: issue.votes?.upvotes?.length || 0,
        }));
        state.totalIssues = action.payload.total || action.payload.issues.length;
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
          currentPage: action.payload.currentPage || action.payload.pagination?.currentPage || 1,
        };
        state.error = null;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch issue by ID
    builder
      .addCase(fetchIssueById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssueById.fulfilled, (state, action) => {
        state.loading = false;
        const issue = action.payload.issue;
        state.selectedIssue = {
          ...issue,
          _id: issue.id,
          commentsCount: issue.comments?.length || 0,
          upvotes: issue.votes?.upvotes?.length || 0,
        };
        state.error = null;
      })
      .addCase(fetchIssueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create issue
    builder
      .addCase(createIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.loading = false;
        const issue = action.payload.issue;
        const normalizedIssue = {
          ...issue,
          _id: issue.id,
          commentsCount: issue.comments?.length || 0,
          upvotes: issue.votes?.upvotes?.length || 0,
        };
        state.issues.unshift(normalizedIssue);
        state.totalIssues += 1;
        state.error = null;
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update issue
    builder
      .addCase(updateIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIssue.fulfilled, (state, action) => {
        state.loading = false;
        const updatedIssue = action.payload.data.issue;
        const index = state.issues.findIndex(issue => issue.id === updatedIssue.id);
        if (index !== -1) {
          state.issues[index] = updatedIssue;
        }
        if (state.selectedIssue && state.selectedIssue.id === updatedIssue.id) {
          state.selectedIssue = updatedIssue;
        }
        state.error = null;
      })
      .addCase(updateIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete issue
    builder
      .addCase(deleteIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = state.issues.filter(issue => issue.id !== action.payload.issueId);
        state.totalIssues -= 1;
        if (state.selectedIssue && state.selectedIssue.id === action.payload.issueId) {
          state.selectedIssue = null;
        }
        state.error = null;
      })
      .addCase(deleteIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add comment
    builder
      .addCase(addIssueComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addIssueComment.fulfilled, (state, action) => {
        state.loading = false;
        if (state.selectedIssue) {
          state.selectedIssue.comments.push(action.payload.data.comment);
        }
        state.error = null;
      })
      .addCase(addIssueComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Vote on issue
    builder
      .addCase(voteOnIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(voteOnIssue.fulfilled, (state, action) => {
        state.loading = false;
        const updatedIssue = action.payload.data.issue;
        const index = state.issues.findIndex(issue => issue.id === updatedIssue.id);
        if (index !== -1) {
          state.issues[index] = updatedIssue;
        }
        if (state.selectedIssue && state.selectedIssue.id === updatedIssue.id) {
          state.selectedIssue = updatedIssue;
        }
        state.error = null;
      })
      .addCase(voteOnIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Assign issue
    builder
      .addCase(assignIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignIssue.fulfilled, (state, action) => {
        state.loading = false;
        const updatedIssue = action.payload.data.issue;
        const index = state.issues.findIndex(issue => issue._id === updatedIssue._id);
        if (index !== -1) {
          state.issues[index] = updatedIssue;
        }
        if (state.selectedIssue && state.selectedIssue._id === updatedIssue._id) {
          state.selectedIssue = updatedIssue;
        }
        state.error = null;
      })
      .addCase(assignIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk update issues
    builder
      .addCase(bulkUpdateIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateIssues.fulfilled, (state, action) => {
        state.loading = false;
        // Update all issues that were bulk updated
        const updatedIssues = action.payload.data.issues || [];
        updatedIssues.forEach((updatedIssue: Issue) => {
          const index = state.issues.findIndex(issue => issue._id === updatedIssue._id);
          if (index !== -1) {
            state.issues[index] = updatedIssue;
          }
        });
        state.error = null;
      })
      .addCase(bulkUpdateIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedIssue,
  setFilters,
  clearFilters,
  setPagination,
  setMapMode,
  setLoading,
} = issueSlice.actions;

// Selectors
export const selectIssues = (state: { issues: IssueState }) => state.issues.issues;
export const selectSelectedIssue = (state: { issues: IssueState }) => state.issues.selectedIssue;
export const selectTotalIssues = (state: { issues: IssueState }) => state.issues.totalIssues;
export const selectIssuesLoading = (state: { issues: IssueState }) => state.issues.loading;
export const selectIssuesError = (state: { issues: IssueState }) => state.issues.error;
export const selectIssuesPagination = (state: { issues: IssueState }) => state.issues.pagination;
export const selectIssuesCategories = (state: { issues: IssueState }) => state.issues.categories;
export const selectMapMode = (state: { issues: IssueState }) => state.issues.mapMode;

export default issueSlice.reducer;

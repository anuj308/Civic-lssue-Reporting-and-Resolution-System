import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface IssueLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}

export interface IssueAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface IssueComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  isInternal: boolean;
  createdAt: string;
}

export interface IssueVote {
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'in-progress' | 'resolved' | 'closed';
  location: IssueLocation;
  attachments: IssueAttachment[];
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedDepartment?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  timeline: {
    reported: string;
    acknowledged?: string;
    'in-progress'?: string;
    resolved?: string;
    closed?: string;
  };
  comments: IssueComment[];
  votes: IssueVote[];
  voteCount: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueData {
  title: string;
  description: string;
  category: string;
  priority: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  attachments?: File[];
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  assignedDepartment?: string;
  assignedTo?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface IssueFilters {
  status?: string;
  category?: string;
  priority?: string;
  assignedDepartment?: string;
  assignedTo?: string;
  reportedBy?: string;
  isPublic?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  location?: {
    center: [number, number];
    radius: number;
  };
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
  },
  categories: [
    'Roads & Transportation',
    'Water & Utilities',
    'Waste Management',
    'Public Safety',
    'Parks & Recreation',
    'Health & Sanitation',
    'Education',
    'Other'
  ],
  mapMode: false,
};

// Async thunks
export const fetchIssues = createAsyncThunk(
  'issues/fetchIssues',
  async (params: { page?: number; limit?: number; filters?: IssueFilters }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.filters?.status) searchParams.append('status', params.filters.status);
      if (params.filters?.category) searchParams.append('category', params.filters.category);
      if (params.filters?.priority) searchParams.append('priority', params.filters.priority);
      if (params.filters?.assignedDepartment) searchParams.append('assignedDepartment', params.filters.assignedDepartment);
      if (params.filters?.assignedTo) searchParams.append('assignedTo', params.filters.assignedTo);
      if (params.filters?.reportedBy) searchParams.append('reportedBy', params.filters.reportedBy);
      if (params.filters?.isPublic !== undefined) searchParams.append('isPublic', params.filters.isPublic.toString());
      if (params.filters?.search) searchParams.append('search', params.filters.search);
      if (params.filters?.dateRange) {
        searchParams.append('startDate', params.filters.dateRange.startDate);
        searchParams.append('endDate', params.filters.dateRange.endDate);
      }
      if (params.filters?.location) {
        searchParams.append('lat', params.filters.location.center[1].toString());
        searchParams.append('lng', params.filters.location.center[0].toString());
        searchParams.append('radius', params.filters.location.radius.toString());
      }

      const response = await fetch(`/api/issues?${searchParams.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch issues');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const fetchIssueById = createAsyncThunk(
  'issues/fetchIssueById',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch issue');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const createIssue = createAsyncThunk(
  'issues/createIssue',
  async (issueData: CreateIssueData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      formData.append('title', issueData.title);
      formData.append('description', issueData.description);
      formData.append('category', issueData.category);
      formData.append('priority', issueData.priority);
      formData.append('location', JSON.stringify(issueData.location));
      
      if (issueData.isPublic !== undefined) {
        formData.append('isPublic', issueData.isPublic.toString());
      }
      
      if (issueData.tags) {
        formData.append('tags', JSON.stringify(issueData.tags));
      }

      if (issueData.attachments) {
        issueData.attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });
      }

      const response = await fetch('/api/issues', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create issue');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
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
        state.issues = action.payload.data.issues;
        state.totalIssues = action.payload.data.total;
        state.pagination = {
          page: action.payload.data.currentPage,
          limit: action.payload.data.limit,
          totalPages: action.payload.data.totalPages,
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
        state.selectedIssue = action.payload.data.issue;
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
        state.issues.unshift(action.payload.data.issue);
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
export const selectIssueLoading = (state: { issues: IssueState }) => state.issues.loading;
export const selectIssueError = (state: { issues: IssueState }) => state.issues.error;
export const selectIssueFilters = (state: { issues: IssueState }) => state.issues.filters;
export const selectIssuePagination = (state: { issues: IssueState }) => state.issues.pagination;
export const selectIssueCategories = (state: { issues: IssueState }) => state.issues.categories;
export const selectMapMode = (state: { issues: IssueState }) => state.issues.mapMode;

export default issueSlice.reducer;

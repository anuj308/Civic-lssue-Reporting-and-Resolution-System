import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { issueApi } from '../../services/api';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    landmark?: string;
  };
  media?: {
    images: string[];
    videos?: string[];
    audio?: string;
  };
  reportedBy: {
    id?: string;
    name: string;
    email?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  assignedDepartment?: {
    id: string;
    name: string;
  };
  timeline?: {
    reported: string;
    acknowledged?: string;
    started?: string;
    resolved?: string;
    closed?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
  // New voting and commenting fields
  voteScore?: number;
  userVote?: 'upvote' | 'downvote' | null;
  comments?: Comment[];
  tags?: string[];
  daysSinceReported?: number;
  isPublic?: boolean;
  urgencyScore?: number;
  analytics?: {
    views: number;
    shares: number;
    reportCount: number;
  };
}

export interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
  };
  message: string;
  timestamp: string;
  isOfficial: boolean;
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
  async (issueData: any, { rejectWithValue }) => {
    try {
      console.log('📤 Creating issue via API...');
      const response = await issueApi.create(issueData);
      console.log('✅ Issue created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('📥 API Error Response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create issue';
      const errors = error.response?.data?.errors || [];
      
      if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        const errorDetails = errors.map((err: any) => `${err.path || err.param}: ${err.msg}`).join(', ');
        return rejectWithValue(`Validation failed: ${errorDetails}`);
      }
      
      return rejectWithValue(errorMessage);
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

export const voteIssue = createAsyncThunk(
  'issues/vote',
  async ({ issueId, voteType }: { issueId: string; voteType: 'upvote' | 'downvote' }, { rejectWithValue }) => {
    try {
      const response = await issueApi.voteIssue(issueId, voteType);
      return { issueId, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to vote on issue');
    }
  }
);

export const removeVote = createAsyncThunk(
  'issues/removeVote',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const response = await issueApi.removeVote(issueId);
      return { issueId, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove vote');
    }
  }
);

export const addComment = createAsyncThunk(
  'issues/addComment',
  async ({ issueId, message }: { issueId: string; message: string }, { rejectWithValue }) => {
    try {
      const response = await issueApi.addComment(issueId, message);
      return { issueId, comment: response.data.data.comment };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'issues/deleteComment',
  async ({ issueId, commentId }: { issueId: string; commentId: string }, { rejectWithValue }) => {
    try {
      const response = await issueApi.deleteComment(issueId, commentId);
      return { issueId, commentId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
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
        state.myIssues.unshift(action.payload.data.issue);
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
        const { issues, pagination } = action.payload.data;
        
        if (pagination.currentPage === 1) {
          state.myIssues = issues;
        } else {
          state.myIssues.push(...issues);
        }
        
        state.pagination = {
          page: pagination.currentPage,
          limit: 10, // Default limit
          total: pagination.totalIssues,
          hasMore: pagination.hasNextPage,
        };
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
        state.nearbyIssues = action.payload.data.issues;
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
        state.currentIssue = action.payload.data.issue;
        state.error = null;
      })
      .addCase(fetchIssueById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Issue
    builder
      .addCase(updateIssue.fulfilled, (state, action) => {
        const updatedIssue = action.payload.data.issue;
        
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
        const updatedIssue = action.payload.data.issue;
        
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

    // Vote on Issue
    builder
      .addCase(voteIssue.fulfilled, (state, action) => {
        const { issueId, voteScore, userVote } = action.payload;
        
        // Update current issue
        if (state.currentIssue && state.currentIssue.id === issueId) {
          state.currentIssue.voteScore = voteScore;
          state.currentIssue.userVote = userVote;
        }
        
        // Update in myIssues
        const myIssueIndex = state.myIssues.findIndex(issue => issue.id === issueId);
        if (myIssueIndex !== -1) {
          state.myIssues[myIssueIndex].voteScore = voteScore;
          state.myIssues[myIssueIndex].userVote = userVote;
        }
        
        // Update in nearbyIssues
        const nearbyIssueIndex = state.nearbyIssues.findIndex(issue => issue.id === issueId);
        if (nearbyIssueIndex !== -1) {
          state.nearbyIssues[nearbyIssueIndex].voteScore = voteScore;
          state.nearbyIssues[nearbyIssueIndex].userVote = userVote;
        }
      });

    // Remove Vote
    builder
      .addCase(removeVote.fulfilled, (state, action) => {
        const { issueId, voteScore, userVote } = action.payload;
        
        // Update current issue
        if (state.currentIssue && state.currentIssue.id === issueId) {
          state.currentIssue.voteScore = voteScore;
          state.currentIssue.userVote = userVote;
        }
        
        // Update in myIssues
        const myIssueIndex = state.myIssues.findIndex(issue => issue.id === issueId);
        if (myIssueIndex !== -1) {
          state.myIssues[myIssueIndex].voteScore = voteScore;
          state.myIssues[myIssueIndex].userVote = userVote;
        }
        
        // Update in nearbyIssues
        const nearbyIssueIndex = state.nearbyIssues.findIndex(issue => issue.id === issueId);
        if (nearbyIssueIndex !== -1) {
          state.nearbyIssues[nearbyIssueIndex].voteScore = voteScore;
          state.nearbyIssues[nearbyIssueIndex].userVote = userVote;
        }
      });

    // Add Comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { issueId, comment } = action.payload;
        
        // Update current issue
        if (state.currentIssue && state.currentIssue.id === issueId) {
          if (!state.currentIssue.comments) {
            state.currentIssue.comments = [];
          }
          state.currentIssue.comments.push(comment);
        }
      });

    // Delete Comment
    builder
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { issueId, commentId } = action.payload;
        
        // Update current issue
        if (state.currentIssue && state.currentIssue.id === issueId && state.currentIssue.comments) {
          state.currentIssue.comments = state.currentIssue.comments.filter(
            comment => comment.id !== commentId
          );
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

// Alias exports for compatibility
export const fetchUserIssues = fetchMyIssues;
export const deleteIssue = updateIssue; // Placeholder for delete functionality

export default issueSlice.reducer;

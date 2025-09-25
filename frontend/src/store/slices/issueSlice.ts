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
  userVote?: 'upvote' | 'downvote' | null; // User's current vote status
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
  priority?: 'low' | 'medium' | 'high' | 'critical';
  location: {
    address: string;
    city: string;
    pincode: string;
    coordinates: [number, number]; // [longitude, latitude] as expected by backend
    landmark?: string;
  };
  media?: {
    images: string[];
    videos?: string[];
    audio?: string;
  };
  tags?: string[];
  isPublic?: boolean;
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
  mapIssues: Issue[]; // Issues for map display (all public issues)
  selectedIssue: Issue | null;
  totalIssues: number;
  loading: boolean;
  mapLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string> | null; // Field-specific validation errors
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
  mapIssues: [],
  selectedIssue: null,
  totalIssues: 0,
  loading: false,
  mapLoading: false,
  error: null,
  validationErrors: null,
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
      console.log('🚀 Frontend fetchIssues thunk - Called with params:', params);
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.status) queryParams.status = params.status;
      if (params.category) queryParams.category = params.category;
      if (params.priority) queryParams.priority = params.priority;
      if (params.reportedBy) queryParams.reportedBy = params.reportedBy;
      if (params.search) queryParams.search = params.search;

      const data = await issuesAPI.getIssues(queryParams);
      console.log('✅ Frontend fetchIssues thunk - API returned:', data);
      console.log('✅ Frontend fetchIssues thunk - Data keys:', Object.keys(data || {}));
      console.log('✅ Frontend fetchIssues thunk - Has issues:', !!data?.issues);
      console.log('✅ Frontend fetchIssues thunk - Issues count:', data?.issues?.length || 0);
      return data;
    } catch (error: any) {
      console.log('❌ Frontend fetchIssues thunk - Error:', error);
      return rejectWithValue(error.message || 'Failed to fetch issues');
    }
  }
);

export const fetchMyIssues = createAsyncThunk(
  'issues/fetchMyIssues',
  async (params: { page?: number; limit?: number; status?: string; category?: string; priority?: string; search?: string }, { rejectWithValue }) => {
    try {
      console.log('🚀 Frontend fetchMyIssues thunk - Called with params:', params);
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.status) queryParams.status = params.status;
      if (params.category) queryParams.category = params.category;
      if (params.priority) queryParams.priority = params.priority;
      if (params.search) queryParams.search = params.search;

      const data = await issuesAPI.getMyIssues(queryParams);
      console.log('✅ Frontend fetchMyIssues thunk - API returned:', data);
      return data;
    } catch (error: any) {
      console.log('❌ Frontend fetchMyIssues thunk - Error:', error);
      return rejectWithValue(error.message || 'Failed to fetch my issues');
    }
  }
);

export const fetchMapIssues = createAsyncThunk(
  'issues/fetchMapIssues',
  async (params: { status?: string; category?: string; priority?: string }, { rejectWithValue }) => {
    try {
      console.log('🚀 Frontend fetchMapIssues thunk - Called with params:', params);
      const queryParams: any = {};
      if (params.status) queryParams.status = params.status;
      if (params.category) queryParams.category = params.category;
      if (params.priority) queryParams.priority = params.priority;

      const data = await issuesAPI.getMapIssues(queryParams);
      console.log('✅ Frontend fetchMapIssues thunk - API returned:', data);
      return data;
    } catch (error: any) {
      console.log('❌ Frontend fetchMapIssues thunk - Error:', error);
      return rejectWithValue(error.message || 'Failed to fetch map issues');
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
  async (issueData: CreateIssueData, { rejectWithValue }) => {
    try {
      const data = await issuesAPI.createIssue(issueData);
      return data;
    } catch (error: any) {
      // Return detailed error information including validation errors
      return rejectWithValue({
        message: error.message || 'Failed to create issue',
        validationErrors: error.validationErrors || null,
      });
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/updateIssue',
  async ({ issueId, issueData }: { issueId: string; issueData: UpdateIssueData }, { rejectWithValue }) => {
    try {
      const data = await issuesAPI.updateIssue(issueId, issueData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update issue');
    }
  }
);

export const deleteIssue = createAsyncThunk(
  'issues/deleteIssue',
  async (issueId: string, { rejectWithValue }) => {
    try {
      await issuesAPI.deleteIssue(issueId);
      return { issueId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete issue');
    }
  }
);

export const addIssueComment = createAsyncThunk(
  'issues/addComment',
  async ({ issueId, content, isInternal }: { issueId: string; content: string; isInternal: boolean }, { rejectWithValue }) => {
    try {
      const data = await issuesAPI.addComment(issueId, { content, isInternal });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);

export const voteOnIssue = createAsyncThunk(
  'issues/vote',
  async ({ issueId, voteType }: { issueId: string; voteType: 'upvote' | 'downvote' }, { dispatch, rejectWithValue }) => {
    try {
      const data = await issuesAPI.voteOnIssue(issueId, voteType);

      // Refetch the issue to get updated vote counts
      const updatedIssue = await issuesAPI.getIssueById(issueId);

      return { ...data, issue: updatedIssue.issue };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to vote on issue');
    }
  }
);

export const removeVoteFromIssue = createAsyncThunk(
  'issues/removeVote',
  async (issueId: string, { dispatch, rejectWithValue }) => {
    try {
      const data = await issuesAPI.removeVote(issueId);

      // Refetch the issue to get updated vote counts
      const updatedIssue = await issuesAPI.getIssueById(issueId);

      return { ...data, issue: updatedIssue.issue };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove vote from issue');
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
      // First assign the issue
      const assignData = {
        assignedTo: assigneeId,
      };
      await issuesAPI.assignIssue(issueId, assignData);

      // Then update other fields if provided
      if (priority || dueDate || notes) {
        const updateData: UpdateIssueData = {};
        if (priority) updateData.priority = priority;
        if (dueDate) updateData.dueDate = dueDate;
        if (notes) updateData.notes = notes;
        await issuesAPI.updateIssue(issueId, updateData);
      }

      // Fetch the updated issue
      const data = await issuesAPI.getIssueById(issueId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assign issue');
    }
  }
);

export const bulkUpdateIssues = createAsyncThunk(
  'issues/bulkUpdateIssues',
  async ({ issueIds, updates }: { issueIds: string[]; updates: UpdateIssueData }, { rejectWithValue }) => {
    try {
      const data = await issuesAPI.bulkUpdateIssues({ issueIds, updates });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk update issues');
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
    clearValidationErrors: (state) => {
      state.validationErrors = null;
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
        console.log('✅ Frontend fetchIssues.fulfilled - Action payload:', action.payload);
        console.log('✅ Frontend fetchIssues.fulfilled - Payload keys:', Object.keys(action.payload || {}));
        console.log('✅ Frontend fetchIssues.fulfilled - Has issues:', !!action.payload?.issues);
        console.log('✅ Frontend fetchIssues.fulfilled - Issues count:', action.payload?.issues?.length || 0);

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

        console.log('✅ Frontend fetchIssues.fulfilled - Updated state.issues count:', state.issues.length);
        console.log('✅ Frontend fetchIssues.fulfilled - Updated state.totalIssues:', state.totalIssues);
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        console.log('❌ Frontend fetchIssues.rejected - Error:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch my issues
    builder
      .addCase(fetchMyIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyIssues.fulfilled, (state, action) => {
        console.log('✅ Frontend fetchMyIssues.fulfilled - Action payload:', action.payload);

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

        console.log('✅ Frontend fetchMyIssues.fulfilled - Updated state.issues count:', state.issues.length);
      })
      .addCase(fetchMyIssues.rejected, (state, action) => {
        console.log('❌ Frontend fetchMyIssues.rejected - Error:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch map issues
    builder
      .addCase(fetchMapIssues.pending, (state) => {
        state.mapLoading = true;
        state.error = null;
      })
      .addCase(fetchMapIssues.fulfilled, (state, action) => {
        console.log('✅ Frontend fetchMapIssues.fulfilled - Action payload:', action.payload);

        state.mapLoading = false;
        state.mapIssues = action.payload.issues.map((issue: any) => ({
          ...issue,
          _id: issue.id,
          commentsCount: issue.comments?.length || 0,
          upvotes: issue.voteScore || 0,
        }));
        state.error = null;

        console.log('✅ Frontend fetchMapIssues.fulfilled - Updated state.mapIssues count:', state.mapIssues.length);
      })
      .addCase(fetchMapIssues.rejected, (state, action) => {
        console.log('❌ Frontend fetchMapIssues.rejected - Error:', action.payload);
        state.mapLoading = false;
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
          userVote: issue.userVote || null,
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
        state.validationErrors = null;
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
        state.validationErrors = null;
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.error = payload?.message || 'Failed to create issue';

        // Handle validation errors
        if (payload?.validationErrors) {
          const validationErrors: Record<string, string> = {};
          payload.validationErrors.forEach((error: any) => {
            if (error.path) {
              validationErrors[error.path] = error.msg;
            }
          });
          state.validationErrors = validationErrors;
        } else {
          state.validationErrors = null;
        }
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
        const index = state.issues.findIndex(issue => issue._id === updatedIssue._id);
        if (index !== -1) {
          state.issues[index] = updatedIssue;
        }
        if (state.selectedIssue && state.selectedIssue._id === updatedIssue._id) {
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
        state.issues = state.issues.filter(issue => issue._id !== action.payload.issueId);
        state.totalIssues -= 1;
        if (state.selectedIssue && state.selectedIssue._id === action.payload.issueId) {
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
          const comment = action.payload.comment;
          state.selectedIssue.comments.push({
            ...comment,
            _id: comment.id,
          });
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
        console.log('✅ Vote fulfilled - action.payload:', action.payload);
        console.log('✅ Vote fulfilled - updatedIssue:', action.payload.issue);
        state.loading = false;
        const updatedIssue = action.payload.issue;
        const issueId = updatedIssue.id || updatedIssue._id;

        console.log('✅ Vote fulfilled - issueId:', issueId);
        console.log('✅ Vote fulfilled - current selectedIssue:', state.selectedIssue?._id);

        // Update the issue in the issues list
        const index = state.issues.findIndex(issue => issue._id === issueId);
        if (index !== -1) {
          state.issues[index] = {
            ...state.issues[index],
            ...updatedIssue,
            _id: updatedIssue.id || updatedIssue._id,
            upvotes: updatedIssue.votes?.upvotes?.length || 0,
            downvotes: updatedIssue.votes?.downvotes?.length || 0,
            userVote: action.payload.userVote,
          };
        }

        // Update the selected issue if it's the same
        if (state.selectedIssue && state.selectedIssue._id === issueId) {
          console.log('✅ Vote fulfilled - updating selectedIssue');
          console.log('✅ Vote fulfilled - updatedIssue.votes:', updatedIssue.votes);
          console.log('✅ Vote fulfilled - action.payload.userVote:', action.payload?.userVote);
          state.selectedIssue = {
            ...state.selectedIssue,
            title: updatedIssue.title,
            description: updatedIssue.description,
            category: updatedIssue.category,
            priority: updatedIssue.priority,
            status: updatedIssue.status,
            location: updatedIssue.location,
            media: updatedIssue.media,
            timeline: updatedIssue.timeline,
            comments: updatedIssue.comments,
            _id: updatedIssue.id || updatedIssue._id,
            upvotes: updatedIssue.votes?.upvotes?.length || 0,
            downvotes: updatedIssue.votes?.downvotes?.length || 0,
            userVote: action.payload?.userVote ?? null,
          } as any;
          console.log('✅ Vote fulfilled - new selectedIssue:', state.selectedIssue);
        }
        state.error = null;
      })
      .addCase(voteOnIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Remove vote from issue
    builder
      .addCase(removeVoteFromIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeVoteFromIssue.fulfilled, (state, action) => {
        console.log('✅ Remove vote fulfilled - action.payload:', action.payload);
        console.log('✅ Remove vote fulfilled - updatedIssue:', action.payload.issue);
        state.loading = false;
        const updatedIssue = action.payload.issue;
        const issueId = updatedIssue.id || updatedIssue._id;

        console.log('✅ Remove vote fulfilled - issueId:', issueId);
        console.log('✅ Remove vote fulfilled - current selectedIssue:', state.selectedIssue?._id);

        // Update the issue in the issues list
        const index = state.issues.findIndex(issue => issue._id === issueId);
        if (index !== -1) {
          state.issues[index] = {
            ...state.issues[index],
            ...updatedIssue,
            _id: updatedIssue.id || updatedIssue._id,
            upvotes: updatedIssue.votes?.upvotes?.length || 0,
            downvotes: updatedIssue.votes?.downvotes?.length || 0,
            userVote: action.payload.userVote,
          };
        }

        // Update the selected issue if it's the same
        if (state.selectedIssue && state.selectedIssue._id === issueId) {
          console.log('✅ Remove vote fulfilled - updating selectedIssue');
          console.log('✅ Remove vote fulfilled - updatedIssue.votes:', updatedIssue.votes);
          console.log('✅ Remove vote fulfilled - action.payload.userVote:', action.payload?.userVote);
          state.selectedIssue = {
            ...state.selectedIssue,
            title: updatedIssue.title,
            description: updatedIssue.description,
            category: updatedIssue.category,
            priority: updatedIssue.priority,
            status: updatedIssue.status,
            location: updatedIssue.location,
            media: updatedIssue.media,
            timeline: updatedIssue.timeline,
            comments: updatedIssue.comments,
            _id: updatedIssue.id || updatedIssue._id,
            upvotes: updatedIssue.votes?.upvotes?.length || 0,
            downvotes: updatedIssue.votes?.downvotes?.length || 0,
            userVote: action.payload?.userVote ?? null,
          } as any;
          console.log('✅ Remove vote fulfilled - new selectedIssue:', state.selectedIssue);
        }
        state.error = null;
      })
      .addCase(removeVoteFromIssue.rejected, (state, action) => {
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
  clearValidationErrors,
  setSelectedIssue,
  setFilters,
  clearFilters,
  setPagination,
  setMapMode,
  setLoading,
} = issueSlice.actions;

// Selectors
export const selectIssues = (state: { issues: IssueState }) => state.issues.issues;
export const selectMapIssues = (state: { issues: IssueState }) => state.issues.mapIssues;
export const selectSelectedIssue = (state: { issues: IssueState }) => state.issues.selectedIssue;
export const selectTotalIssues = (state: { issues: IssueState }) => state.issues.totalIssues;
export const selectIssuesLoading = (state: { issues: IssueState }) => state.issues.loading;
export const selectMapIssuesLoading = (state: { issues: IssueState }) => state.issues.mapLoading;
export const selectIssuesError = (state: { issues: IssueState }) => state.issues.error;
export const selectIssuesValidationErrors = (state: { issues: IssueState }) => state.issues.validationErrors;
export const selectIssuesPagination = (state: { issues: IssueState }) => state.issues.pagination;
export const selectIssuesCategories = (state: { issues: IssueState }) => state.issues.categories;
export const selectMapMode = (state: { issues: IssueState }) => state.issues.mapMode;

export default issueSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'department_head' | 'department_staff' | 'user';
  department?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  phoneNumber?: string;
  address?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  department?: string;
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  department?: string;
  isActive?: boolean;
  search?: string;
}

export interface UserState {
  users: User[];
  selectedUser: User | null;
  totalUsers: number;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Initial state
const initialState: UserState = {
  users: [],
  selectedUser: null,
  totalUsers: 0,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params: { page?: number; limit?: number; filters?: UserFilters }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.filters?.role) searchParams.append('role', params.filters.role);
      if (params.filters?.department) searchParams.append('department', params.filters.department);
      if (params.filters?.isActive !== undefined) searchParams.append('isActive', params.filters.isActive.toString());
      if (params.filters?.search) searchParams.append('search', params.filters.search);

      const response = await fetch(`/api/users?${searchParams.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch users');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch user');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create user');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, userData }: { userId: string; userData: UpdateUserData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update user');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to delete user');
      }

      return { userId };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const bulkUserOperations = createAsyncThunk(
  'users/bulkOperations',
  async (
    { operation, userIds, data }: { operation: string; userIds: string[]; data?: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ operation, userIds, data }),
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || 'Bulk operation failed');
      }

      return { operation, userIds, result };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setFilters: (state, action: PayloadAction<UserFilters>) => {
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
  },
  extraReducers: (builder) => {
    // Fetch users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data.users;
        state.totalUsers = action.payload.data.total;
        state.pagination = {
          page: action.payload.data.currentPage,
          limit: action.payload.data.limit,
          totalPages: action.payload.data.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload.data.user;
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload.data.user);
        state.totalUsers += 1;
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload.data.user;
        const index = state.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        if (state.selectedUser && state.selectedUser.id === updatedUser.id) {
          state.selectedUser = updatedUser;
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload.userId);
        state.totalUsers -= 1;
        if (state.selectedUser && state.selectedUser.id === action.payload.userId) {
          state.selectedUser = null;
        }
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk operations
    builder
      .addCase(bulkUserOperations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUserOperations.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh users list after bulk operation
        state.error = null;
      })
      .addCase(bulkUserOperations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedUser,
  setFilters,
  clearFilters,
  setPagination,
  setLoading,
} = userSlice.actions;

// Selectors
export const selectUsers = (state: { users: UserState }) => state.users.users;
export const selectSelectedUser = (state: { users: UserState }) => state.users.selectedUser;
export const selectTotalUsers = (state: { users: UserState }) => state.users.totalUsers;
export const selectUserLoading = (state: { users: UserState }) => state.users.loading;
export const selectUserError = (state: { users: UserState }) => state.users.error;
export const selectUserFilters = (state: { users: UserState }) => state.users.filters;
export const selectUserPagination = (state: { users: UserState }) => state.users.pagination;

export default userSlice.reducer;

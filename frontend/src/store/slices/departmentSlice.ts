import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface DepartmentStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  type: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  head: {
    id: string;
    name: string;
    email: string;
  };
  staff: DepartmentStaff[];
  isActive: boolean;
  statistics: {
    totalIssues: number;
    pendingIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  type: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  headId: string;
}

export interface UpdateDepartmentData {
  name?: string;
  type?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  headId?: string;
  isActive?: boolean;
}

export interface DepartmentState {
  departments: Department[];
  selectedDepartment: Department | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DepartmentState = {
  departments: [],
  selectedDepartment: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/departments', {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch departments');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  'departments/fetchDepartmentById',
  async (departmentId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch department');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (departmentData: CreateDepartmentData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(departmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create department');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ departmentId, departmentData }: { departmentId: string; departmentData: UpdateDepartmentData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(departmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update department');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async (departmentId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to delete department');
      }

      return { departmentId };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const addDepartmentStaff = createAsyncThunk(
  'departments/addStaff',
  async ({ departmentId, userId }: { departmentId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to add staff member');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const removeDepartmentStaff = createAsyncThunk(
  'departments/removeStaff',
  async ({ departmentId, userId }: { departmentId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/staff/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to remove staff member');
      }

      return { departmentId, userId };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// Department slice
const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedDepartment: (state, action: PayloadAction<Department | null>) => {
      state.selectedDepartment = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch departments
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.data.departments;
        state.error = null;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch department by ID
    builder
      .addCase(fetchDepartmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDepartment = action.payload.data.department;
        state.error = null;
      })
      .addCase(fetchDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create department
    builder
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments.push(action.payload.data.department);
        state.error = null;
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update department
    builder
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const updatedDepartment = action.payload.data.department;
        const index = state.departments.findIndex(dept => dept.id === updatedDepartment.id);
        if (index !== -1) {
          state.departments[index] = updatedDepartment;
        }
        if (state.selectedDepartment && state.selectedDepartment.id === updatedDepartment.id) {
          state.selectedDepartment = updatedDepartment;
        }
        state.error = null;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete department
    builder
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = state.departments.filter(dept => dept.id !== action.payload.departmentId);
        if (state.selectedDepartment && state.selectedDepartment.id === action.payload.departmentId) {
          state.selectedDepartment = null;
        }
        state.error = null;
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add staff
    builder
      .addCase(addDepartmentStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDepartmentStaff.fulfilled, (state, action) => {
        state.loading = false;
        const { department } = action.payload.data;
        const index = state.departments.findIndex(dept => dept.id === department.id);
        if (index !== -1) {
          state.departments[index] = department;
        }
        if (state.selectedDepartment && state.selectedDepartment.id === department.id) {
          state.selectedDepartment = department;
        }
        state.error = null;
      })
      .addCase(addDepartmentStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Remove staff
    builder
      .addCase(removeDepartmentStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeDepartmentStaff.fulfilled, (state, action) => {
        state.loading = false;
        const { departmentId, userId } = action.payload;

        // Update departments array
        const deptIndex = state.departments.findIndex(dept => dept.id === departmentId);
        if (deptIndex !== -1) {
          state.departments[deptIndex].staff = state.departments[deptIndex].staff.filter(
            staff => staff.id !== userId
          );
        }

        // Update selected department
        if (state.selectedDepartment && state.selectedDepartment.id === departmentId) {
          state.selectedDepartment.staff = state.selectedDepartment.staff.filter(
            staff => staff.id !== userId
          );
        }

        state.error = null;
      })
      .addCase(removeDepartmentStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedDepartment, setLoading } = departmentSlice.actions;

// Selectors
export const selectDepartments = (state: { departments: DepartmentState }) => state.departments.departments;
export const selectSelectedDepartment = (state: { departments: DepartmentState }) => state.departments.selectedDepartment;
export const selectDepartmentLoading = (state: { departments: DepartmentState }) => state.departments.loading;
export const selectDepartmentError = (state: { departments: DepartmentState }) => state.departments.error;

export default departmentSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';
import { setAccessToken, clearAccessToken } from '../../services/api';

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  username?: string;
  roles?: string[];
}

interface AdminState {
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  profile: null,
  loading: false,
  error: null,
};

export const adminLogin = createAsyncThunk(
  'admin/login',
  async (payload: { identifier: string; password: string }, { rejectWithValue }) => {
    try {
      // Expecting { data: { accessToken, admin } } from backend
      const res = await adminAPI.login(payload);
      const token = (res as any)?.accessToken || (res as any)?.token;
      const admin = (res as any)?.admin || null;

      if (!token) {
        throw new Error('No access token returned');
      }

      setAccessToken(token);
      return admin;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Admin login failed');
    }
  }
);

export const fetchAdminMe = createAsyncThunk(
  'admin/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getSystemOverview().catch(async () => {
        // Fallback to dedicated /admin/me if present
        try {
          const me = await (await import('../../services/api')).adminAPI.getSystemOverview();
          return me;
        } catch {
          throw new Error('Failed to fetch admin profile');
        }
      });
      // If your /admin/me returns profile directly, replace this mapping
      return (res as any)?.admin || (res as any)?.profile || null;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to load admin');
    }
  }
);

export const adminLogout = createAsyncThunk('admin/logout', async () => {
  clearAccessToken();
  return true;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action: PayloadAction<AdminProfile | null>) => {
        state.loading = false;
        state.profile = action.payload as any;
      })
      .addCase(adminLogin.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || 'Admin login failed';
      })
      .addCase(fetchAdminMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMe.fulfilled, (state, action: PayloadAction<AdminProfile | null>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchAdminMe.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load admin';
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.profile = null;
        state.error = null;
        state.loading = false;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
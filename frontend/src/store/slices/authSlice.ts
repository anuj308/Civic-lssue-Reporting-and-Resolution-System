import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { showToast } from '../../utils/toast';
import { setAccessToken, clearAccessToken } from '../../services/api';

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'department_head' | 'department_staff' | 'user';
  department?: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>; // Add field-specific errors
  needsVerification?: boolean;
  verificationEmail?: string;
  verificationPassword?: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  fieldErrors: {}, // Initialize field errors
  needsVerification: false,
  verificationEmail: undefined,
  verificationPassword: undefined,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an email verification error (HTTP 403)
        if (response.status === 403 && data.error?.needsVerification) {
          return rejectWithValue({
            message: data.message,
            needsVerification: true,
            email: credentials.email,
            password: credentials.password,
          });
        }
        return rejectWithValue(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { firstName: string; lastName: string; email: string; phoneNumber?: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          phone: userData.phoneNumber,
          password: userData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors specifically
        if (response.status === 400 && data.errors && Array.isArray(data.errors)) {
          // Map backend validation errors to field-specific errors
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((error: any) => {
            const field = error.param || error.field;
            if (field) {
              // Map backend field names to frontend field names
              let frontendField = field;
              if (field === 'name') {
                frontendField = 'firstName'; // We'll show name errors on firstName field
              } else if (field === 'phone') {
                frontendField = 'phoneNumber';
              }
              fieldErrors[frontendField] = error.msg || error.message;
            }
          });
          return rejectWithValue({
            message: data.message || 'Validation failed',
            fieldErrors,
          });
        }
        return rejectWithValue(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        return rejectWithValue('Logout failed');
      }

      return {};
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Token refresh failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to get user');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// OTP-related async thunks
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (data: { email: string; otpCode: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return rejectWithValue(responseData.message || 'OTP verification failed');
      }

      return responseData;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return rejectWithValue(responseData.message || 'Failed to resend OTP');
      }

      return responseData;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const verifyAndLogin = createAsyncThunk(
  'auth/verifyAndLogin',
  async (data: { email: string; otpCode: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/verify-and-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return rejectWithValue(responseData.message || 'Email verification and login failed');
      }

      return responseData;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const resendLoginOTP = createAsyncThunk(
  'auth/resendLoginOTP',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/resend-login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return rejectWithValue(responseData.message || 'Failed to resend login OTP');
      }

      return responseData;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {}; // Clear field errors too
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearFieldError: (state, action: PayloadAction<string>) => {
      delete state.fieldErrors[action.payload];
    },
    clearVerificationState: (state) => {
      state.needsVerification = false;
      state.verificationEmail = undefined;
      state.verificationPassword = undefined;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        // Store access token in memory instead of Redux
        setAccessToken(action.payload.data.accessToken);
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;

        // Check if email verification is required
        if (payload?.needsVerification) {
          state.needsVerification = true;
          state.verificationEmail = payload.email;
          state.verificationPassword = payload.password;
          state.error = payload.message;
        } else {
          state.error = payload as string;
          // Show toast notification for login errors
          if (payload?.needsVerification) {
            showToast.warning(payload.message);
          } else {
            showToast.handleAuthError({ response: { data: { message: payload } } });
          }
        }
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {}; // Clear field errors on new attempt
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fieldErrors = {}; // Clear field errors on success
        // Show success toast for registration
        showToast.success('Registration successful! Please check your email for verification code.');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;

        if (payload?.fieldErrors) {
          // Handle field-specific validation errors
          state.fieldErrors = payload.fieldErrors;
          state.error = payload.message || 'Please correct the errors below';
        } else {
          // Handle general errors
          state.error = payload as string;
          state.fieldErrors = {};
        }

        // Show error toast for registration failures (only for non-field errors)
        if (!payload?.fieldErrors) {
          showToast.handleValidationErrors({ response: { data: { message: payload } } });
        }
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        // Clear access token from memory
        clearAccessToken();
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Still logout on error
        state.isAuthenticated = false;
        state.user = null;
        clearAccessToken();
      });

    // Refresh token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        // Store refreshed access token in memory
        setAccessToken(action.payload.data.accessToken);
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        clearAccessToken();
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        clearAccessToken();
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        // Store access token in memory
        setAccessToken(action.payload.data.accessToken);
        state.error = null;
        showToast.success('Account verified successfully! Welcome aboard!');
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        showToast.handleOTPError({ response: { data: { message: action.payload } } });
      });

    // Resend OTP
    builder
      .addCase(resendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        showToast.success('Verification code sent to your email!');
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        showToast.handleOTPError({ response: { data: { message: action.payload } } });
      });

    // Verify and Login
    builder
      .addCase(verifyAndLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAndLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        // Store access token in memory
        setAccessToken(action.payload.data.accessToken);
        state.error = null;
        showToast.success('Email verified! Login successful!');
      })
      .addCase(verifyAndLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        showToast.handleOTPError({ response: { data: { message: action.payload } } });
      });

    // Resend Login OTP
    builder
      .addCase(resendLoginOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendLoginOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        showToast.success('Verification code sent to your email!');
      })
      .addCase(resendLoginOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        showToast.handleOTPError({ response: { data: { message: action.payload } } });
      });
  },
});

export const { clearError, updateUser, setLoading, clearFieldError, clearVerificationState } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user; // Alias for selectUser
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectFieldErrors = (state: { auth: AuthState }) => state.auth.fieldErrors;

export default authSlice.reducer;

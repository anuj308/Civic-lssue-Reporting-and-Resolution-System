import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi } from '../../services/api';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  isVerified: boolean;
  avatar?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isFirstTime: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isFirstTime: true,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (token && refreshToken) {
        // You can add token validation here if needed
        return { token, refreshToken };
      }
      
      return null;
    } catch (error: any) {
      return rejectWithValue('Failed to initialize auth');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔥 Redux login: Starting login with credentials for:', credentials.email);
      const response = await authApi.login(credentials);
      console.log('📥 Redux login: Raw response:', response.data);
      
      const { accessToken, refreshToken, user } = response.data.data;
      console.log('🔍 Redux login: Extracted data:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUser: !!user,
        userName: user?.name,
        userEmail: user?.email
      });
      
      if (!accessToken) {
        console.error('❌ Redux login: Missing accessToken in response');
        throw new Error('Missing access token in server response');
      }
      
      if (!refreshToken) {
        console.error('❌ Redux login: Missing refreshToken in response');
        throw new Error('Missing refresh token in server response');
      }
      
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      console.log('✅ Redux login: Tokens saved to AsyncStorage successfully');
      
      return {
        user,
        token: accessToken,
        refreshToken: refreshToken
      };
    } catch (error: any) {
      console.error('❌ Redux login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Check if it's an email verification error (HTTP 403)
      if (error.response?.status === 403 && error.response?.data?.error?.needsVerification) {
        console.log('📧 Login failed: Email verification required');
        return rejectWithValue(error.response.data.message + ' (EMAIL_NOT_VERIFIED)');
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; phone: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔥 Redux: Starting registration with data:', userData);
      const response = await authApi.register(userData);
      console.log('✅ Redux: Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Redux: Registration failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: { firstName: string; lastName: string; email: string; phoneNumber: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔥 Redux: Starting registerUser with data:', userData);
      const response = await authApi.register({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        phone: userData.phoneNumber,
        password: userData.password,
      });
      console.log('✅ Redux: RegisterUser successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Redux: RegisterUser failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (data: { email: string; phoneNumber: string; otp: string }, { rejectWithValue }) => {
    try {
      console.log('🔥 Redux verifyOTP: Input data:', data);
      const apiPayload = {
        email: data.email,
        otpCode: data.otp,
      };
      console.log('🔥 Redux verifyOTP: API payload:', apiPayload);
      
      const response = await authApi.verifyOTP(apiPayload);
      console.log('✅ Redux verifyOTP: Full response:', response.data);
      
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (!accessToken || !refreshToken) {
        console.error('❌ Missing tokens in response:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
        throw new Error('Missing authentication tokens in response');
      }
      
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      console.log('✅ Tokens saved to AsyncStorage successfully');
      
      return {
        user,
        token: accessToken,
        refreshToken: refreshToken
      };
    } catch (error: any) {
      console.error('❌ Redux verifyOTP error:', error);
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (data: { email: string; phoneNumber: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.resendOTP({
        email: data.email,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
    }
  }
);

export const resendLoginOTP = createAsyncThunk(
  'auth/resendLoginOTP',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux resendLoginOTP: Input data:', data);
      
      const response = await authApi.resendLoginOTP({
        email: data.email,
      });
      
      console.log('✅ Redux resendLoginOTP: Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Redux resendLoginOTP error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to resend login OTP');
    }
  }
);

export const verifyAndLogin = createAsyncThunk(
  'auth/verifyAndLogin',
  async (data: { email: string; otpCode: string; password?: string }, { rejectWithValue }) => {
    try {
      console.log('🔥 Redux verifyAndLogin: Input data:', data);
      
      const response = await authApi.verifyAndLogin({
        email: data.email,
        otpCode: data.otpCode,
        password: data.password,
      });
      
      console.log('✅ Redux verifyAndLogin: Full response:', response.data);
      
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (!accessToken || !refreshToken) {
        console.error('❌ Missing tokens in response:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
        throw new Error('Missing authentication tokens in response');
      }
      
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      console.log('✅ Tokens saved to AsyncStorage successfully');
      
      return {
        user,
        token: accessToken,
        refreshToken: refreshToken
      };
    } catch (error: any) {
      console.error('❌ Redux verifyAndLogin error:', error);
      return rejectWithValue(error.response?.data?.message || 'Email verification and login failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const response = await authApi.refreshToken(state.auth.refreshToken!);
      await AsyncStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (state.auth.token) {
        await authApi.logout();
      }
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
    } catch (error) {
      // Even if logout fails on server, clear local storage
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🗑️ Redux deleteAccount: Starting account deletion');
      await authApi.deleteAccount();
      console.log('✅ Redux deleteAccount: Account deleted successfully on server');
      
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
      console.log('✅ Redux deleteAccount: Local tokens cleared');
      
      return true;
    } catch (error: any) {
      console.error('❌ Redux deleteAccount error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLoading: (state) => {
      state.isLoading = false;
    },
    setFirstTime: (state, action: PayloadAction<boolean>) => {
      state.isFirstTime = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
          // Note: user data will be fetched separately if needed
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register User
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend OTP
    builder
      .addCase(resendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend Login OTP
    builder
      .addCase(resendLoginOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendLoginOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendLoginOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify and Login (for login email verification flow)
    builder
      .addCase(verifyAndLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyAndLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(verifyAndLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
    });

    // Delete Account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearLoading, setFirstTime, updateUser } = authSlice.actions;
export default authSlice.reducer;

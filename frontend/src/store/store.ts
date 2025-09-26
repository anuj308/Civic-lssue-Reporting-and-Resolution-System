import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer, { getCurrentUser } from './slices/authSlice';
import userReducer from './slices/userSlice';
import issueReducer from './slices/issueSlice';
import departmentReducer from './slices/departmentSlice';
import analyticsReducer from './slices/analyticsSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import adminReducer from './slices/adminSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui state
};

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  users: userReducer,
  issues: issueReducer,
  departments: departmentReducer,
  analytics: analyticsReducer,
  notifications: notificationReducer,
  ui: uiReducer,
  admin: adminReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    issues: issueReducer,
    departments: departmentReducer,
    analytics: analyticsReducer,
    notifications: notificationReducer,
    ui: uiReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Persistor
export const persistor = persistStore(store);

// Authentication validation on rehydration
persistor.subscribe(() => {
  const state = store.getState();

  // If auth state was rehydrated but we don't have a user, try to validate
  if (state.auth.isAuthenticated && !state.auth.user && !state.auth.loading) {
    console.log('🔄 Store: Auth state rehydrated, validation needed on next render');
    // The ProtectedRoute component will handle validation by calling getCurrentUser
  }
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

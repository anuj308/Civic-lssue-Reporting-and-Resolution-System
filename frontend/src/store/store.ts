import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import issueReducer from './slices/issueSlice';
import departmentReducer from './slices/departmentSlice';
import analyticsReducer from './slices/analyticsSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

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
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
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

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

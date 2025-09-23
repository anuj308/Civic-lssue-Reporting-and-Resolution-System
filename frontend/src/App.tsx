import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useSelector } from 'react-redux';

import { store, persistor } from './store/store';
import theme from './theme/theme';
import { selectUser } from './store/slices/authSlice';

// Auth Components
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Layout Components
import Layout from './components/Layout/Layout';

// Page Components
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/Users/UserManagement';
import IssueManagement from './pages/Issues/IssueManagement';

// User Pages
import UserDashboard from './pages/User/UserDashboard';
import MyIssues from './pages/User/MyIssues';
import ReportIssue from './pages/User/ReportIssue';
import IssueDetail from './pages/User/IssueDetail';
import Map from './pages/User/Map';
import Profile from './pages/User/Profile';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* All Routes - components will handle permissions */}
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="my-issues" element={<MyIssues />} />
        <Route path="issue/:id" element={<IssueDetail />} />
        <Route path="report-issue" element={<ReportIssue />} />
        <Route path="map" element={<Map />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="issues" element={<IssueManagement />} />
        
        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <AppRoutes />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </ThemeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </Router>
  );
};

export default App;

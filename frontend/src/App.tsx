import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { store, persistor } from './store/store';
import theme from './theme/theme';

// Auth Components
import Login from './pages/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Layout Components
import Layout from './components/Layout/Layout';

// Page Components
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/Users/UserManagement';
import IssueManagement from './pages/Issues/IssueManagement';

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

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          {/* Dashboard */}
                          <Route path="/dashboard" element={<Dashboard />} />
                          
                          {/* User Management */}
                          <Route path="/users" element={<UserManagement />} />
                          
                          {/* Issue Management */}
                          <Route path="/issues" element={<IssueManagement />} />
                          
                          {/* Default redirect */}
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          
                          {/* Catch all - redirect to dashboard */}
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
            
            {/* React Query DevTools - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Import theme and store
import { theme } from './theme/theme';
import { store } from './store/store';

// Import components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Import pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import IssueList from './pages/Issues/IssueList';
import IssueDetail from './pages/Issues/IssueDetail';
import IssueMap from './pages/Issues/IssueMap';
import Analytics from './pages/Analytics/Analytics';
import UserManagement from './pages/Users/UserManagement';
import DepartmentManagement from './pages/Departments/DepartmentManagement';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound/NotFound';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="issues" element={<IssueList />} />
                  <Route path="issues/:id" element={<IssueDetail />} />
                  <Route path="map" element={<IssueMap />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="departments" element={<DepartmentManagement />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                
                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </Box>
          
          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#4CAF50',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#F44336',
                },
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;

import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress, Typography } from "@mui/material";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

import { store, persistor } from "./store/store";
import theme from "./theme/theme";
import { selectUser } from "./store/slices/authSlice";

// Auth Components
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import OTPVerification from "./pages/Auth/OTPVerification";
import ResetPassword from "./pages/Auth/ResetPassword";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

// Admin Components
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import DepartmentList from "./pages/Departments/DepartmentList";
import AdminProtectedRoute from "./components/Auth/AdminProtectedRoute";

// Layout Components
import Layout from "./components/Layout/Layout";

// Lazy load page components for code splitting
const IssueManagement = React.lazy(() => import("./pages/Issues/IssueManagement"));
const IssueReels = React.lazy(() => import("./pages/Issues/IssueReels"));
const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));
const MyIssues = React.lazy(() => import("./pages/User/MyIssues"));
const ReportIssue = React.lazy(() => import("./pages/User/ReportIssue"));
const IssueDetail = React.lazy(() => import("./pages/User/IssueDetail"));
const Map = React.lazy(() => import("./pages/User/Map"));
const Profile = React.lazy(() => import("./pages/User/Profile"));
const DepartmentLeaderboard = React.lazy(() => import("./pages/Departments/DepartmentLeaderboard"));
const CommunityEvents = React.lazy(() => import("./pages/Community/CommunityEvents"));

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
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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
        <Route path="issues" element={<IssueManagement />} />
        <Route path="reels" element={<IssueReels />} />
        <Route path="departments" element={<DepartmentLeaderboard />} />
        <Route path="community-events" element={<CommunityEvents />} />

        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <AdminProtectedRoute>
            <DepartmentList />
          </AdminProtectedRoute>
        }
      />

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
        <PersistGate
          loading={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                gap: 2,
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Loading application...
              </Typography>
            </Box>
          }
          persistor={persistor}
          onBeforeLift={() => {
            console.log('Redux state rehydrated successfully');
          }}
        >
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
              <AppRoutes />
              {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </ThemeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </Router>
  );
};

const AppWithSuspense: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Loading page...
          </Typography>
        </Box>
      }
    >
      <App />
    </Suspense>
  );
};

export default AppWithSuspense;

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { selectAuth, getCurrentUser } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/login',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector(selectAuth);

  // Try to get current user if we don't have user data but have authentication
  useEffect(() => {
    if (isAuthenticated && !user && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, user, loading]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
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
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role permissions if required roles are specified
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            px: 3,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have the required permissions to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Required roles: {requiredRoles.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your role: {user.role}
          </Typography>
        </Box>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;

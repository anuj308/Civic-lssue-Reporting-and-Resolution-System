import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../store/auth.jsx';
import Spinner from './Spinner';

const AdminProtectedRoute = ({ children }) => {
  const { token, loading } = useAdminAuth() || {};
  if (loading) return <Spinner className="h-screen" />;
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

export default AdminProtectedRoute;
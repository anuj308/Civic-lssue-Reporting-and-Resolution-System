import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDeptAuth } from '../store/auth.jsx';
import Spinner from './Spinner';

const DepartmentProtectedRoute = ({ children }) => {
  const { token, loading } = useDeptAuth() || {};
  if (loading) return <Spinner className="h-screen" />;
  if (!token) return <Navigate to="/department/login" replace />;
  return children;
};

export default DepartmentProtectedRoute;
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getDeptToken } from '../services/api';

const DepartmentProtectedRoute = ({ children }) => {
  const token = getDeptToken();
  if (!token) return <Navigate to="/department/login" replace />;
  return children;
};

export default DepartmentProtectedRoute;
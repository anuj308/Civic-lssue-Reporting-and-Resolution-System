import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

type RootState = { admin: { profile: any } };

const AdminProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const admin = useSelector((s: RootState) => s.admin.profile);
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

export default AdminProtectedRoute;
import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import DepartmentProtectedRoute from './components/DepartmentProtectedRoute';

import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import DepartmentLogin from './pages/Department/Login';
import DepartmentDashboard from './pages/Department/Dashboard';

import './App.css'

const App = () => {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/admin/login" style={{ marginRight: 12 }}>Admin</Link>
        <Link to="/department/login">Department</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route path="/department/login" element={<DepartmentLogin />} />
        <Route
          path="/department"
          element={
            <DepartmentProtectedRoute>
              <DepartmentDashboard />
            </DepartmentProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App

import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import DepartmentProtectedRoute from './components/DepartmentProtectedRoute';
import Spinner from './components/Spinner';
import { useAdminAuth, useDeptAuth } from './store/auth.jsx';

import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import DepartmentAuth from './pages/Department/deptAuth.jsx';
import DepartmentDashboard from './pages/Department/Dashboard';

const LoginGuards = ({ children, role }) => {
  const { token: admin } = useAdminAuth() || {};
  const { token: dept } = useDeptAuth() || {};
  if (role === 'admin' && admin) return <Navigate to="/admin" replace />;
  if (role === 'dept' && dept) return <Navigate to="/department" replace />;
  return children;
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-slate-600 mt-1">Page not found</p>
      <div className="mt-4 flex gap-3 justify-center">
        <Link className="text-indigo-600 hover:text-indigo-700" to="/admin/login">Admin Login</Link>
        <Link className="text-indigo-600 hover:text-indigo-700" to="/department/login">Department Login</Link>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <div>
      <nav className="px-4 py-2 border-b border-slate-200 bg-white sticky top-0 z-10 flex gap-4">
        <Link to="/admin/login" className="text-slate-700 hover:text-slate-900">Admin</Link>
        <Link to="/department/login" className="text-slate-700 hover:text-slate-900">Department</Link>
      </nav>

      <Suspense fallback={<Spinner className="h-40" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          <Route
            path="/admin/login"
            element={
              <LoginGuards role="admin">
                <AdminLogin />
              </LoginGuards>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/department/login"
            element={
              <LoginGuards role="dept">
                <DepartmentAuth />
              </LoginGuards>
            }
          />
          <Route
            path="/department"
            element={
              <DepartmentProtectedRoute>
                <DepartmentDashboard />
              </DepartmentProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;

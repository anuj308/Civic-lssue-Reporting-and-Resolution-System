import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Spinner from './components/Spinner';
import AdminDashboard from './pages/Admin/Dashboard.jsx';
import DepartmentDashboard from './pages/Department/Dashboard.jsx';

// Protected Route Components
const ProtectedRoute = ({ children, token, redirectTo }) => {
  if (!token) return <Navigate to={redirectTo} replace />;
  return children;
};

const PublicRoute = ({ children, token, redirectTo }) => {
  if (token) return <Navigate to={redirectTo} replace />;
  return children;
};

const App = () => {

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex gap-8">
              <Link 
                to="/admin/" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Admin Portal
              </Link>
              <Link 
                to="/department/" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Department Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Routes with Loading Fallback */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8" />
        </div>
      }>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* Admin routes */}
          <Route path="/admin/*" element={
            <Routes>
              {/* <Route path="login" element={
                  <AdminLogin />
              } /> */}
              <Route path="/" element={
                  <AdminDashboard />
              } />
            </Routes>
          } />

          {/* Department routes */}
          <Route path="/department/*" element={
            <Routes>
              {/* <Route path="login" element={
                  <DepartmentAuth />
              } /> */}
              <Route path="/" element={
                  <DepartmentDashboard />
              } />
            </Routes>
          } />

          {/* 404 Page */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-900">404</h1>
                <p className="mt-2 text-slate-600">Page not found</p>
                <div className="mt-6 space-x-4">
                  <Link 
                    to="/admin/login" 
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Admin Login
                  </Link>
                  <Link 
                    to="/department/login" 
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Department Login
                  </Link>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;

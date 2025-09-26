import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../store/auth.jsx';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { profile, logout } = useAdminAuth() || {};
  const [departments, setDepartments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [deptData, issueData] = await Promise.allSettled([
          adminAPI.listDepartments({ page: 1, limit: 10 }),
          adminAPI.listIssues ? adminAPI.listIssues({ page: 1, limit: 10 }) : Promise.resolve([])
        ]);
        
        if (deptData.status === 'fulfilled') {
          setDepartments(Array.isArray(deptData.value) ? deptData.value : deptData.value?.items || []);
        }
        if (issueData.status === 'fulfilled') {
          setIssues(Array.isArray(issueData.value) ? issueData.value : issueData.value?.items || []);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back{profile?.name ? `, ${profile.name}` : ''}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/department/login" 
                className="text-slate-600 hover:text-slate-900"
              >
                Switch to Department
              </Link>
              <button
                onClick={logout}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Departments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Departments</h2>
              <p className="text-slate-600 text-sm mt-1">Manage government departments</p>
            </div>
            <div className="p-6">
              {departments.length > 0 ? (
                <div className="space-y-3">
                  {departments.slice(0, 5).map((dept) => (
                    <div key={dept._id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                      <div>
                        <h3 className="font-medium text-slate-900">{dept.name}</h3>
                        <p className="text-sm text-slate-600">{dept.code}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        dept.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                  {departments.length > 5 && (
                    <p className="text-sm text-slate-500 text-center pt-3">
                      +{departments.length - 5} more departments
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No departments found</p>
              )}
            </div>
          </div>

          {/* Recent Issues Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Issues</h2>
              <p className="text-slate-600 text-sm mt-1">Latest citizen reports</p>
            </div>
            <div className="p-6">
              {issues.length > 0 ? (
                <div className="space-y-3">
                  {issues.slice(0, 5).map((issue) => (
                    <div key={issue._id} className="flex items-start justify-between py-3 border-b border-slate-100 last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{issue.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{issue.category}</p>
                      </div>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                        issue.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : issue.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                  ))}
                  {issues.length > 5 && (
                    <p className="text-sm text-slate-500 text-center pt-3">
                      +{issues.length - 5} more issues
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No issues found</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{departments.length}</div>
              <div className="text-slate-600 text-sm mt-1">Total Departments</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{issues.filter(i => i.status === 'resolved').length}</div>
              <div className="text-slate-600 text-sm mt-1">Resolved Issues</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{issues.filter(i => i.status === 'pending').length}</div>
              <div className="text-slate-600 text-sm mt-1">Pending Issues</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
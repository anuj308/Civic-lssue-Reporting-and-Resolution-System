import React, { useEffect, useState } from 'react';
import { departmentAPI } from '../../services/api';
import { useDeptAuth } from '../../store/auth.jsx';
import { Link } from 'react-router-dom';

const DepartmentDashboard = () => {
  const { profile, logout } = useDeptAuth() || {};
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setLoading(true);
        const data = await departmentAPI.myIssues({ status: 'pending', limit: 20 });
        setIssues(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        setError(err?.message || 'Failed to load issues');
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
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
              <h1 className="text-2xl font-bold text-slate-900">Department Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back{profile?.name ? `, ${profile.name}` : ''}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/login" 
                className="text-slate-600 hover:text-slate-900"
              >
                Switch to Admin
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Assigned Issues</h2>
            <p className="text-slate-600 text-sm mt-1">Issues assigned to your department</p>
          </div>
          <div className="p-6">
            {issues.length > 0 ? (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue._id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900">{issue.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">{issue.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span>Category: {issue.category}</span>
                          <span>Priority: {issue.priority}</span>
                          {issue.location?.address && (
                            <span>Location: {issue.location.address}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          issue.status === 'resolved' 
                            ? 'bg-green-100 text-green-800'
                            : issue.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {issue.status}
                        </span>
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-slate-500 font-medium">No issues assigned</h3>
                <p className="text-slate-400 text-sm mt-1">New issues will appear here when assigned to your department</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-700">{issues.length}</div>
              <div className="text-slate-600 text-sm mt-1">Total Assigned</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{issues.filter(i => i.status === 'pending').length}</div>
              <div className="text-slate-600 text-sm mt-1">Pending</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{issues.filter(i => i.status === 'in_progress').length}</div>
              <div className="text-slate-600 text-sm mt-1">In Progress</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{issues.filter(i => i.status === 'resolved').length}</div>
              <div className="text-slate-600 text-sm mt-1">Resolved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
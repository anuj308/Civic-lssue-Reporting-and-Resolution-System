import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../store/auth.jsx';
import { mockDepartments, mockIssues, mockStats } from '../../services/mockData';

const AdminDashboard = () => {
  const { profile, logout } = useAdminAuth() || {};
  const [departments, setDepartments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modified useEffect to use mock data
  useEffect(() => {
    setDepartments(mockDepartments);
    setIssues(mockIssues);
    setLoading(false);
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
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {{
            label: 'Total Issues',
            value: mockStats.totalIssues,
            color: 'indigo'
          },
          {
            label: 'Resolved',
            value: mockStats.resolvedIssues,
            color: 'green'
          },
          {
            label: 'In Progress',
            value: mockStats.inProgressIssues,
            color: 'yellow'
          },
          {
            label: 'Pending',
            value: mockStats.pendingIssues,
            color: 'red'
          }
          }.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="text-center">
                <div className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                <div className="text-slate-600 mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Issues by Category</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(mockStats.issuesByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center">
                    <div className="w-32 text-sm text-slate-600 capitalize">{category}</div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${(count / mockStats.totalIssues) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm text-slate-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockStats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      activity.newStatus === 'resolved' ? 'bg-green-500' :
                      activity.newStatus === 'in_progress' ? 'bg-yellow-500' :
                      'bg-slate-500'
                    }`} />
                    <div>
                      <p className="text-sm text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Status changed from {activity.oldStatus} to {activity.newStatus}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Latest Issues Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Latest Issues</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reported</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Votes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {issues.map(issue => (
                  <tr key={issue._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{issue.title}</div>
                      <div className="text-sm text-slate-500">{issue.location.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{issue.department.name}</div>
                      <div className="text-xs text-slate-500">{issue.department.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">↑{issue.votes.up}</span>
                        <span className="text-red-600">↓{issue.votes.down}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
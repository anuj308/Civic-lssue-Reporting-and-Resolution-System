import React, { useEffect, useState } from 'react';
import { departmentAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { mockDepartmentIssues, issueCategories, timelineEventTypes } from '../../services/mockData';

const DepartmentDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Try to fetch real data
        const data = await departmentAPI.myIssues({ status: 'pending', limit: 20 });
        setIssues(Array.isArray(data) ? data : data?.items || []);
        setUsingMockData(false);

      } catch (err) {
        console.warn('Failed to fetch real data, using mock data:', err);
        // Fallback to mock data
        setIssues(mockDepartmentIssues);
        setUsingMockData(true);
        setError('Using demo data - Backend not available');
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, []);

  const renderIssueCard = (issue) => (
    <div key={issue._id} 
      className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {issueCategories[issue.category]?.icon || '📋'}
              </span>
              <h3 className="font-medium text-slate-900">{issue.title}</h3>
            </div>
            <p className="text-slate-600 text-sm mt-2">{issue.description}</p>
            
            {/* Timeline */}
            {issue.timeline && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex gap-2 overflow-x-auto">
                  {issue.timeline.map((event, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <span>{timelineEventTypes[event.status]?.icon}</span>
                      <span className="text-slate-600">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags and Metadata */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`px-2 py-1 text-xs rounded-full 
                ${issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                  issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-slate-100 text-slate-600'}`}>
                {issue.priority}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                {issue.location?.address}
              </span>
              {issue.votes && (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  👍 {issue.votes.up}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4 flex flex-col items-end gap-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full
              ${issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-slate-100 text-slate-600'}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <div className="flex gap-2">
              <button className="text-slate-600 hover:text-slate-900">
                <span className="sr-only">View Photos</span>
                📷
              </button>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
            <p className="text-slate-600 mt-1">
              Welcome back!
              {usingMockData && (
                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Demo Mode
                </span>
              )}
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/login" 
              className="text-slate-600 hover:text-slate-900"
            >
              Switch to Admin
            </Link>
            <button
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[{
            label: 'Total Assigned',
            value: issues.length,
            icon: '📋',
            color: 'slate'
          },
          {
            label: 'High Priority',
            value: issues.filter(i => i.priority === 'high').length,
            icon: '🚨',
            color: 'red'
          },
          {
            label: 'In Progress',
            value: issues.filter(i => i.status === 'in_progress').length,
            icon: '🚧',
            color: 'yellow'
          },
          {
            label: 'Resolved Today',
            value: issues.filter(i => 
              i.status === 'resolved' && 
              new Date(i.updatedAt).toDateString() === new Date().toDateString()
            ).length,
            icon: '✅',
            color: 'green'
          }
        ].map(stat => (
          <div key={stat.label} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className={`text-2xl font-bold text-${stat.color}-600`}>
                  {stat.value}
                </div>
                <div className="text-slate-600 text-sm">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Issues List with Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assigned Issues</h2>
              <p className="text-slate-600 text-sm mt-1">
                Manage and track department issues
                {usingMockData && ' (Demo Data)'}
              </p>
            </div>
            <div className="flex gap-4">
              <select className="rounded-lg border border-slate-200 text-sm">
                <option>All Categories</option>
                {Object.entries(issueCategories).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
              <select className="rounded-lg border border-slate-200 text-sm">
                <option>All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {issues.length > 0 ? (
            <div className="grid gap-4">
              {issues.map(renderIssueCard)}
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
    </div>
  </div>
  );
};

export default DepartmentDashboard;
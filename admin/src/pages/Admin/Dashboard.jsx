import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { mockDepartments, mockIssues, mockStats } from '../../services/mockData';
import { Line, Bar } from 'react-chartjs-2';
import { FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  // Initialize with proper structure matching mockStats
  const [stats, setStats] = useState(mockStats); // Use mockStats as initial state
  const [departments, setDepartments] = useState(mockDepartments);
  const [issues, setIssues] = useState(mockIssues);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingMockData, setUsingMockData] = useState(true);

  // Add refs for charts
  const resolutionTimeChartRef = useRef(null);
  const departmentPerformanceChartRef = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // For now, just use mock data
        setIssues(mockIssues);
        setDepartments(mockDepartments);
        setStats(mockStats);
        setUsingMockData(true);

      } catch (err) {
        console.warn('Failed to fetch data from backend:', err);
        setError('Using demo data - Backend not available');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderTrendCard = (title, value, change, icon) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
      </div>
    </div>
  );

  // Add safe checks for department insights rendering
  const renderDepartmentInsights = () => {
    if (!stats?.departmentInsights?.length) {
      return (
        <div className="col-span-full text-center py-8 text-slate-400">
          No department insights available
        </div>
      );
    }

    return stats.departmentInsights.map(dept => (
      <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{dept.name}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            dept?.stats?.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {dept?.stats?.trend === 'up' ? '↑' : '↓'} Performance
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Active Issues</span>
            <span className="font-medium">{dept?.stats?.activeIssues || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Avg Response</span>
            <span className="font-medium">{dept?.stats?.avgResponseTime || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Satisfaction</span>
            <span className="font-medium">{dept?.stats?.satisfaction || 0}%</span>
          </div>
          <div className="pt-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Efficiency Score</span>
              <span>{dept?.performance?.efficiency || 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${dept?.performance?.efficiency || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    ));
  };

  // Modify the renderCharts function
  const renderCharts = () => {
    const hasResolutionTimes = stats?.issueBreakdown?.trends?.resolutionTimes?.length > 0;
    const hasDepartmentInsights = stats?.departmentInsights?.length > 0;

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Resolution Time Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Resolution Time Trends</h3>
          <div className="h-[300px]"> {/* Fixed height container */}
            {hasResolutionTimes ? (
              <Line
                ref={resolutionTimeChartRef}
                id="resolution-time-chart" // Add unique ID
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                  datasets: [{
                    label: 'Avg. Resolution Time (days)',
                    data: stats.issueBreakdown.trends.resolutionTimes,
                    borderColor: '#6366f1',
                    tension: 0.4
                  }]
                }}
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Department Performance</h3>
          <div className="h-[300px]"> {/* Fixed height container */}
            {hasDepartmentInsights ? (
              <Bar
                ref={departmentPerformanceChartRef}
                id="department-performance-chart" // Add unique ID
                data={{
                  labels: stats.departmentInsights.map(d => d.name),
                  datasets: [{
                    label: 'Efficiency Score',
                    data: stats.departmentInsights.map(d => d.performance.efficiency),
                    backgroundColor: '#6366f1'
                  }]
                }}
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No department data available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add cleanup effect for charts
  useEffect(() => {
    return () => {
      // Cleanup charts on component unmount
      if (resolutionTimeChartRef.current) {
        resolutionTimeChartRef.current.destroy();
      }
      if (departmentPerformanceChartRef.current) {
        departmentPerformanceChartRef.current.destroy();
      }
    };
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
                to="/department/login" 
                className="text-slate-600 hover:text-slate-900"
              >
                Switch to Department
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
        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderTrendCard(
            'Total Active Issues',
            stats?.issueBreakdown?.thisMonth?.total || 0,
            8,
            <FiAlertTriangle className="w-6 h-6 text-amber-500" />
          )}
          {renderTrendCard(
            'Resolved Issues',
            stats?.resolvedIssues || 0,
            stats?.resolvedIssuesChange || 0,
            <FiCheckCircle className="w-6 h-6 text-green-500" />
          )}
          {renderTrendCard(
            'Issues in Progress',
            stats?.inProgressIssues || 0,
            stats?.inProgressIssuesChange || 0,
            <FiTrendingUp className="w-6 h-6 text-blue-500" />
          )}
          {renderTrendCard(
            'Pending Issues',
            stats?.pendingIssues || 0,
            stats?.pendingIssuesChange || 0,
            <FiTrendingDown className="w-6 h-6 text-red-500" />
          )}
        </div>

        {/* Charts Section */}
        {renderCharts()}

        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {renderDepartmentInsights()}
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
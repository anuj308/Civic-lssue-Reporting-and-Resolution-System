import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Dashboard</h2>
      <ul>
        <li><Link to="/admin/departments">Manage Departments</Link></li>
        <li><Link to="/admin/users">Manage Users</Link></li>
        <li><Link to="/admin/logs">System Logs</Link></li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
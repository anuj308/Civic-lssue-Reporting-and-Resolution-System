import React, { useEffect, useState } from 'react';
import { adminAPI, clearAdminToken } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.me()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    adminAPI.listDepartments({ page: 1, limit: 25 })
      .then((list) => setDepartments(Array.isArray(list) ? list : (list?.items || [])))
      .catch((e) => setError(e?.message || 'Failed to load departments'));
  }, []);

  const logout = () => {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Dashboard</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={logout}>Logout</button>
      </div>
      <p>Welcome{me?.name ? `, ${me.name}` : ''}.</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <h3>Departments</h3>
      <ul>
        {departments.map((d) => (
          <li key={d._id}>
            <strong>{d.name}</strong> ({d.code}) — {d.isActive ? 'Active' : 'Inactive'}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 16 }}>
        Switch to <Link to="/department/login">Department Portal</Link>
      </p>
    </div>
  );
};

export default AdminDashboard;
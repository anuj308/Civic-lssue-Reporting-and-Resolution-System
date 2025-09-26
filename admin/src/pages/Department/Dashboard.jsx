import React, { useEffect, useState } from 'react';
import { departmentAuthAPI, departmentAPI, clearDeptToken } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const DepartmentDashboard = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    departmentAuthAPI.me()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    departmentAPI.myIssues({ status: 'pending', limit: 20 })
      .then((list) => setIssues(Array.isArray(list) ? list : (list?.items || [])))
      .catch((e) => setError(e?.message || 'Failed to load issues'));
  }, []);

  const logout = () => {
    clearDeptToken();
    navigate('/department/login', { replace: true });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Department Dashboard</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={logout}>Logout</button>
      </div>
      <p>Welcome{me?.name ? `, ${me.name}` : ''}.</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <h3>Pending Issues</h3>
      <ul>
        {issues.map((i) => (
          <li key={i._id}>
            <strong>{i.title}</strong> — {i.status} — {i.priority}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DepartmentDashboard;
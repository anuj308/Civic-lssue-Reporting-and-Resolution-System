import React, { useState } from 'react';
import { adminAPI, setAdminToken } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.login({ identifier, password });
      const token = res?.accessToken || res?.token;
      if (!token) throw new Error('No access token returned');
      setAdminToken(token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '64px auto' }}>
      <h2>Admin Login</h2>
      <form onSubmit={submit}>
        <label>Identifier (email or username)</label>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <p style={{ marginTop: 12 }}>
        Department? <Link to="/department/login">Go to Department Login</Link>
      </p>
    </div>
  );
};

export default AdminLogin;
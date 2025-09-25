import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '../../store/slices/adminSlice';
import { useNavigate } from 'react-router-dom';

type RootState = { admin: { loading: boolean; error: string | null } };

const AdminLogin: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s: RootState) => s.admin);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(adminLogin({ identifier, password }));
    if (adminLogin.fulfilled.match(res)) {
      navigate('/admin');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '64px auto' }}>
      <h2>Admin Login</h2>
      <form onSubmit={onSubmit}>
        <label>Identifier (email or username)</label>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
};

export default AdminLogin;
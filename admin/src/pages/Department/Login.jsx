import React, { useState } from 'react';
import { departmentAuthAPI, setDeptToken } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const DepartmentLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);

  // Register fields (temporary)
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await departmentAuthAPI.login({ identifier, password });
      const token = res?.accessToken || res?.token;
      if (!token) throw new Error('No access token returned');
      setDeptToken(token);
      navigate('/department', { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!departmentAuthAPI.register) {
        throw new Error('Department registration is not enabled on the server');
      }
      if (regPassword !== confirm) throw new Error('Passwords do not match');

      await departmentAuthAPI.register({ name, email, password: regPassword });

      // Auto-login using email
      const res = await departmentAuthAPI.login({ identifier: email, password: regPassword });
      const token = res?.accessToken || res?.token;
      if (!token) {
        setMode('login');
        setIdentifier(email);
        setPassword('');
        return;
      }
      setDeptToken(token);
      navigate('/department', { replace: true });
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Department Portal</h1>
          <p className="text-slate-600 text-sm mt-1">Sign in to manage assigned issues</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`w-1/2 py-3 text-sm font-medium border-b ${
                mode === 'login'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`w-1/2 py-3 text-sm font-medium border-b ${
                mode === 'register'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Register (temporary)
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email or Username</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="dept.user@example.gov"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => setShowPwd((s) => !s)}
                    >
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div />
                  <button type="button" className="text-indigo-600 hover:text-indigo-700">
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-medium hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Login'}
                </button>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="dept.user@example.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => setShowRegPwd((s) => !s)}
                      >
                        {showRegPwd ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => setShowRegConfirm((s) => !s)}
                      >
                        {showRegConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-medium hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                >
                  {loading ? 'Creating…' : 'Create Department Account'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-slate-600">
              Admin user?{' '}
              <Link className="text-indigo-600 hover:text-indigo-700 font-medium" to="/admin/login">
                Go to Admin Login
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Registration is temporary and will be removed later.
        </p>
      </div>
    </div>
  );
};

export default DepartmentLogin;
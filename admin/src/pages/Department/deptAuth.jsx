import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDepartmentAuth } from '../../store/auth';

const DepartmentAuth = () => {
  const navigate = useNavigate();
  const { token, login, register } = useDepartmentAuth() || {};

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Shared fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) navigate('/department', { replace: true });
  }, [token, navigate]);

  const validateLoginForm = () => {
    if (!identifier.trim()) {
      setError('Department code or email is required');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateRegisterForm = () => {
    if (!name.trim()) {
      setError('Department name is required');
      return false;
    }
    if (!code.trim()) {
      setError('Department code is required');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const onLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await login({
        identifier: identifier.trim().toLowerCase(),
        password,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Login failed');
      }

      navigate('/department', { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await register({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        password,
        contactPhone: contactPhone.trim(),
        description: description.trim(),
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Registration failed');
      }

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
          <p className="text-slate-600 text-sm mt-1">
            {isLogin ? 'Sign in to manage assigned issues' : 'Register your department'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                isLogin ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                !isLogin ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLogin ? (
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Department Code or Email
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="DEPT001 or department@gov.in"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
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
                  <label className="block text-sm font-medium text-slate-700">
                    Department Name
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Public Works Department"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Department Code
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="PWD"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="pwd@gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+91 XXXXXXXXXX"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description of department responsibilities..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-medium hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                >
                  {loading ? 'Registering…' : 'Register Department'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-slate-600">
              Admin user?{' '}
              <Link 
                className="text-indigo-600 hover:text-indigo-700 font-medium" 
                to="/admin/login"
              >
                Go to Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentLogin;
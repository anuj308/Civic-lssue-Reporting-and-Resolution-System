import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDepartmentAuth } from '../../store/auth';

const DepartmentAuth = () => {
  const navigate = useNavigate();
  const { token, login, register } = useDepartmentAuth() || {};

  // Form state management
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    code: '',
    email: '',
    password: '',
    contactPhone: '',
    description: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) navigate('/department', { replace: true });
  }, [token, navigate]);

  const validateLoginForm = () => {
    const newErrors = {};

    if (!loginForm.identifier.trim()) {
      newErrors.identifier = 'Department code or email is required';
    }
    if (!loginForm.password || loginForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    if (!registerForm.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    if (!registerForm.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (!/^[A-Z0-9]{3,10}$/.test(registerForm.code.trim())) {
      newErrors.code = 'Code must be 3-10 uppercase letters/numbers';
    }
    if (!registerForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (registerForm.contactPhone && !/^\+?[\d\s-]{10,}$/.test(registerForm.contactPhone)) {
      newErrors.contactPhone = 'Enter valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await login({
        identifier: loginForm.identifier.trim().toLowerCase(),
        password: loginForm.password,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Login failed');
      }

      navigate('/department', { replace: true });
    } catch (err) {
      setErrors({ submit: err?.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await register({
        ...registerForm,
        name: registerForm.name.trim(),
        code: registerForm.code.trim().toUpperCase(),
        email: registerForm.email.trim().toLowerCase(),
        contactPhone: registerForm.contactPhone.trim(),
        description: registerForm.description.trim(),
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Registration failed');
      }

      navigate('/department', { replace: true });
    } catch (err) {
      setErrors({ submit: err?.message || 'Registration failed' });
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
            {errors.submit && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            {isLogin ? (
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Department Code or Email
                  </label>
                  <input
                    name="identifier"
                    value={loginForm.identifier}
                    onChange={handleLoginChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.identifier ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="DEPT001 or department@gov.in"
                    required
                  />
                  {errors.identifier && (
                    <p className="mt-1 text-xs text-red-500">{errors.identifier}</p>
                  )}
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
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.password ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
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
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.name ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Public Works Department"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Department Code
                  </label>
                  <input
                    name="code"
                    value={registerForm.code}
                    onChange={handleRegisterChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.code ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="PWD"
                    required
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-red-500">{errors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.email ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="pwd@gov.in"
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={registerForm.contactPhone}
                    onChange={handleRegisterChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.contactPhone ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="+91 XXXXXXXXXX"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={registerForm.description}
                    onChange={handleRegisterChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.description ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Brief description of department responsibilities..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                  )}
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
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className={`mt-1 w-full rounded-lg border ${
                      errors.password ? 'border-red-500' : 'border-slate-300'
                    } bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
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

export default DepartmentAuth;
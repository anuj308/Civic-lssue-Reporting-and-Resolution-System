import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  adminAPI,
  departmentAuthAPI,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  getDeptToken,
  setDeptToken,
  clearDeptToken,
} from '../services/api';

// Admin auth context
const AdminAuthCtx = createContext(null);
export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getAdminToken() || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!token);

  const fetchMe = useCallback(async () => {
    if (!token) return null;
    try {
      const me = await adminAPI.me();
      setProfile(me || null);
      return me;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async ({ identifier, password }) => {
    const res = await adminAPI.login({ identifier, password });
    const t = res?.accessToken || res?.token;
    if (!t) throw new Error('No access token returned');
    setAdminToken(t);
    setToken(t);
    setLoading(true);
    await fetchMe();
    return true;
  }, [fetchMe]);

  const signup = useCallback(async ({ name, email, username, password }) => {
    await adminAPI.signup({ name, email, username, password });
    return true;
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setToken(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  const value = useMemo(() => ({ token, profile, loading, login, signup, logout }), [token, profile, loading, login, signup, logout]);
  return <AdminAuthCtx.Provider value={value}>{children}</AdminAuthCtx.Provider>;
};
export const useAdminAuth = () => useContext(AdminAuthCtx);

// Department auth context
const DeptAuthCtx = createContext(null);
export const DepartmentAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getDeptToken() || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!token);

  const fetchMe = useCallback(async () => {
    if (!token) return null;
    try {
      const me = await departmentAuthAPI.me();
      setProfile(me || null);
      return me;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async ({ identifier, password }) => {
    const res = await departmentAuthAPI.login({ identifier, password });
    const t = res?.accessToken || res?.token;
    if (!t) throw new Error('No access token returned');
    setDeptToken(t);
    setToken(t);
    setLoading(true);
    await fetchMe();
    return true;
  }, [fetchMe]);

  const register = useCallback(async ({ name, email, password }) => {
    if (!departmentAuthAPI.register) throw new Error('Department registration is not enabled');
    await departmentAuthAPI.register({ name, email, password });
    return true;
  }, []);

  const logout = useCallback(() => {
    clearDeptToken();
    setToken(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  const value = useMemo(() => ({ token, profile, loading, login, register, logout }), [token, profile, loading, login, register, logout]);
  return <DeptAuthCtx.Provider value={value}>{children}</DeptAuthCtx.Provider>;
};
export const useDeptAuth = () => useContext(DeptAuthCtx);
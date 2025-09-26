// Simple fetch-based API client with separate tokens for Admin and Department

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Optional overrides for department auth endpoints
const DEPT_LOGIN_PATH = import.meta.env.VITE_DEPT_LOGIN_PATH || '/auth/login';
const DEPT_ME_PATH = import.meta.env.VITE_DEPT_ME_PATH || '/auth/me';

const ADMIN_TOKEN_KEY = 'admin_access_token';
const DEPT_TOKEN_KEY = 'department_access_token';

// Token helpers
export const setAdminToken = (t) => localStorage.setItem(ADMIN_TOKEN_KEY, t);
export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

export const setDeptToken = (t) => localStorage.setItem(DEPT_TOKEN_KEY, t);
export const getDeptToken = () => localStorage.getItem(DEPT_TOKEN_KEY);
export const clearDeptToken = () => localStorage.removeItem(DEPT_TOKEN_KEY);

// Core request
async function request(path, { method = 'GET', body, headers = {}, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': body instanceof FormData ? undefined : 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const isJSON = res.headers.get('content-type')?.includes('application/json');
  const data = isJSON ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg = (isJSON && (data?.message || data?.error)) || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  // Most of your backend responses are { success, data }, so unwrap if present
  return data?.data !== undefined ? data.data : data;
}

// ADMIN APIs (use admin token)
export const adminAPI = {
  login: (payload) => request('/admin/login', { method: 'POST', body: payload }),
  me: () => request('/admin/me', { token: getAdminToken() }),
  refresh: (payload) => request('/admin/refresh', { method: 'POST', body: payload }),
  // Department management (admin side)
  listDepartments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/departments${q ? `?${q}` : ''}`, { token: getAdminToken() });
  },
  createDepartment: (payload) => request('/departments', { method: 'POST', body: payload, token: getAdminToken() }),
  updateDepartment: (id, payload) => request(`/departments/${id}`, { method: 'PUT', body: payload, token: getAdminToken() }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE', token: getAdminToken() }),
};

// DEPARTMENT AUTH (use department token)
export const departmentAuthAPI = {
  login: (payload) => request(DEPT_LOGIN_PATH, { method: 'POST', body: payload }),
  me: () => request(DEPT_ME_PATH, { token: getDeptToken() }),
};

// Department portal APIs (authorized as department user)
// Example: fetch issues for department; adjust filters to match your backend
export const departmentAPI = {
  myIssues: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/issues${q ? `?${q}` : ''}`, { token: getDeptToken() });
  },
  // Add more department-scoped endpoints as needed
};
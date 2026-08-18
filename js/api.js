const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('lifequest_token');
}

function setToken(token) {
  localStorage.setItem('lifequest_token', token);
}

function clearToken() {
  localStorage.removeItem('lifequest_token');
}

function isLoggedIn() {
  return !!getToken();
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

import { API_BASE_URL } from './apiConfig';
import { getTokenFromCookies } from './getTokenFromCookies';

export async function authorizedFetch(path, options = {}) {
  const token = getTokenFromCookies();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  console.log("authorizedFetch token check--------------------"  ,res)

  // If the response is not JSON (e.g. empty body), handle gracefully
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  // 🔐 If unauthorized — redirect to login
  if (res.status === 401 || res.status === 403) {
    console.warn('Unauthorized — redirecting to login...');
    // Clear token cookie if needed
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; Max-Age=0; path=/;';
      window.location.href = '/'; // 👈 Redirect user to login page
    }
    throw new Error('Unauthorized. Redirecting to login...');
  }
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

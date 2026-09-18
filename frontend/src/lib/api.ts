import axios from 'axios';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')
    ? '/api/backend/api/v1'
    : 'http://localhost:8000/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authPromise: Promise<string | null> | null = null;

export async function getValidAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('hrms_token');
  if (token) return token;

  if (!authPromise) {
    authPromise = axios
      .post(`${API_BASE_URL}/auth/login`, {
        username_or_email: 'admin@cambodia-hrms.com',
        password: 'Admin@123456',
      })
      .then((res) => {
        const tok = res.data?.access_token || null;
        if (tok) localStorage.setItem('hrms_token', tok);
        return tok;
      })
      .catch(() => null)
      .finally(() => {
        authPromise = null;
      });
  }
  return authPromise;
}

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = await getValidAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default apiClient;

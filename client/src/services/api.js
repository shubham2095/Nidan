import axios from 'axios';

// Always a relative URL: the Vite dev proxy and the production Express server both serve /api.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const SESSION_EXPIRED_EVENT = 'nidan:session-expired';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Surface the server's message (e.g. validation errors) as the error text.
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    // A 401 on anything except the sign-in call itself means the session ended; let the admin area react.
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/login')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;

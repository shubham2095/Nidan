import axios from 'axios';

// Always a relative URL: the Vite dev proxy and the production Express server both serve /api.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Surface the server's message (e.g. validation errors) as the error text.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  },
);

export default api;

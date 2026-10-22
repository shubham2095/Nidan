import api from './api.js';

export const login = (credentials) => api.post('/auth/login', credentials).then((response) => response.data.user);
export const logout = () => api.post('/auth/logout').then((response) => response.data);
export const getMe = () => api.get('/auth/me').then((response) => response.data.user);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then((response) => response.data);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((response) => response.data);
export const changePassword = (payload) => api.post('/auth/change-password', payload).then((response) => response.data);

import api from './api.js';

// Management calls: vaccination, doctors, locations, website content, settings, users, activity log.
const data = (promise) => promise.then((response) => response.data);
const multipart = (path, fields, file, method = 'post') => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => value !== undefined && value !== null && form.append(key, value));
  form.append('file', file);
  return data(api[method](path, form, { headers: { 'Content-Type': undefined } }));
};

/* Vaccination */
export const listVaccines = (params, signal) => data(api.get('/vaccines', { params, signal }));
export const createVaccine = (payload) => data(api.post('/vaccines', payload));
export const updateVaccine = (id, payload) => data(api.patch(`/vaccines/${id}`, payload));
export const deleteVaccine = (id) => api.delete(`/vaccines/${id}`);
export const getDueVaccinations = (params, signal) => data(api.get('/vaccinations/due', { params, signal }));
export const getVaccinationCounts = (signal) => data(api.get('/vaccinations/counts', { signal }));
export const getPatientVaccinations = (patientId, signal) => data(api.get(`/patients/${patientId}/vaccinations`, { signal }));
export const markVaccination = (patientId, recordId, payload) => data(api.patch(`/patients/${patientId}/vaccinations/${recordId}`, payload));

/* Doctors */
export const listAdminDoctors = (signal) => data(api.get('/admin/doctors', { signal }));
export const getAdminDoctor = (id, signal) => data(api.get(`/admin/doctors/${id}`, { signal }));
export const createDoctor = (payload) => data(api.post('/admin/doctors', payload));
export const updateDoctor = (id, payload) => data(api.patch(`/admin/doctors/${id}`, payload));
export const saveSchedules = (id, schedules) => data(api.put(`/admin/doctors/${id}/schedules`, { schedules }));
export const uploadDoctorPhoto = (id, file) => multipart(`/admin/doctors/${id}/photo`, {}, file);
export const removeDoctorPhoto = (id) => data(api.delete(`/admin/doctors/${id}/photo`));
export const addLeave = (id, payload) => data(api.post(`/admin/doctors/${id}/leaves`, payload));
export const removeLeave = (id, leaveId) => api.delete(`/admin/doctors/${id}/leaves/${leaveId}`);

/** Standard list / create / update / delete / reorder calls for a managed table at `base`. */
const resource = (base) => ({
  list: (signal) => data(api.get(base, { signal })),
  create: (payload) => data(api.post(base, payload)),
  update: (id, payload) => data(api.patch(`${base}/${id}`, payload)),
  remove: (id) => api.delete(`${base}/${id}`),
  reorder: (ids) => data(api.post(`${base}/reorder`, { ids })),
});

export const locations = resource('/admin/locations');
export const services = resource('/admin/services');
export const specialties = resource('/admin/specialties');
export const galleryCategories = resource('/admin/gallery/categories');
export const blogCategories = resource('/admin/blog/categories');

/* Testimonials */
export const listTestimonials = (params, signal) => data(api.get('/admin/testimonials', { params, signal }));
export const createTestimonial = (payload) => data(api.post('/admin/testimonials', payload));
export const updateTestimonial = (id, payload) => data(api.patch(`/admin/testimonials/${id}`, payload));
export const deleteTestimonial = (id) => api.delete(`/admin/testimonials/${id}`);

/* Gallery */
export const listGalleryImages = (signal) => data(api.get('/admin/gallery/images', { signal }));
export const uploadGalleryImage = (fields, file) => multipart('/admin/gallery/images', fields, file);
export const updateGalleryImage = (id, payload) => data(api.patch(`/admin/gallery/images/${id}`, payload));
export const deleteGalleryImage = (id) => api.delete(`/admin/gallery/images/${id}`);
export const reorderGalleryImages = (ids) => data(api.post('/admin/gallery/images/reorder', { ids }));

/* Blog */
export const listPosts = (params, signal) => data(api.get('/admin/blog/posts', { params, signal }));
export const getPost = (id, signal) => data(api.get(`/admin/blog/posts/${id}`, { signal }));
export const createPost = (payload) => data(api.post('/admin/blog/posts', payload));
export const updatePost = (id, payload) => data(api.patch(`/admin/blog/posts/${id}`, payload));
export const deletePost = (id) => api.delete(`/admin/blog/posts/${id}`);

/** Uploads a picture to the public area and resolves to its URL. */
export const uploadImage = (file, folder = 'content') => multipart('/admin/media/images', { folder }, file).then((result) => result.url);

/* Settings, users, activity */
export const getSettings = (signal) => data(api.get('/admin/settings', { signal }));
export const saveSetting = (key, value) => data(api.put(`/admin/settings/${key}`, value));
export const listUsers = (signal) => data(api.get('/admin/users', { signal }));
export const createUser = (payload) => data(api.post('/admin/users', payload));
export const updateUser = (id, payload) => data(api.patch(`/admin/users/${id}`, payload));
export const setUserPassword = (id, password) => data(api.post(`/admin/users/${id}/password`, { password }));
export const sendResetLink = (id) => data(api.post(`/admin/users/${id}/reset-link`));
export const listActivity = (params, signal) => data(api.get('/admin/activity', { params, signal }));

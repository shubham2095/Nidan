import api from './api.js';

// Read-only public content. Each loader accepts { signal } so pages can cancel on navigation.
const get = (url, params, signal) => api.get(url, { params, signal }).then((response) => response.data);

export const getSite = (signal) => get('/public/site', undefined, signal);
export const getHome = (signal) => get('/public/home', undefined, signal);
export const getDoctors = (signal) => get('/public/doctors', undefined, signal);
export const getDoctor = (slug, signal) => get(`/public/doctors/${slug}`, undefined, signal);
export const getServices = (signal) => get('/public/services', undefined, signal);
export const getService = (slug, signal) => get(`/public/services/${slug}`, undefined, signal);
export const getTestimonials = (signal) => get('/public/testimonials', undefined, signal);
export const getGallery = (signal) => get('/public/gallery', undefined, signal);
export const getPosts = (params, signal) => get('/public/blog', params, signal);
export const getPostCategories = (signal) => get('/public/blog/categories', undefined, signal);
export const getPost = (slug, signal) => get(`/public/blog/${slug}`, undefined, signal);

// Availability and booking. Never cached: slots change with every booking.
export const getBookingDates = (params, signal) => get('/public/booking/dates', params, signal);
export const getBookingSlots = (params, signal) => get('/public/booking/slots', params, signal);
export const createBooking = (payload) => api.post('/public/booking', payload).then((response) => response.data.booking);

export const submitContact =(payload) => api.post('/public/contact', payload).then((response) => response.data);
export const submitTestimonial = (payload) => api.post('/public/testimonials', payload).then((response) => response.data);

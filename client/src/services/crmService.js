import api from './api.js';

// Staff-only CRM calls. Every function returns the response body.
const data = (promise) => promise.then((response) => response.data);

export const getDashboard = (signal) => data(api.get('/dashboard', { signal }));
export const getUserOptions = (signal) => data(api.get('/users/options', { signal }));

// Appointments
export const listAppointments = (params, signal) => data(api.get('/appointments', { params, signal }));
export const getCalendar = (params, signal) => data(api.get('/appointments/calendar', { params, signal }));
export const getAppointment = (id, signal) => data(api.get(`/appointments/${id}`, { signal }));
export const createAppointment = (payload) => data(api.post('/appointments', payload));
export const changeAppointmentStatus = (id, payload) => data(api.patch(`/appointments/${id}/status`, payload));
export const rescheduleAppointment = (id, payload) => data(api.post(`/appointments/${id}/reschedule`, payload));
export const updateAppointment = (id, payload) => data(api.patch(`/appointments/${id}`, payload));
export const getStaffDates = (params, signal) => data(api.get('/appointments/availability/dates', { params, signal }));
export const getStaffSlots = (params, signal) => data(api.get('/appointments/availability/slots', { params, signal }));

/** Downloads the filtered appointment list as a CSV file. */
export const downloadAppointmentsCsv = async (params) => {
  const response = await api.get('/appointments/export.csv', { params, responseType: 'blob' });
  saveBlob(response.data, `appointments-${new Date().toISOString().slice(0, 10)}.csv`);
};

// Patients
export const listPatients = (params, signal) => data(api.get('/patients', { params, signal }));
export const getPatient = (id, signal) => data(api.get(`/patients/${id}`, { signal }));
export const createPatient = (payload) => data(api.post('/patients', payload));
export const updatePatient = (id, payload) => data(api.patch(`/patients/${id}`, payload));
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const addRelation = (id, payload) => data(api.post(`/patients/${id}/relations`, payload));
export const removeRelation = (id, relationId) => data(api.delete(`/patients/${id}/relations/${relationId}`));
export const listVisitNotes = (id, signal) => data(api.get(`/patients/${id}/notes`, { signal }));
export const createVisitNote = (id, payload) => data(api.post(`/patients/${id}/notes`, payload));
export const updateVisitNote = (id, noteId, payload) => data(api.patch(`/patients/${id}/notes/${noteId}`, payload));
export const listAttachments = (id, signal) => data(api.get(`/patients/${id}/attachments`, { signal }));

export const uploadAttachment = (id, { title, file }) => {
  const form = new FormData();
  form.append('title', title);
  form.append('file', file);
  // Let the browser set the multipart boundary.
  return data(api.post(`/patients/${id}/attachments`, form, { headers: { 'Content-Type': undefined } }));
};

export const downloadAttachment = async (attachment) => {
  const response = await api.get(`/attachments/${attachment.id}/download`, { responseType: 'blob' });
  saveBlob(response.data, attachment.originalName);
};

export const deleteAttachment = (id) => api.delete(`/attachments/${id}`);

// Leads
export const listLeads = (params, signal) => data(api.get('/leads', { params, signal }));
export const getLead = (id, signal) => data(api.get(`/leads/${id}`, { signal }));
export const createLead = (payload) => data(api.post('/leads', payload));
export const updateLead = (id, payload) => data(api.patch(`/leads/${id}`, payload));
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const addLeadNote = (id, note) => data(api.post(`/leads/${id}/notes`, { note }));
export const convertLead = (id, payload) => data(api.post(`/leads/${id}/convert`, payload));

// Follow-ups
export const listFollowUps = (params, signal) => data(api.get('/follow-ups', { params, signal }));
export const createFollowUp = (payload) => data(api.post('/follow-ups', payload));
export const updateFollowUp = (id, payload) => data(api.patch(`/follow-ups/${id}`, payload));
export const deleteFollowUp = (id) => api.delete(`/follow-ups/${id}`);

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

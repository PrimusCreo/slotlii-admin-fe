import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT token ──────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('slotlii_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto-logout on 401 ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on login page or during login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('slotlii_admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────
// The backend accepts `email` for both admin (treated as the admin username)
// and client roles — the UI label is still "Username" for admins.
export const loginAdmin = (username, password) =>
  api.post('/auth/login', { email: username, password, role: 'admin' });
export const getMe = () => api.get('/auth/me');

// ── Clinics ─────────────────────────────────────────────
// `createClinic` now sends an email invite; the actual Clinic doc is created
// when the user accepts the invite and sets their password.
export const getClinics = () => api.get('/clinics');
export const getClinic = (id) => api.get(`/clinics/${id}`);
export const inviteClinic = (data) => api.post('/clinics', data);
export const updateClinic = (id, data) => api.put(`/clinics/${id}`, data);
export const deleteClinic = (id) => api.delete(`/clinics/${id}`);

// ── Appointments ────────────────────────────────────────
export const getAppointments = (params) => api.get('/appointments', { params });
export const getAvailableSlots = (params) => api.get('/appointments/slots', { params });
export const getAppointment = (id) => api.get(`/appointments/${id}`);
export const createAppointment = (data) => api.post('/appointments', data);
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel`);
export const rescheduleAppointment = (id, data) => api.patch(`/appointments/${id}/reschedule`, data);
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status });

// ── Patients ────────────────────────────────────────────
export const getPatients = (params) => api.get('/patients', { params });
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const getPatientAppointments = (id) => api.get(`/patients/${id}/appointments`);
export const addMedicalHistory = (id, data) => api.post(`/patients/${id}/medical-history`, data);

// ── Health ──────────────────────────────────────────────
export const getHealth = () => axios.get('/health');

export default api;

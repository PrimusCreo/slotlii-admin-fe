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

// ── Health / API status probes ──────────────────────────
// Admin doesn't expose appointment or patient management surfaces (that's
// the clinic's domain, not ours), but the API-status page still probes
// these read endpoints as heartbeats to confirm the backend is healthy.
export const getHealth = () => axios.get('/health');
export const getAppointments = (params) => api.get('/appointments', { params });
export const getPatients = (params) => api.get('/patients', { params });

// ── Platform-admin WhatsApp observability + lifecycle ───
// All endpoints require the caller to be logged in as `admin`. Backend
// gate lives in adminWhatsAppRoutes.js (requireRole('admin')).
export const adminGetWhatsAppOverview = () =>
  api.get('/admin/whatsapp/overview');
export const adminGetClinicWhatsAppUsage = (id, params) =>
  api.get(`/admin/clinics/${id}/whatsapp/usage`, { params });
export const adminGetClinicWhatsAppMessages = (id, params) =>
  api.get(`/admin/clinics/${id}/whatsapp/messages`, { params });
export const adminGetClinicWhatsAppTemplates = (id) =>
  api.get(`/admin/clinics/${id}/whatsapp/templates`);
export const adminGetClinicSenderHealth = (id) =>
  api.get(`/admin/clinics/${id}/whatsapp/sender-health`);
export const adminResyncClinicTemplates = (id) =>
  api.post(`/admin/clinics/${id}/whatsapp/resync-templates`);
export const adminResubmitClinicTemplate = (id, templateName) =>
  api.post(`/admin/clinics/${id}/whatsapp/resubmit-template`, { templateName });
export const adminSuspendClinicWhatsApp = (id) =>
  api.post(`/admin/clinics/${id}/whatsapp/suspend`);
export const adminUnsuspendClinicWhatsApp = (id) =>
  api.post(`/admin/clinics/${id}/whatsapp/unsuspend`);
export const adminRotateClinicToken = (id, newAuthToken) =>
  api.post(`/admin/clinics/${id}/whatsapp/rotate-token`, { newAuthToken });
export const adminCloseClinicSubaccount = (id) =>
  api.post(`/admin/clinics/${id}/whatsapp/close-subaccount`);
export const adminListRollups = (params) =>
  api.get('/admin/whatsapp/rollups', { params });
export const adminReplayRollup = (payload) =>
  api.post('/admin/whatsapp/rollups/replay', payload || {});
export const adminGetClinicRollups = (id) =>
  api.get(`/admin/clinics/${id}/whatsapp/rollups`);
export const adminReplayClinicRollup = (id, payload) =>
  api.post(`/admin/clinics/${id}/whatsapp/rollups/replay`, payload || {});
export const adminRefreshApproval = (id) =>
  api.post(`/admin/clinics/${id}/whatsapp/refresh-approval`);
export const adminGetApprovalRaw = (id) =>
  api.get(`/admin/clinics/${id}/whatsapp/approval-raw`);

/**
 * Deprecated: prefer `adminResetClinicWhatsApp(id, { level: 'templates', ... })`.
 * Backend route remains as an alias for backwards compat with the earlier CLI/UI.
 */
export const adminHardResyncClinic = (id) =>
  api.post(`/admin/clinics/${id}/whatsapp/hard-resync`);

/**
 * Generic WhatsApp reset — 3 destructive levels:
 *   - `templates` : wipe & recreate Content Templates (mild)
 *   - `sender`    : also drop the WA Sender + MessagingService (medium)
 *   - `full`      : also close the Twilio subaccount (nuclear)
 *
 * `confirmation` must exactly match the phrase for the chosen level
 * (server-side enforced): 'RESET TEMPLATES' / 'RESET SENDER' / 'FULL WIPE'.
 * Returns { log, ... } including audit trail.
 */
export const adminResetClinicWhatsApp = (id, { level, confirmation }) =>
  api.post(`/admin/clinics/${id}/whatsapp/reset`, { level, confirmation });

export const adminGetClinicResetHistory = (id) =>
  api.get(`/admin/clinics/${id}/whatsapp/reset-history`);

// ── Platform-admin usage analytics ──────────────────────
// Backed by /api/admin/analytics/* — gated to `platform_admin`.
// `windowDays` accepts 7 / 30 / 90 (default 30 on the server).
export const adminGetAnalyticsOverview = (params) =>
  api.get('/admin/analytics/overview', { params });
export const adminGetClinicAnalytics = (id, params) =>
  api.get(`/admin/analytics/clinics/${id}`, { params });

// ── Platform-admin plan catalog ─────────────────────────
// The tiers themselves: pricing, limits and feature flags. Backed by
// /api/admin/plans/* and gated to `platform_admin`.
//
// `adminUpdatePlan` is where repricing happens. Cashfree binds mandates to a
// plan amount, so a price change can't edit in place: the backend bumps the
// tier's `priceVersion`, publishes a new Cashfree plan, and answers with
// `repriced: true`. Clinics already subscribed keep the amount snapshotted on
// their own subscription until they re-authorise.
//
// Responses may carry a `warnings` array — the tier saved, but Cashfree
// couldn't be reached, so self-checkout for it won't work until it's published.
export const adminGetPlans = () => api.get('/admin/plans');
export const adminCreatePlan = (data) => api.post('/admin/plans', data);
export const adminUpdatePlan = (code, data) => api.put(`/admin/plans/${code}`, data);
export const adminArchivePlan = (code) => api.post(`/admin/plans/${code}/archive`);
export const adminUnarchivePlan = (code) =>
  api.post(`/admin/plans/${code}/unarchive`);
/** Retry the Cashfree publish for a tier saved while the provider was down. */
export const adminPublishPlan = (code) => api.post(`/admin/plans/${code}/publish`);

// ── Platform-admin per-clinic subscriptions ─────────────
// Offline billing control: assign a plan, set the dates, adjust a trial, record
// a payment collected outside the product. Every write marks the subscription
// `managedBy: 'admin'`, which stops the lifecycle job treating a lapsed date as
// a failed auto-debit.
export const adminGetSubscriptions = (params) =>
  api.get('/admin/subscriptions', { params });
export const adminGetClinicSubscription = (id) =>
  api.get(`/admin/clinics/${id}/subscription`);
export const adminSetClinicSubscription = (id, data) =>
  api.put(`/admin/clinics/${id}/subscription`, data);
/** `{ days }` to extend, `{ trialEndsAt }` for an exact date, `{ end: true }` to stop it. */
export const adminAdjustClinicTrial = (id, data) =>
  api.post(`/admin/clinics/${id}/subscription/trial`, data);
export const adminRecordClinicPayment = (id, data) =>
  api.post(`/admin/clinics/${id}/subscription/record-payment`, data);
/** `action` is pause | cancel | reactivate. */
export const adminSetClinicSubscriptionLifecycle = (id, action) =>
  api.post(`/admin/clinics/${id}/subscription/${action}`);

export default api;

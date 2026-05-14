/**
 * API client — talks to the FastAPI backend.
 *
 * Backend URL is resolved automatically:
 * 1. EXPO_PUBLIC_BACKEND_HOST env var wins if set
 * 2. Otherwise we read Metro's `hostUri` from Expo Constants — this gives the
 *    laptop's LAN IP, which Expo Go (running on a real phone) needs to reach
 *    our backend. The phone's own `127.0.0.1` would refer to the phone itself.
 * 3. Android emulator gets `10.0.2.2` (its loopback to the host machine).
 * 4. iOS simulator + Web get `127.0.0.1`.
 *
 * Make sure backend runs with `--host 0.0.0.0` (already the default in main.py).
 */
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8000;

const resolveBackendUrl = (): string => {
  // 1. Explicit override
  const envHost = process.env.EXPO_PUBLIC_BACKEND_HOST;
  if (envHost) return envHost;

  // 2. Auto-detect from Metro hostUri
  const fromExpo =
    (Constants as any).expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest?.hostUri;

  if (typeof fromExpo === 'string' && fromExpo.length > 0) {
    const host = fromExpo.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${BACKEND_PORT}`;
    }
  }

  // 3. Platform fallback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }
  return `http://127.0.0.1:${BACKEND_PORT}`;
};

export const BACKEND_URL = resolveBackendUrl();

// Log so we can debug on phone via Metro console
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[Khidmat] Backend URL resolved to:', BACKEND_URL);
}

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
});

// ============================================================================
// Catalog
// ============================================================================
export const fetchServices = () => api.get('/api/catalog/services').then((r) => r.data);
export const fetchCities = () => api.get('/api/catalog/cities').then((r) => r.data);

// ============================================================================
// Orchestration
// ============================================================================
export const parseAndRank = (userText: string, userId = 'U001') =>
  api
    .post('/api/orchestrate/parse-and-rank', { user_text: userText, user_id: userId })
    .then((r) => r.data);

export const confirmBooking = (
  traceId: string,
  providerId: string,
  user: { id: string; name: string; phone: string },
  timePreference?: string,
  timeSpecificIso?: string
) =>
  api
    .post('/api/orchestrate/confirm-booking', {
      trace_id: traceId,
      chosen_provider_id: providerId,
      user,
      time_preference: timePreference,
      time_specific_iso: timeSpecificIso,
    })
    .then((r) => r.data);

export const fetchInsights = () => api.get('/api/orchestrate/insights').then((r) => r.data);

// Direct booking fallback — bypasses the orchestrate trace flow so booking can never
// fail because of a missing/stale trace. Used by provider detail screen when the
// main confirm-booking path fails.
export const createDirectBooking = (payload: {
  provider_id: string;
  user: { id: string; name: string; phone: string };
  intent: any;
  time_preference?: string;
}) =>
  api
    .post('/api/bookings', {
      provider_id: payload.provider_id,
      user: payload.user,
      intent: payload.intent,
      time_preference: payload.time_preference || 'now',
    })
    .then((r) => r.data);

// ============================================================================
// Bookings
// ============================================================================
export const fetchBookings = (userId = 'U001') =>
  api.get(`/api/bookings?user_id=${userId}`).then((r) => r.data);

export const fetchBooking = (id: string) => api.get(`/api/bookings/${id}`).then((r) => r.data);

// ============================================================================
// Traces
// ============================================================================
export const fetchTraces = () => api.get('/api/traces').then((r) => r.data);
export const fetchTrace = (id: string) => api.get(`/api/traces/${id}`).then((r) => r.data);
export const exportTrace = (id: string) =>
  api.get(`/api/traces/${id}/export`).then((r) => r.data);

// ============================================================================
// State + Emergency
// ============================================================================
export const fetchStateSummary = () => api.get('/api/state/summary').then((r) => r.data);
export const fetchStateLog = () => api.get('/api/state/log').then((r) => r.data);
export const fetchEmergencyTickets = () => api.get('/api/emergency-tickets').then((r) => r.data);
export const fetchAreaAlerts = () => api.get('/api/alerts').then((r) => r.data);

// ============================================================================
// Provider self-service
// ============================================================================
export const registerProvider = (payload: {
  user_id: string;
  name: string;
  business_name: string;
  primary_service: string;
  city: string;
  sector: string;
  phone: string;
  price_range?: string;
  languages?: string[];
  description?: string;
}) => api.post('/api/providers-self/register', payload).then((r) => r.data);

export const fetchMyJobs = (userId?: string, providerId?: string) =>
  api
    .get('/api/providers-self/me/jobs', { params: { user_id: userId, provider_id: providerId } })
    .then((r) => r.data);

export const respondToJob = (jobId: string, action: 'accept' | 'decline') =>
  api
    .post(`/api/providers-self/me/jobs/${jobId}/respond`, { action })
    .then((r) => r.data);

export const fetchMyEarnings = (providerId?: string) =>
  api
    .get('/api/providers-self/me/earnings', { params: { provider_id: providerId } })
    .then((r) => r.data);

export const fetchMyProfile = (params: { provider_id?: string; user_id?: string }) =>
  api.get('/api/providers-self/me/profile', { params }).then((r) => r.data);

export const addMyService = (payload: {
  provider_id: string;
  service_id: string;
  price_range?: string;
}) => api.post('/api/providers-self/me/services', payload).then((r) => r.data);

export const removeMyService = (provider_id: string, service_id: string) =>
  api
    .delete(`/api/providers-self/me/services/${service_id}`, { params: { provider_id } })
    .then((r) => r.data);

export const updateMyProfile = (payload: {
  provider_id: string;
  business_name?: string;
  description?: string;
  price_range?: string;
  is_active?: boolean;
}) => api.patch('/api/providers-self/me/profile', payload).then((r) => r.data);

export const fetchBookingStatus = (bookingId: string) =>
  api.get(`/api/bookings/${bookingId}/status`).then((r) => r.data);

export const cancelBooking = (
  bookingId: string,
  payload: { by_party: 'customer' | 'provider'; reason: string; reason_code: string }
) => api.post(`/api/bookings/${bookingId}/cancel`, payload).then((r) => r.data);

// ============================================================================
// Feedback (post-completion rating)
// ============================================================================
export const submitFeedback = (payload: {
  booking_id: string;
  rating: number;
  review?: string;
  tags?: string[];
}) => api.post('/api/bookings/feedback', payload).then((r) => r.data);

export const fetchFeedback = (bookingId: string) =>
  api.get(`/api/bookings/feedback/${bookingId}`).then((r) => r.data);

// ============================================================================
// Chat (customer ↔ provider on a booking)
// ============================================================================
export const fetchMessages = (bookingId: string, since?: string) =>
  api
    .get(`/api/chat/messages/${bookingId}`, { params: since ? { since } : {} })
    .then((r) => r.data);

export const sendMessage = (payload: {
  booking_id: string;
  sender: 'customer' | 'provider';
  text: string;
}) => api.post('/api/chat/messages', payload).then((r) => r.data);

export const fetchChatThreads = (params: { user_id?: string; provider_id?: string }) =>
  api.get('/api/chat/threads', { params }).then((r) => r.data);

// ============================================================================
// Admin Dashboard
// ============================================================================
export const fetchAdminOverview = () =>
  api.get('/api/admin/overview').then((r) => r.data);

export const fetchAdminProviders = (params?: { sort?: string; limit?: number }) =>
  api.get('/api/admin/providers', { params }).then((r) => r.data);

export const fetchAdminAnalytics = () =>
  api.get('/api/admin/analytics').then((r) => r.data);

export const fetchAdminRevenue = () =>
  api.get('/api/admin/revenue').then((r) => r.data);

// ============================================================================
// Health
// ============================================================================
export const checkHealth = () => api.get('/health').then((r) => r.data);

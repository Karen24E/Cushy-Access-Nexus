import type { DashboardPayload, Order, Rider, Vertical, CategoryData, OverviewData, ProductsData } from '@/src/types/operations';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
let accessToken: string | null = null;
export function setAuthToken(token: string | null) { accessToken = token; }

export function getApiUrl() {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not configured. Set it to your computer LAN address, e.g. http://192.168.1.20:4000.');
  return API_URL.replace(/\/$/, '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, { headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, ...init });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? `Request failed (${response.status})`); }
  return response.json();
}

export async function fetchDashboard(vertical: Vertical): Promise<DashboardPayload> {
  return request<DashboardPayload>(`/api/dashboard?vertical=${encodeURIComponent(vertical)}`);
}

export async function fetchRiders(): Promise<Rider[]> { return (await request<{data: Rider[]}>('/api/riders')).data; }

export async function fetchOrders(params: { vertical: Vertical; status?: string } ): Promise<Order[]> {
  const qs = new URLSearchParams();
  if (params.vertical) qs.set('vertical', params.vertical);
  if (params.status) qs.set('status', params.status);
  return (await request<{data: Order[]}>(`/api/orders?${qs.toString()}`)).data;
}

export async function assignOrder(orderId: string, riderId: string) {
  return request(`/api/orders/${orderId}/assign`, { method: 'POST', body: JSON.stringify({ riderId }) });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return request(`/api/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

// New backend API functions
export async function fetchCategories(): Promise<CategoryData[]> {
  return request<CategoryData[]>('/monitoring/operations/products/categories');
}

export async function fetchOverview(): Promise<OverviewData> {
  return request<OverviewData>('/monitoring/operations/overview');
}

export async function fetchProducts(): Promise<ProductsData> {
  return request<ProductsData>('/monitoring/operations/products');
}

import type { AuthUser, Session } from '@/src/types/auth';
export interface Incident { id: string; title: string; description: string; severity: 'critical'|'high'|'medium'|'low'; vertical: Exclude<Vertical,'All'>; status: 'open'|'acknowledged'|'investigating'|'resolved'|'closed'; assigned_to?: string | null; assignee_name?: string | null; created_at: string; updated_at: string; }
export interface IncidentEvent { id: string; incident_id: string; actor_name?: string; action: string; metadata?: Record<string, unknown>; created_at: string; }
export async function login(email: string, password: string): Promise<Session> { return request<Session>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }
export async function fetchMe(token: string): Promise<AuthUser> { const r = await fetch(`${getApiUrl()}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error('Session expired'); return (await r.json()).user; }
function authHeaders(token?: string) { return token ? { Authorization: `Bearer ${token}` } : {}; }
export async function fetchIncidents(token: string, status = 'all'): Promise<Incident[]> { return (await request<{data: Incident[]}>(`/api/incidents?status=${encodeURIComponent(status)}`, { headers: authHeaders(token) })).data; }
export async function updateIncidentStatus(token: string, id: string, status: Incident['status']) { return request<Incident>(`/api/incidents/${id}/status`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status }) }); }
export async function assignIncident(token: string, id: string, assigned_to: string) { return request<Incident>(`/api/incidents/${id}/assign`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ assigned_to }) }); }

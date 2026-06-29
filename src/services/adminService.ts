import { getFreshToken } from '../lib/authToken';

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  org_name: string | null;
  avatar_url: string | null;
  user_type: 'individual' | 'organization';
  role: string | null;
  org_type: string | null;
  email: string;
  created_at: string;
  deactivated_at: string | null;
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface CategoryItem {
  key: string;
  count: number;
  pct: number;
}

export interface AdminStats {
  totalUsers: number;
  totalOrganisations: number;
  activeUsers: number;
  completedInitiatives: number;
  monthlyEngagement: string;
  individualCategories: CategoryItem[];
  orgCategories: CategoryItem[];
  mediaPosts: number;
  events: number;
  polls: number;
  employmentPosts: number;
  learningPosts: number;
}

async function authHeaders() {
  const token = await getFreshToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAdminUsers(page = 1, perPage = 8): Promise<AdminUsersPage> {
  const headers = await authHeaders();
  const res = await fetch(
    `${API_URL}/api/admin/users?page=${page}&per_page=${perPage}`,
    { headers }
  );
  if (!res.ok) throw new Error(`Admin users failed: ${res.status}`);
  return res.json();
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`Delete user failed: ${res.status}`);
}

// ── Help-Center Inquiry types (admin Client Requests view) ──────────────────

export interface ClientInquiry {
  id: string;
  name: string;
  email: string;
  category: string;
  urgency: string;
  timeline: string;
  status: 'open' | 'closed' | 'cancelled';
  created_at: string;
  user_id: string | null;
  user: {
    first_name: string;
    last_name: string;
    org_name: string;
    avatar_url: string | null;
    user_type: 'individual' | 'organization';
  } | null;
}

export interface ClientInquiryDetail extends ClientInquiry {
  phone: string;
  best_time: string;
  contact_method: string;
  requirements: string;
  budget: string;
  additional_details: string;
}

export interface ClientRequestStats {
  total: number;
  open: number;
  closed: number;
  cancelled: number;
}

export interface ClientRequestsPage {
  inquiries: ClientInquiry[];
  total: number;
  page: number;
  per_page: number;
  stats: ClientRequestStats;
}

export async function fetchClientRequests(
  page = 1,
  perPage = 8,
  tab = 'open',
  search = '',
): Promise<ClientRequestsPage> {
  const headers = await authHeaders();
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    tab,
    search,
  });
  const res = await fetch(`${API_URL}/api/admin/client-requests?${params}`, { headers });
  if (!res.ok) throw new Error(`Client requests failed: ${res.status}`);
  return res.json();
}

export async function fetchClientRequestDetail(id: string): Promise<ClientInquiryDetail> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/client-requests/${id}`, { headers });
  if (!res.ok) throw new Error(`Client request detail failed: ${res.status}`);
  return res.json();
}

export async function updateClientRequestStatus(
  id: string,
  status: 'open' | 'closed' | 'cancelled',
): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/client-requests/${id}/status`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Update status failed: ${res.status}`);
}

export async function deleteClientRequest(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/client-requests/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`Delete client request failed: ${res.status}`);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/stats`, { headers });

  if (!res.ok) throw new Error(`Admin stats failed: ${res.status}`);

  const data = await res.json();
  return {
    totalUsers: data.total_users,
    totalOrganisations: data.total_organisations,
    activeUsers: data.active_users,
    completedInitiatives: data.completed_initiatives,
    monthlyEngagement: data.monthly_engagement,
    individualCategories: data.individual_categories ?? [],
    orgCategories: data.org_categories ?? [],
    mediaPosts: data.media_posts ?? 0,
    events: data.events ?? 0,
    polls: data.polls ?? 0,
    employmentPosts: data.employment_posts ?? 0,
    learningPosts: data.learning_posts ?? 0,
  };
}

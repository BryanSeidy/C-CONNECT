import { apiClient } from './api';

export interface AdminStats {
  totalOrders: number;
  totalCompanies: number;
  totalUsers: number;
  commissionTotal: number;
  disputesOpen: number;
}

export interface AdminUserRow {
  id: number | string;
  fullName: string;
  email: string;
  role: string;
  companyId?: number | string | null;
  createdAt?: string;
}

export interface SystemCheck {
  status: 'ok' | 'down' | 'degraded' | 'warning' | 'not_configured' | 'unknown';
  latencyMs?: number;
  freePercent?: number;
  message?: string;
}

export interface SystemLogEntry {
  date: string;
  level: 'ERROR' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface SystemHealth {
  checks: {
    database: SystemCheck;
    cache: SystemCheck;
    ai: SystemCheck;
    storage: SystemCheck;
  };
  recentErrors: SystemLogEntry[];
  checkedAt: string;
}
interface RawAdminStats {
  total_orders: number;
  total_companies: number;
  total_users: number;
  commission_total: string | number | null;
  disputes_open: number;
}

interface RawAdminUser {
  id: number | string;
  fullName?: string | null;
  nom?: string | null;
  prenom?: string | null;
  email: string;
  role: string;
  company_id?: number | string | null;
  created_at?: string;
}

/**
 * GET /admin/users returns Laravel's native `->paginate()` shape nested
 * inside our usual `{success, data}` envelope — so the real array lives at
 * `data.data`, not `data` directly.
 */
interface RawLaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

export const adminService = {
  /** GET /api/admin/stats — admin only. */
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<unknown, { success: boolean; data: RawAdminStats }>('/admin/stats');
    const raw = res.data;
    return {
      totalOrders: raw.total_orders ?? 0,
      totalCompanies: raw.total_companies ?? 0,
      totalUsers: raw.total_users ?? 0,
      commissionTotal: toNumber(raw.commission_total),
      disputesOpen: raw.disputes_open ?? 0,
    };
  },

  /** GET /api/admin/users — admin only, paginated (20/page). */
  getUsers: async (page = 1): Promise<{ items: AdminUserRow[]; currentPage: number; lastPage: number; total: number }> => {
    const res = await apiClient.get<unknown, { success: boolean; data: RawLaravelPaginator<RawAdminUser> }>(
      '/admin/users',
      { params: { page } }
    );
    const raw = res.data;
    return {
      items: (raw.data ?? []).map((u) => ({
        id: u.id,
        fullName: u.fullName || `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || 'Utilisateur',
        email: u.email,
        role: u.role,
        companyId: u.company_id,
        createdAt: u.created_at,
      })),
      currentPage: raw.current_page ?? 1,
      lastPage: raw.last_page ?? 1,
      total: raw.total ?? 0,
    };
  },

  /** GET /api/admin/health — admin only. Introspection système réelle. */
  getHealth: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<unknown, { success: boolean; data: SystemHealth }>('/admin/health');
    return res.data;
  },
};

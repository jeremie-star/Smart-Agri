import { apiClient } from "./api-client";

export interface SystemStats {
  total_farmers: number;
  total_farms: number;
  active_schedules: number;
  notifications_sent_today: number;
  farmers_registered_this_month: number;
}

export interface AdminFarmer {
  id: string;
  phone_number: string;
  name: string;
  language_preference: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  farms_count: number;
  last_active: string | null;
}

export interface UsageReport {
  period_days: number;
  summary: {
    new_farmers: number;
    new_farms: number;
    notifications_sent: number;
    schedules_created: number;
  };
  farmer_status: {
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
  };
  top_crops: Array<{ crop: string; count: number }>;
  language_distribution: Array<{ language: string; count: number }>;
}

export const adminApi = {
  // Get system statistics
  getStats: (): Promise<SystemStats> => {
    return apiClient.get<SystemStats>("/api/admin/stats");
  },

  // Get all farmers with pagination
  getFarmers: (skip: number = 0, limit: number = 100): Promise<AdminFarmer[]> => {
    return apiClient.get<AdminFarmer[]>(`/api/admin/farmers?skip=${skip}&limit=${limit}`);
  },

  // Get usage reports
  getReports: (days: number = 30): Promise<UsageReport> => {
    return apiClient.get<UsageReport>(`/api/admin/reports?days=${days}`);
  },
};

import { apiClient } from "./api-client";
import type { Farmer, NotificationPreferences } from "@/types/api";

export const farmerApi = {
  // Get current farmer profile
  getProfile: (): Promise<Farmer> => {
    return apiClient.get<Farmer>("/api/farmers/profile");
  },

  // Update farmer profile
  updateProfile: (data: Partial<Pick<Farmer, 'name' | 'language_preference'>>): Promise<Farmer> => {
    return apiClient.put<Farmer>("/api/farmers/profile", data);
  },

  // Get notification preferences
  getNotificationPreferences: (): Promise<NotificationPreferences> => {
    return apiClient.get<NotificationPreferences>("/api/farmers/notification-preferences");
  },

  // Update notification preferences
  updateNotificationPreferences: (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    return apiClient.put<NotificationPreferences>("/api/farmers/notification-preferences", data);
  },

  // Delete farmer account
  deleteAccount: (): Promise<{ message: string }> => {
    return apiClient.delete("/api/farmers/profile");
  },
};

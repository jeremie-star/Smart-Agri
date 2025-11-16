import { apiClient } from "./api-client";
import type {
  Notification,
  SendNotificationRequest,
  PaginatedResponse,
} from "@/types/api";

export const notificationsApi = {
  // Send SMS notification
  sendSMS: (data: SendNotificationRequest): Promise<{ message: string }> => {
    return apiClient.post("/api/notifications/send-sms", data);
  },

  // Send email notification
  sendEmail: (data: SendNotificationRequest): Promise<{ message: string }> => {
    return apiClient.post("/api/notifications/send-email", data);
  },

  // Get notification history
  getHistory: (limit: number = 50): Promise<Notification[]> => {
    return apiClient.get<Notification[]>(`/api/notifications/history?limit=${limit}`);
  },
};

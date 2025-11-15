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
  getHistory: (page: number = 1, perPage: number = 20): Promise<PaginatedResponse<Notification>> => {
    return apiClient.get<PaginatedResponse<Notification>>(
      `/api/notifications/history?page=${page}&per_page=${perPage}`
    );
  },
};

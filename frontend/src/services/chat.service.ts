import { apiClient } from "./api-client";
import type {
  ChatMessage,
  ChatAskRequest,
  ChatSuggestion,
  ChatStats,
  PaginatedResponse,
} from "@/types/api";

export const chatApi = {
  // Ask a question to the AI assistant
  askQuestion: (data: ChatAskRequest): Promise<ChatMessage> => {
    return apiClient.post<ChatMessage>("/api/chat/ask", data);
  },

  // Get chat history with pagination
  getHistory: (page: number = 1, perPage: number = 20): Promise<PaginatedResponse<ChatMessage>> => {
    return apiClient.get<PaginatedResponse<ChatMessage>>(`/api/chat/history?page=${page}&per_page=${perPage}`);
  },

  // Get suggested questions
  getSuggestions: (language?: string): Promise<ChatSuggestion> => {
    const params = language ? `?language=${language}` : "";
    return apiClient.get<ChatSuggestion>(`/api/chat/suggestions${params}`);
  },

  // Delete a specific chat message
  deleteMessage: (chatId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/chat/history/${chatId}`);
  },

  // Clear all chat history
  clearHistory: (): Promise<{ message: string }> => {
    return apiClient.delete("/api/chat/history");
  },

  // Get chat statistics
  getStats: (): Promise<ChatStats> => {
    return apiClient.get<ChatStats>("/api/chat/stats");
  },
};

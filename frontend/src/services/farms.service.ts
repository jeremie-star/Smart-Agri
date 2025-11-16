import { apiClient } from "./api-client";
import type { Farm, CreateFarmRequest } from "@/types/api";

export const farmsApi = {
  // Get all farms for the current farmer
  getFarms: (): Promise<Farm[]> => {
    return apiClient.get<Farm[]>("/api/farms");
  },

  // Get a specific farm
  getFarm: (farmId: string): Promise<Farm> => {
    return apiClient.get<Farm>(`/api/farms/${farmId}`);
  },

  // Create a new farm
  createFarm: (data: CreateFarmRequest): Promise<Farm> => {
    return apiClient.post<Farm>("/api/farms", data);
  },

  // Update a farm
  updateFarm: (farmId: string, data: Partial<CreateFarmRequest>): Promise<Farm> => {
    return apiClient.put<Farm>(`/api/farms/${farmId}`, data);
  },

  // Delete a farm
  deleteFarm: (farmId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/farms/${farmId}`);
  },
};

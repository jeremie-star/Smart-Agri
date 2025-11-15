import { apiClient } from "./api-client";
import type { IrrigationSchedule, GenerateIrrigationRequest } from "@/types/api";

export const irrigationApi = {
  // Generate irrigation schedule
  generateSchedule: (data: GenerateIrrigationRequest): Promise<IrrigationSchedule[]> => {
    return apiClient.post<IrrigationSchedule[]>("/api/irrigation/generate", data);
  },

  // Get irrigation schedule for a farm
  getSchedule: (farmId: string): Promise<IrrigationSchedule[]> => {
    return apiClient.get<IrrigationSchedule[]>(`/api/irrigation/schedule/${farmId}`);
  },

  // Get irrigation history for a farm
  getHistory: (farmId: string): Promise<IrrigationSchedule[]> => {
    return apiClient.get<IrrigationSchedule[]>(`/api/irrigation/history/${farmId}`);
  },
};

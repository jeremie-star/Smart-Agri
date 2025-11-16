import { apiClient } from "./api-client";
import type { WeatherData, WeatherForecast } from "@/types/api";

export const weatherApi = {
  // Get current weather for a farm
  getCurrentWeather: (farmId: string): Promise<WeatherData> => {
    return apiClient.get<WeatherData>(`/api/weather/current/${farmId}`);
  },

  // Get weather forecast for a farm (7-day)
  getForecast: (farmId: string): Promise<WeatherForecast> => {
    return apiClient.get<WeatherForecast>(`/api/weather/forecast/${farmId}`);
  },
};

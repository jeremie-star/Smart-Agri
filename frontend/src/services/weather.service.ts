import { apiClient } from "./api-client";
import type { Weather, WeatherForecast } from "@/types/api";

export const weatherApi = {
  // Get current weather for a farm
  getCurrentWeather: (farmId: string): Promise<Weather> => {
    return apiClient.get<Weather>(`/api/weather/current/${farmId}`);
  },

  // Get 7-day forecast for a farm
  getForecast: (farmId: string): Promise<WeatherForecast[]> => {
    return apiClient.get<WeatherForecast[]>(`/api/weather/forecast/${farmId}`);
  },
};

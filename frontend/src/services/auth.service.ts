import { apiClient } from "./api-client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyPhoneRequest,
  Farmer,
} from "@/types/api";

export const authApi = {
  // Register a new farmer
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/register",
      data
    );
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    return response;
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/login",
      data
    );
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    return response;
  },

  // Verify phone with OTP
  verifyPhone: async (data: VerifyPhoneRequest): Promise<{ message: string }> => {
    return apiClient.post("/api/auth/verify-phone", data);
  },

  // Logout
  logout: () => {
    apiClient.clearToken();
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return apiClient.isAuthenticated();
  },

  // Get current farmer profile
  getProfile: (): Promise<Farmer> => {
    return apiClient.get<Farmer>("/api/farmers/profile");
  },

  // Update farmer profile
  updateProfile: (data: Partial<Farmer>): Promise<Farmer> => {
    return apiClient.put<Farmer>("/api/farmers/profile", data);
  },

  // Delete farmer account
  deleteAccount: (): Promise<{ message: string }> => {
    return apiClient.delete("/api/farmers/profile");
  },
};

// Export as authService for consistency
export const authService = authApi;

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: any;
}

// Authentication Types
export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface RegisterRequest {
  phone_number: string;
  name: string;
  language_preference: LanguageEnum;
  password: string;
}

export interface VerifyPhoneRequest {
  phone_number: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// User/Farmer Types
export enum LanguageEnum {
  ENGLISH = "English",
  SWAHILI = "Swahili",
  KINYARWANDA = "Kinyarwanda",
}

export interface Farmer {
  id: string;
  phone_number: string;
  name: string;
  language_preference: LanguageEnum;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Farm Types
export interface Farm {
  id: string;
  farmer_id: string;
  crop_type: string;
  land_size: number;
  latitude: number;
  longitude: number;
  soil_type?: string;
  created_at: string;
}

export interface CreateFarmRequest {
  crop_type: string;
  land_size: number;
  latitude: number;
  longitude: number;
  soil_type?: string;
}

// Irrigation Types
export enum IrrigationStatus {
  PENDING = "pending",
  SENT = "sent",
  COMPLETED = "completed",
}

export interface IrrigationSchedule {
  id: string;
  farm_id: string;
  recommended_date: string;
  water_amount: number;
  weather_condition?: string;
  ai_reasoning?: string;
  status: IrrigationStatus;
  created_at: string;
}

export interface GenerateIrrigationRequest {
  farm_id: string;
}

// Weather Types
export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  description: string;
  date: string;
}

export interface WeatherForecast {
  current: WeatherData;
  forecast: WeatherData[];
}

// Chat Types
export interface ChatMessage {
  id: string;
  question: string;
  response: string;
  context_data?: string;
  language: LanguageEnum;
  created_at: string;
}

export interface ChatAskRequest {
  question: string;
  include_farm_context?: boolean;
}

export interface ChatHistory {
  chat_logs: ChatMessage[];
  total: number;
  page: number;
  per_page: number;
}

// Notification Types
export enum NotificationChannel {
  SMS = "SMS",
  EMAIL = "Email",
  USSD = "USSD",
  WEB = "Web",
}

export enum NotificationStatus {
  SENT = "sent",
  FAILED = "failed",
  DELIVERED = "delivered",
}

export interface Notification {
  id: string;
  farmer_id: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sent_at: string;
}

export interface NotificationPreferences {
  notification_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  email_address?: string;
}

export interface SendNotificationRequest {
  phone_number: string;
  message: string;
  language?: string;
}

// Admin Types
export interface SystemStats {
  total_farmers: number;
  total_farms: number;
  total_schedules: number;
  total_notifications: number;
  active_users_today: number;
  schedules_this_week: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

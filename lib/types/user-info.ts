export interface UserInfoEvent {
  event_id: string
  user_id: string
  event_type: EventType
  event_data: Record<string, any>
  hashed_data?: Record<string, any>
  ip_address?: string
  user_agent?: string
  location_data?: LocationData
  device_info?: DeviceInfo
  security_score?: number
  risk_factors?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export type EventType =
  | "signup"
  | "login"
  | "profile_update"
  | "security_question_setup"
  | "device_verification"
  | "location_verification"
  | "otp_verification"
  | "password_change"
  | "logout"

export interface LocationData {
  latitude?: number
  longitude?: number
  country?: string
  city?: string
  region?: string
  timezone?: string
  accuracy?: number
}

export interface DeviceInfo {
  device_id: string
  browser?: string
  os?: string
  device_type?: string
  screen_resolution?: string
  timezone?: string
  language?: string
  fingerprint_hash?: string
}

export interface SecurityAssessment {
  score: number
  max_score: number
  factors: SecurityFactor[]
  risk_level: "low" | "medium" | "high" | "critical"
  recommendations?: string[]
}

export interface SecurityFactor {
  factor: string
  points: number
  verified: boolean
  description: string
}

// API Request/Response types
export interface StoreUserInfoRequest {
  event_type: EventType
  event_data: Record<string, any>
  sensitive_data?: Record<string, any>
  location_data?: LocationData
  device_info?: DeviceInfo
  security_score?: number
  risk_factors?: string[]
  metadata?: Record<string, any>
}

export interface StoreUserInfoResponse {
  success: boolean
  event_id: string
  message?: string
}

export interface GetUserInfoRequest {
  event_types?: EventType[]
  limit?: number
  offset?: number
  start_date?: string
  end_date?: string
}

export interface GetUserInfoResponse {
  success: boolean
  events: UserInfoEvent[]
  total_count: number
  has_more: boolean
}

import type { StoreUserInfoRequest, GetUserInfoRequest, EventType } from "@/lib/types/user-info"

// Mock query keys
export const userInfoKeys = {
  all: ["user-info"] as const,
  events: (filters?: GetUserInfoRequest) => [...userInfoKeys.all, "events", filters] as const,
  securityScore: () => [...userInfoKeys.all, "security-score"] as const,
}

// Mock hook implementations
export function useUserInfo(request: GetUserInfoRequest = {}, enabled = true) {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  }
}

export function useStoreUserInfo() {
  return {
    mutateAsync: async (request: StoreUserInfoRequest) => {
      console.log("[v0] Mock store user info:", request)
      return { success: true }
    },
    isPending: false,
    error: null,
  }
}

export function useUserInfoEvents(request: GetUserInfoRequest = {}, enabled = true) {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  }
}

export function useSecurityScore(enabled = true) {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  }
}

export function useVerifyData() {
  return {
    mutateAsync: async ({ eventId, fieldName, value }: { eventId: string; fieldName: string; value: string }) => {
      console.log("[v0] Mock verify data:", { eventId, fieldName, value })
      return { verified: true }
    },
    isPending: false,
    error: null,
  }
}

export function useEventsByType(eventTypes: EventType[], enabled = true) {
  return useUserInfoEvents({ event_types: eventTypes, limit: 100 }, enabled)
}

export function useLatestEvents(limit = 10, enabled = true) {
  return useUserInfoEvents({ limit }, enabled)
}

export function useSignupEvents(enabled = true) {
  return useEventsByType(["signup"], enabled)
}

export function useLoginEvents(enabled = true) {
  return useEventsByType(["login"], enabled)
}

export function useSignupIntegration() {
  const storeUserInfo = useStoreUserInfo()

  const storeSignup = async (data: {
    email: string
    displayName: string
    phoneNumber?: string
    password: string
    securityQuestions?: Array<{ question: string; answer: string }>
    locationData?: any
    deviceInfo?: any
  }) => {
    console.log("[v0] Mock storing signup event via hook")
    return storeUserInfo.mutateAsync({
      event_type: "signup",
      event_data: {
        email: data.email,
        display_name: data.displayName,
        phone_number: data.phoneNumber,
        has_security_questions: !!data.securityQuestions?.length,
      },
      sensitive_data: {
        password: data.password,
        ...(data.securityQuestions && {
          security_questions: JSON.stringify(data.securityQuestions),
        }),
      },
      location_data: data.locationData,
      device_info: data.deviceInfo,
    })
  }

  return {
    storeSignup,
    isLoading: storeUserInfo.isPending,
    error: storeUserInfo.error,
  }
}

export function useLoginIntegration() {
  const storeUserInfo = useStoreUserInfo()

  const storeLogin = async (data: {
    email: string
    loginMethod: "password" | "otp"
    securityFactors: {
      validCredentials: boolean
      trustedDevice: boolean
      recognizedLocation: boolean
      additionalVerification: boolean
    }
    deviceInfo?: any
    locationData?: any
  }) => {
    console.log("[v0] Mock storing login event via hook")
    const securityScore = calculateSecurityScore(data.securityFactors)

    return storeUserInfo.mutateAsync({
      event_type: "login",
      event_data: {
        email: data.email,
        login_method: data.loginMethod,
        security_factors: data.securityFactors,
      },
      location_data: data.locationData,
      device_info: data.deviceInfo,
      security_score: securityScore,
    })
  }

  return {
    storeLogin,
    isLoading: storeUserInfo.isPending,
    error: storeUserInfo.error,
  }
}

function calculateSecurityScore(factors: {
  validCredentials: boolean
  trustedDevice: boolean
  recognizedLocation: boolean
  additionalVerification: boolean
}): number {
  let score = 0
  if (factors.validCredentials) score += 25
  if (factors.trustedDevice) score += 25
  if (factors.recognizedLocation) score += 25
  if (factors.additionalVerification) score += 25
  return score
}

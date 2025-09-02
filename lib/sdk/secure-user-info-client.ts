interface LoginEventData {
  email: string
  loginMethod: string
  securityFactors: {
    validCredentials: boolean
    trustedDevice: boolean
    recognizedLocation: boolean
    additionalVerification: boolean
  }
}

interface EventData {
  event_type: string
  event_data: any
  [key: string]: any
}

export const userInfoClient = {
  async storeLoginEvent(data: LoginEventData): Promise<void> {
    try {
      console.log("[v0] UserInfoClient: Storing login event:", data)

      const response = await fetch("/api/user-info/store-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "login_attempt",
          event_data: data,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn("[v0] UserInfoClient: Failed to store login event:", errorText)
        // Don't throw - allow login to continue
        return
      }

      const result = await response.json()
      console.log("[v0] UserInfoClient: Login event stored successfully:", result)
    } catch (error) {
      console.warn("[v0] UserInfoClient: Login event storage error:", error)
      // Don't throw - allow login to continue
    }
  },

  async storeEvent(data: EventData): Promise<void> {
    try {
      console.log("[v0] UserInfoClient: Storing event:", data)

      const response = await fetch("/api/user-info/store-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn("[v0] UserInfoClient: Failed to store event:", errorText)
        return
      }

      const result = await response.json()
      console.log("[v0] UserInfoClient: Event stored successfully:", result)
    } catch (error) {
      console.warn("[v0] UserInfoClient: Event storage error:", error)
    }
  },

  async getUserInfo(userId: string): Promise<any> {
    try {
      const response = await fetch(`/api/user-info/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user info")
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] UserInfoClient: Get user info error:", error)
      throw error
    }
  },
}

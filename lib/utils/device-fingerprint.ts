interface DeviceFingerprint {
  userAgent: string
  screen: string
  timezone: string
  language: string
  platform: string
  canvas?: string
}

export function generateDeviceFingerprint(request: Request): string {
  const userAgent = request.headers.get("user-agent") || ""
  const acceptLanguage = request.headers.get("accept-language") || ""

  // Create a basic fingerprint from available headers
  const fingerprint = {
    userAgent,
    language: acceptLanguage,
    // In a real app, you'd collect more data from the client
  }

  return btoa(JSON.stringify(fingerprint)).substring(0, 32)
}

export function getDeviceInfo(userAgent: string) {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
  const isTablet = /iPad/.test(userAgent)

  const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop"

  const browser = userAgent.includes("Chrome")
    ? "Chrome"
    : userAgent.includes("Firefox")
      ? "Firefox"
      : userAgent.includes("Safari")
        ? "Safari"
        : "Unknown"

  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac")
      ? "macOS"
      : userAgent.includes("Linux")
        ? "Linux"
        : userAgent.includes("Android")
          ? "Android"
          : userAgent.includes("iOS")
            ? "iOS"
            : "Unknown"

  return {
    type: deviceType as "desktop" | "mobile" | "tablet",
    browser,
    os,
    name: `${browser} on ${os}`,
  }
}

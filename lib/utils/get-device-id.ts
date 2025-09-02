/**
 * Generate and manage a consistent device ID for the current browser/device
 * Used for device verification during authentication
 */

export function getDeviceId(): string {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return "server-side-device-id"
  }

  let deviceId = localStorage.getItem("deviceId")

  if (!deviceId) {
    // Generate a new device ID using crypto.randomUUID if available
    if (crypto && crypto.randomUUID) {
      deviceId = crypto.randomUUID()
    } else {
      // Fallback for older browsers - create a more unique ID
      const timestamp = Date.now().toString(36)
      const randomPart = Math.random().toString(36).substr(2, 9)
      const userAgent = navigator.userAgent.slice(-8).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      deviceId = `device-${timestamp}-${randomPart}-${userAgent}`
    }

    // Store the device ID persistently
    localStorage.setItem("deviceId", deviceId)
    console.log("[DEVICE_ID] Generated new device ID:", deviceId)
  } else {
    console.log("[DEVICE_ID] Using existing device ID:", deviceId)
  }

  return deviceId
}

/**
 * Clear the stored device ID (useful for logout or device reset)
 */
export function clearDeviceId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("deviceId")
    console.log("[DEVICE_ID] Cleared device ID")
  }
}

/**
 * Force generate a new device ID (useful for testing different devices)
 */
export function generateNewDeviceId(): string {
  if (typeof window !== "undefined") {
    localStorage.removeItem("deviceId")
    console.log("[DEVICE_ID] Forced generation of new device ID")
    return getDeviceId()
  }
  return "server-side-device-id"
}

/**
 * Get additional device information for fingerprinting
 */
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      device_id: "server-side-device-id",
      device_type: "server",
      browser: "server",
      os: "server",
      screen_resolution: "unknown",
      timezone: "unknown",
      language: "unknown",
    }
  }

  return {
    device_id: getDeviceId(),
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    browser: getBrowserInfo(),
    os: getOSInfo(),
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  }
}

function getBrowserInfo(): string {
  const userAgent = navigator.userAgent

  if (userAgent.includes("Chrome")) return "Chrome"
  if (userAgent.includes("Firefox")) return "Firefox"
  if (userAgent.includes("Safari")) return "Safari"
  if (userAgent.includes("Edge")) return "Edge"
  if (userAgent.includes("Opera")) return "Opera"

  return "Unknown"
}

function getOSInfo(): string {
  const userAgent = navigator.userAgent

  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "macOS"
  if (userAgent.includes("Linux")) return "Linux"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iOS")) return "iOS"

  return "Unknown"
}

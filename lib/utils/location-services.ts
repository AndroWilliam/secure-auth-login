interface LocationData {
  ip: string
  city: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export async function getLocationFromIP(ip: string): Promise<LocationData> {
  try {
    // In production, you'd use a proper IP geolocation service
    // For demo, we'll use a free service with fallback
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()

    return {
      ip,
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      coordinates:
        data.latitude && data.longitude
          ? {
              lat: data.latitude,
              lng: data.longitude,
            }
          : undefined,
    }
  } catch (error) {
    // Fallback location data
    return {
      ip,
      city: "Unknown",
      country: "Unknown",
    }
  }
}

export function calculateLocationRisk(currentLocation: LocationData, previousLocations: LocationData[]): number {
  // Simple risk calculation based on location history
  if (previousLocations.length === 0) return 75 // New user, medium risk

  const isRecognizedCountry = previousLocations.some((loc) => loc.country === currentLocation.country)

  const isRecognizedCity = previousLocations.some((loc) => loc.city === currentLocation.city)

  if (isRecognizedCity) return 10 // Very low risk
  if (isRecognizedCountry) return 30 // Low risk

  // Check if it's a neighboring country (simplified)
  const riskCountries = ["Unknown", "China", "Russia", "North Korea"]
  if (riskCountries.includes(currentLocation.country)) return 90 // High risk

  return 60 // Medium risk for new countries
}

export function getClientIP(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfIP = request.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) return realIP
  if (cfIP) return cfIP

  // Fallback for development
  return "127.0.0.1"
}

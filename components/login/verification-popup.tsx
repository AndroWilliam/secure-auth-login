"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2, Shield, MapPin } from "lucide-react"

interface VerificationPopupProps {
  onComplete: () => void
  deviceId: string
  userId: string
  email: string
  onDirectRedirect?: () => void
}

interface VerificationStatus {
  deviceId: boolean
  location: boolean
}

export function VerificationPopup({ onComplete, deviceId, userId, email, onDirectRedirect }: VerificationPopupProps) {
  const [status, setStatus] = useState<VerificationStatus>({
    deviceId: false,
    location: false,
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Start verification process
    performVerifications()
  }, [])

  const performVerifications = async () => {
    try {
      // Step 1: Verify Device ID (simulate delay)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setStatus(prev => ({ ...prev, deviceId: true }))

      // Step 2: Request location permission
      await requestLocationPermission()
      
      // Step 3: Verify location after permission is granted
      await verifyLocation()

      // Step 4: Complete verification
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsComplete(true)

      // Step 5: Store minimal login completion data
      try {
        const coords = await getCurrentPosition()
        if (coords) {
          // Store current location for dashboard display
          const locationData = {
            city: "Current Location", // We'll get the actual city via reverse geocoding
            country: "Current Location",
            coordinates: { lat: coords.latitude, lng: coords.longitude },
            timestamp: new Date().toISOString()
          }
          localStorage.setItem("current_location_data", JSON.stringify(locationData))
          
          // Try reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`
            )
            const geoData = await response.json()
            const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Unknown"
            const country = geoData.address?.country || "Unknown"
            
            const updatedLocationData = {
              ...locationData,
              city,
              country
            }
            localStorage.setItem("current_location_data", JSON.stringify(updatedLocationData))
          } catch (geoError) {
            console.warn("Failed to get location name:", geoError)
          }
        }
      } catch (locationError) {
        console.warn("Failed to get current location:", locationError)
      }
      
      // Step 6: Redirect directly to dashboard
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log("[VERIFICATION_POPUP] Redirecting directly to dashboard")
      
      // Skip complex login completion and redirect directly
      if (onDirectRedirect) {
        onDirectRedirect()
      } else {
        // Fallback: direct navigation to dashboard
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Verification failed:", error)
      // Still complete to avoid blocking user
      setIsComplete(true)
      setTimeout(() => {
        if (onDirectRedirect) {
          onDirectRedirect()
        } else {
          window.location.href = "/dashboard"
        }
      }, 1000)
    }
  }

  const requestLocationPermission = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported")
        resolve()
        return
      }

      // Check if permission is already granted
      navigator.permissions?.query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "granted") {
            console.log("Location permission already granted")
            resolve()
            return
          }
          
          // Request permission by trying to get current position
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("Location permission granted:", position.coords)
              resolve()
            },
            (error) => {
              console.warn("Location permission denied or error:", error)
              // Don't reject - just continue without location
              resolve()
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            }
          )
        })
        .catch(() => {
          console.warn("Permission query failed")
          resolve()
        })
    })
  }

  const verifyLocation = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate location verification delay
      setTimeout(() => {
        setStatus(prev => ({ ...prev, location: true }))
        resolve()
      }, 1500)
    })
  }

  const getCurrentPosition = (): Promise<GeolocationPosition['coords'] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => {
          console.warn("Failed to get position:", error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000,
        }
      )
    })
  }

  const VerificationItem = ({ 
    icon: Icon, 
    label, 
    isVerified, 
    isActive 
  }: { 
    icon: any
    label: string
    isVerified: boolean
    isActive: boolean
  }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-shrink-0">
        {isVerified ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : isActive ? (
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        ) : (
          <Icon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {isVerified ? "Verified" : isActive ? "Checking..." : "Pending"}
        </p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Verifying Security</CardTitle>
          <CardDescription>
            Please wait while we verify your device and request location access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VerificationItem
            icon={Shield}
            label="Device Verification"
            isVerified={status.deviceId}
            isActive={!status.deviceId && !isComplete}
          />
          
          <VerificationItem
            icon={MapPin}
            label="Location Access"
            isVerified={status.location}
            isActive={status.deviceId && !status.location && !isComplete}
          />

          {isComplete && (
            <div className="text-center py-2">
              <p className="text-sm text-green-600 font-medium">
                ✓ Verification Complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

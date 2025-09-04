"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { MapPin, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function LocationToggle() {
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [locationStatus, setLocationStatus] = useState<"checking" | "granted" | "denied" | "unavailable">("checking")

  useEffect(() => {
    const checkLocationStatus = () => {
      if (!navigator.geolocation) {
        setLocationStatus("unavailable")
        setLocationEnabled(false)
        return
      }

      // Check if location was previously granted during signup
      const signupLocationStatus = localStorage.getItem("signup_location_status")
      const currentLocationData = localStorage.getItem("current_location_data")
      
      if (signupLocationStatus === "granted" || currentLocationData) {
        setLocationEnabled(true)
        setLocationStatus("granted")
      } else if (signupLocationStatus === "denied") {
        setLocationEnabled(false)
        setLocationStatus("denied")
      } else {
        // Check current permission status
        navigator.permissions
          ?.query({ name: "geolocation" })
          .then((result) => {
            if (result.state === "granted") {
              setLocationEnabled(true)
              setLocationStatus("granted")
              localStorage.setItem("signup_location_status", "granted")
            } else {
              setLocationEnabled(false)
              setLocationStatus("denied")
            }
          })
          .catch(() => {
            setLocationEnabled(false)
            setLocationStatus("denied")
          })
      }
    }

    checkLocationStatus()
  }, [])

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      requestLocationAccess()
    } else {
      setShowDisableDialog(true)
    }
  }

  const requestLocationAccess = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      console.log("[v0] Location access granted:", position.coords)
      
      // Get location details for display
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      
      // Reverse geocode to get city/country
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
        )
        const geoData = await response.json()
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Unknown"
        const country = geoData.address?.country || "Unknown"
        
        // Store location data
        const locationData = {
          city,
          country,
          coordinates: { lat, lng },
          timestamp: new Date().toISOString()
        }
        
        localStorage.setItem("current_location_data", JSON.stringify(locationData))
      } catch (geoError) {
        console.warn("Failed to get location name:", geoError)
        // Still store coordinates even if reverse geocoding fails
        const locationData = {
          city: "Unknown",
          country: "Unknown", 
          coordinates: { lat, lng },
          timestamp: new Date().toISOString()
        }
        localStorage.setItem("current_location_data", JSON.stringify(locationData))
      }

      setLocationEnabled(true)
      setLocationStatus("granted")
      localStorage.setItem("signup_location_status", "granted")
      
      // Trigger page refresh to update the location card
      window.location.reload()
    } catch (error) {
      console.log("[v0] Location access denied:", error)
      setLocationEnabled(false)
      setLocationStatus("denied")
      localStorage.setItem("signup_location_status", "denied")
    }
  }

  const handleDisableLocation = () => {
    setLocationEnabled(false)
    setLocationStatus("denied")
    localStorage.setItem("signup_location_status", "denied")
    localStorage.removeItem("current_location_data")
    setShowDisableDialog(false)
    console.log("[v0] Location access disabled by user")
    
    // Trigger page refresh to update the location card
    window.location.reload()
  }

  const getStatusText = () => {
    switch (locationStatus) {
      case "granted":
        return locationEnabled ? "Location access enabled" : "Location access available"
      case "denied":
        return "Location access denied"
      case "unavailable":
        return "Location not available"
      default:
        return "Checking location status..."
    }
  }

  const getStatusColor = () => {
    switch (locationStatus) {
      case "granted":
        return locationEnabled ? "text-green-600" : "text-yellow-600"
      case "denied":
        return "text-red-600"
      case "unavailable":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Access
          </CardTitle>
          <CardDescription>Manage location-based security features for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Enable Location Verification</p>
              <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
            <Switch
              checked={locationEnabled}
              onCheckedChange={handleToggleChange}
              disabled={locationStatus === "unavailable"}
            />
          </div>

          {locationStatus === "denied" && !locationEnabled && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Location Access Disabled</p>
                  <p className="text-yellow-700">
                    Enable location access to improve account security and prevent unauthorized access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {locationEnabled && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Location Verification Active</p>
                  <p className="text-green-700">Your location is being used to enhance account security.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Disable Location Access?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable location verification? This will affect the security of your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Security impacts:</p>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Reducing protection against unauthorized access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Disabling location-based security alerts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Making your account more vulnerable to attacks</span>
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Enabled</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableLocation} className="bg-red-600 hover:bg-red-700">
              Disable Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

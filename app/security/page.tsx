"use client"

import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TwoFactorSetup } from "@/components/security/two-factor-setup"
import { Shield, Smartphone, Clock, AlertTriangle, CheckCircle, MapPin } from "lucide-react"

interface SecurityData {
  twoFactorEnabled: boolean
  locationAccessEnabled: boolean
  trustedDevices: Array<{
    id: string
    name: string
    type: string
    lastUsed: string
    location: string
  }>
  recentActivity: Array<{
    id: string
    event: string
    timestamp: string
    location: string
    success: boolean
  }>
}

export default function SecurityPage() {
  const [user, setUser] = useState<any>(null)
  const [securityData, setSecurityData] = useState<SecurityData>({
    twoFactorEnabled: false,
    locationAccessEnabled: false,
    trustedDevices: [],
    recentActivity: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showLocationDisclaimer, setShowLocationDisclaimer] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadSecurityData()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      redirect("/auth/login")
    }
    setUser(user)
  }

  const loadSecurityData = async () => {
    try {
      // Load user profile for 2FA status and location access
      const { data: profile } = await supabase.from("profiles").select("two_factor_enabled, location_verified").single()

      // Load trusted devices
      const { data: devices } = await supabase
        .from("trusted_devices")
        .select("*")
        .eq("is_trusted", true)
        .order("last_used_at", { ascending: false })

      // Load recent security activity
      const { data: activity } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      setSecurityData({
        twoFactorEnabled: profile?.two_factor_enabled || false,
        locationAccessEnabled: profile?.location_verified || false,
        trustedDevices:
          devices?.map((device) => ({
            id: device.id,
            name: device.device_name || "Unknown Device",
            type: device.device_type || "unknown",
            lastUsed: new Date(device.last_used_at).toLocaleDateString(),
            location: `${device.location_info?.city || "Unknown"}, ${device.location_info?.country || "Unknown"}`,
          })) || [],
        recentActivity:
          activity?.map((log) => ({
            id: log.id,
            event: log.event_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            timestamp: new Date(log.created_at).toLocaleString(),
            location: `${log.location_data?.city || "Unknown"}, ${log.location_data?.country || "Unknown"}`,
            success: log.success,
          })) || [],
      })
    } catch (error) {
      console.error("Failed to load security data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ two_factor_enabled: enabled }).eq("id", user.id)

      if (error) throw error

      setSecurityData((prev) => ({ ...prev, twoFactorEnabled: enabled }))
    } catch (error) {
      console.error("Failed to toggle 2FA:", error)
    }
  }

  const handleSetup2FA = async (code: string) => {
    // In production, verify the TOTP code against the secret
    console.log("[v0] Setting up 2FA with code:", code)

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (code === "123456") {
      // Demo: accept specific code
      await handleToggle2FA(true)
      return true
    }

    return code.length === 6 // Accept any 6-digit code for demo
  }

  const removeTrustedDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase.from("trusted_devices").delete().eq("id", deviceId)

      if (error) throw error

      setSecurityData((prev) => ({
        ...prev,
        trustedDevices: prev.trustedDevices.filter((device) => device.id !== deviceId),
      }))
    } catch (error) {
      console.error("Failed to remove trusted device:", error)
    }
  }

  const handleLocationToggle = async (enabled: boolean) => {
    if (!enabled && securityData.locationAccessEnabled) {
      // Show disclaimer when disabling
      setShowLocationDisclaimer(true)
      return
    }

    if (enabled && !securityData.locationAccessEnabled) {
      // Request location access
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          })
        })

        // Update database
        const { error } = await supabase.from("profiles").update({ location_verified: true }).eq("id", user.id)

        if (error) throw error

        setSecurityData((prev) => ({ ...prev, locationAccessEnabled: true }))
      } catch (error) {
        console.error("Failed to enable location access:", error)
        alert("Location access was denied. Please enable location permissions in your browser settings.")
      }
    }
  }

  const confirmDisableLocation = async () => {
    try {
      const { error } = await supabase.from("profiles").update({ location_verified: false }).eq("id", user.id)

      if (error) throw error

      setSecurityData((prev) => ({ ...prev, locationAccessEnabled: false }))
      setShowLocationDisclaimer(false)
    } catch (error) {
      console.error("Failed to disable location access:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground">Manage your account security and privacy settings</p>
        </div>

        {/* Location Access Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Access
            </CardTitle>
            <CardDescription>Control location-based security features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Location Access</p>
                <p className="text-sm text-muted-foreground">
                  {securityData.locationAccessEnabled
                    ? "Location verification is active for enhanced security"
                    : "Location verification is disabled"}
                </p>
              </div>
              <Button
                variant={securityData.locationAccessEnabled ? "default" : "outline"}
                onClick={() => handleLocationToggle(!securityData.locationAccessEnabled)}
              >
                {securityData.locationAccessEnabled ? "Enabled" : "Enable"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <TwoFactorSetup isEnabled={securityData.twoFactorEnabled} onToggle={handleToggle2FA} onSetup={handleSetup2FA} />

        {/* Trusted Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Trusted Devices
            </CardTitle>
            <CardDescription>Devices that don't require additional verification</CardDescription>
          </CardHeader>
          <CardContent>
            {securityData.trustedDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trusted devices found</p>
            ) : (
              <div className="space-y-4">
                {securityData.trustedDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last used: {device.lastUsed} • {device.location}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeTrustedDevice(device.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Security Activity
            </CardTitle>
            <CardDescription>Your latest authentication and security events</CardDescription>
          </CardHeader>
          <CardContent>
            {securityData.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {securityData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {activity.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{activity.event}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.timestamp} • {activity.location}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activity.success ? "Success" : "Failed"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </CardTitle>
            <CardDescription>Your current security status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Email Verified</p>
                  <p className="text-sm text-green-700">Your email address is confirmed</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-4 border rounded-lg ${
                  securityData.twoFactorEnabled ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                {securityData.twoFactorEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className={`font-medium ${securityData.twoFactorEnabled ? "text-green-800" : "text-yellow-800"}`}>
                    Two-Factor Authentication
                  </p>
                  <p className={`text-sm ${securityData.twoFactorEnabled ? "text-green-700" : "text-yellow-700"}`}>
                    {securityData.twoFactorEnabled ? "Enabled and active" : "Not enabled"}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-4 border rounded-lg ${
                  securityData.locationAccessEnabled ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                {securityData.locationAccessEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p
                    className={`font-medium ${securityData.locationAccessEnabled ? "text-green-800" : "text-yellow-800"}`}
                  >
                    Location Access
                  </p>
                  <p className={`text-sm ${securityData.locationAccessEnabled ? "text-green-700" : "text-yellow-700"}`}>
                    {securityData.locationAccessEnabled ? "Enabled and active" : "Not enabled"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showLocationDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Disable Location Access?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to disable Location Access? This will affect the security of your account by:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Reducing protection against unauthorized access</li>
                <li>• Disabling location-based security alerts</li>
                <li>• Making it harder to detect suspicious activity</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowLocationDisclaimer(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDisableLocation} className="flex-1">
                  Disable Anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

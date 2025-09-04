import { redirect } from "next/navigation"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, MapPin, Smartphone, Clock } from "lucide-react"
import { LocationToggle } from "@/components/dashboard/location-toggle"

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch signup and login event data
  const serviceClient = createServiceClient()
  const userId = data.user.id

  // Get signup event data
  const { data: signupEvents } = await serviceClient
    .from("user_info_events")
    .select("event_data")
    .eq("user_id", userId)
    .eq("event_type", "signup_completed")
    .order("created_at", { ascending: false })
    .limit(1)

  // Get latest login event data
  const { data: loginEvents } = await serviceClient
    .from("user_info_events")
    .select("event_data, created_at")
    .eq("user_id", userId)
    .eq("event_type", "login_completed")
    .order("created_at", { ascending: false })
    .limit(1)

  // Get all unique devices for this user
  const { data: allLoginEvents } = await serviceClient
    .from("user_info_events")
    .select("event_data")
    .eq("user_id", userId)
    .eq("event_type", "login_completed")

  const signupData = signupEvents?.[0]?.event_data
  const loginData = loginEvents?.[0]?.event_data
  const lastLoginTime = loginEvents?.[0]?.created_at

  // Extract location and device info
  const signupLocation = signupData?.locationData || signupData?.geo_location
  const signupDeviceId = signupData?.device_id
  const currentLocation = loginData?.locationData || loginData?.geo_location
  const currentDeviceId = loginData?.device_id

  // Check localStorage for current location data (from location toggle)
  let storedLocationData = null
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('current_location_data')
      if (stored) {
        storedLocationData = JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to parse stored location data:', e)
    }
  }

  // Get device names from user agent strings and device info
  const getDeviceName = (deviceId: string, eventData: any) => {
    // Try to extract device info from the event data
    const deviceInfo = eventData?.deviceInfo || eventData?.device_fingerprint || {}
    
    // Check for common device patterns in user agent or device info
    const userAgent = deviceInfo.userAgent || ""
    const platform = deviceInfo.platform || ""
    const screenResolution = deviceInfo.screenResolution || ""
    
    // iPhone detection with model
    if (userAgent.includes("iPhone")) {
      if (userAgent.includes("iPhone15,2") || userAgent.includes("iPhone15,3")) return "iPhone 14 Pro"
      if (userAgent.includes("iPhone15,4") || userAgent.includes("iPhone15,5")) return "iPhone 14"
      if (userAgent.includes("iPhone14,7") || userAgent.includes("iPhone14,8")) return "iPhone 13"
      if (userAgent.includes("iPhone13,1") || userAgent.includes("iPhone13,2")) return "iPhone 12"
      if (userAgent.includes("iPhone12,1") || userAgent.includes("iPhone12,3")) return "iPhone 11"
      return "iPhone"
    }
    
    // iPad detection
    if (userAgent.includes("iPad")) {
      if (userAgent.includes("iPad13,")) return "iPad Air"
      if (userAgent.includes("iPad14,")) return "iPad mini"
      return "iPad"
    }
    
    // Android detection with model hints
    if (userAgent.includes("Android")) {
      if (userAgent.includes("SM-")) return "Samsung Galaxy"
      if (userAgent.includes("Pixel")) return "Google Pixel"
      if (userAgent.includes("OnePlus")) return "OnePlus"
      return "Android Device"
    }
    
    // Mac detection with model hints
    if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS") || platform.includes("Mac")) {
      if (userAgent.includes("MacBookAir")) return "MacBook Air"
      if (userAgent.includes("MacBookPro")) return "MacBook Pro"
      if (userAgent.includes("MacBook")) return "MacBook"
      if (userAgent.includes("iMac")) return "iMac"
      if (userAgent.includes("Mac Pro")) return "Mac Pro"
      if (userAgent.includes("Mac mini")) return "Mac mini"
      return "Mac"
    }
    
    // Windows detection
    if (userAgent.includes("Windows") || platform.includes("Win")) {
      if (userAgent.includes("Windows NT 10.0")) return "Windows 10/11 PC"
      if (userAgent.includes("Windows NT 6.3")) return "Windows 8.1 PC"
      if (userAgent.includes("Windows NT 6.1")) return "Windows 7 PC"
      return "Windows PC"
    }
    
    // Linux detection
    if (userAgent.includes("Linux") || platform.includes("Linux")) {
      if (userAgent.includes("Ubuntu")) return "Ubuntu PC"
      if (userAgent.includes("Fedora")) return "Fedora PC"
      if (userAgent.includes("Debian")) return "Debian PC"
      return "Linux PC"
    }
    
    // Fallback based on screen resolution for better naming
    if (screenResolution) {
      const [width, height] = screenResolution.split('x').map(Number)
      if (width >= 1920 && height >= 1080) return "Desktop Computer"
      if (width >= 768 && height >= 1024) return "Tablet"
      if (width <= 480) return "Mobile Device"
    }
    
    // Try to extract device info from device ID
    if (deviceId && deviceId.startsWith('device-')) {
      const hash = deviceId.replace('device-', '')
      return `Device ${hash.slice(0, 4).toUpperCase()}`
    }
    
    // Final fallback - try to be more descriptive
    if (platform) {
      return `${platform} Device`
    }
    
    return "Computer"
  }

  // Count unique devices and get their names
  const uniqueDevices = new Set()
  const deviceNames = new Set()
  
  // Add signup device
  if (signupDeviceId) {
    uniqueDevices.add(signupDeviceId)
    deviceNames.add(getDeviceName(signupDeviceId, signupData))
  }
  
  // Add all login devices
  allLoginEvents?.forEach(event => {
    if (event.event_data?.device_id) {
      uniqueDevices.add(event.event_data.device_id)
      deviceNames.add(getDeviceName(event.event_data.device_id, event.event_data))
    }
  })

  const trustedDevicesCount = uniqueDevices.size
  const deviceNamesArray = Array.from(deviceNames)

  // Format last login time
  const formatLastLogin = (timestamp: string) => {
    if (!timestamp) return "Never"
    const now = new Date()
    const loginTime = new Date(timestamp)
    const diffMs = now.getTime() - loginTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return loginTime.toLocaleDateString()
  }

  const handleSignOut = async () => {
    "use server"
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {data.user.email}</p>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline">Sign Out</Button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Security</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Secure</div>
              <p className="text-xs text-muted-foreground">Multi-layer authentication active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trusted Devices</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deviceNamesArray.filter(name => name !== 'Unknown Device').length}</div>
              <p className="text-xs text-muted-foreground">Devices recognized</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Login</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLastLogin(lastLoginTime || "")}</div>
              <p className="text-xs text-muted-foreground">Current session</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>Your latest authentication events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Successful Login</p>
                    <p className="text-sm text-muted-foreground">Multi-step verification completed</p>
                  </div>
                  <span className="text-sm text-muted-foreground">Just now</span>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Location Verified</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {storedLocationData && (storedLocationData.city !== 'Unknown' || storedLocationData.country !== 'Unknown') ? (
                        <div>
                          <p><strong>Current Location:</strong> {storedLocationData.city || 'Unknown'}, {storedLocationData.country || 'Unknown'}</p>
                          <p className="text-xs font-mono">Coords: {storedLocationData.coordinates?.lat?.toFixed(6) || 'N/A'}, {storedLocationData.coordinates?.lng?.toFixed(6) || 'N/A'}</p>
                        </div>
                      ) : currentLocation && (currentLocation.city !== 'Unknown' || currentLocation.country !== 'Unknown') ? (
                        <div>
                          <p><strong>Current Location:</strong> {currentLocation.city || 'Unknown'}, {currentLocation.country || 'Unknown'}</p>
                          <p className="text-xs font-mono">Coords: {currentLocation.coordinates?.lat?.toFixed(6) || currentLocation.latitude?.toFixed(6) || 'N/A'}, {currentLocation.coordinates?.lng?.toFixed(6) || currentLocation.longitude?.toFixed(6) || 'N/A'}</p>
                        </div>
                      ) : signupLocation && (signupLocation.city !== 'Unknown' || signupLocation.country !== 'Unknown') ? (
                        <div>
                          <p><strong>Signup Location:</strong> {signupLocation.city || 'Unknown'}, {signupLocation.country || 'Unknown'}</p>
                          <p className="text-xs font-mono">Coords: {signupLocation.coordinates?.lat?.toFixed(6) || signupLocation.latitude?.toFixed(6) || 'N/A'}, {signupLocation.coordinates?.lng?.toFixed(6) || signupLocation.longitude?.toFixed(6) || 'N/A'}</p>
                        </div>
                      ) : (
                        <div>
                          <p><strong>Location Access Disabled</strong></p>
                          <p className="text-xs">Enable location access in settings below to see your current location</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Just now</span>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Device Verified</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {deviceNamesArray.length > 0 ? (
                        <div>
                          <p><strong>Trusted Devices ({deviceNamesArray.length}):</strong></p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {deviceNamesArray
                              .filter(name => name !== 'Unknown Device') // Remove unknown devices
                              .map((deviceName, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {deviceName}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>No device data available</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <LocationToggle />
        </div>
      </div>
    </div>
  )
}

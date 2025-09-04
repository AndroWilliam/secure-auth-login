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

  // Get device names from user agent strings
  const getDeviceName = (deviceId: string) => {
    // This is a simplified device detection - in a real app you'd store device names
    if (deviceId.includes("server-side")) {
      return "Current Device"
    }
    return "Unknown Device"
  }

  // Count unique devices and get their names
  const uniqueDevices = new Set()
  const deviceNames = new Set()
  
  if (signupDeviceId) {
    uniqueDevices.add(signupDeviceId)
    deviceNames.add("Signup Device")
  }
  
  allLoginEvents?.forEach(event => {
    if (event.event_data?.device_id) {
      uniqueDevices.add(event.event_data.device_id)
      deviceNames.add(getDeviceName(event.event_data.device_id))
    }
  })

  const trustedDevicesCount = uniqueDevices.size

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
              <div className="text-2xl font-bold">{trustedDevicesCount}</div>
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
                      {currentLocation && (currentLocation.city !== 'Unknown' || currentLocation.country !== 'Unknown') ? (
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
                      {deviceNames.size > 0 ? (
                        <div>
                          <p><strong>Trusted Devices ({trustedDevicesCount}):</strong></p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.from(deviceNames).map((deviceName, index) => (
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

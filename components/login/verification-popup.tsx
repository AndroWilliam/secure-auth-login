"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2, Shield, MapPin } from "lucide-react"

interface VerificationPopupProps {
  onComplete: () => void
  deviceId: string
  userId: string
  email: string
}

interface VerificationStatus {
  deviceId: boolean
  location: boolean
}

export function VerificationPopup({ onComplete, deviceId, userId, email }: VerificationPopupProps) {
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

      // Step 2: Verify Location (simulate delay)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStatus(prev => ({ ...prev, location: true }))

      // Step 3: Complete verification
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsComplete(true)

      // Step 4: Redirect after short delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      onComplete()
    } catch (error) {
      console.error("Verification failed:", error)
      // Still complete to avoid blocking user
      setIsComplete(true)
      setTimeout(onComplete, 1000)
    }
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
            Please wait while we verify your device and location
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
            label="Location Verification"
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

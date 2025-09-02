"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Smartphone, Monitor, AlertTriangle, Shield } from "lucide-react"

interface DeviceInfo {
  fingerprint: string
  name: string
  type: "desktop" | "mobile" | "tablet"
  browser: string
  os: string
  isTrusted: boolean
}

interface DeviceVerificationStepProps {
  onNext: () => void
  isLoading?: boolean
  deviceId?: string
  isTrusted?: boolean
}

export function DeviceVerificationStep({ onNext, isLoading, deviceId, isTrusted = false }: DeviceVerificationStepProps) {
  const deviceInfo = {
    fingerprint: deviceId || "unknown-device-id",
    name: "Current Device",
    type: "desktop" as const,
    browser: "Chrome",
    os: "Windows",
    isTrusted,
  }

  const [trustDevice, setTrustDevice] = useState(false)

  useEffect(() => {
    console.log("[v0] Device ID collected:", deviceInfo.fingerprint)
    console.log("[v0] Device Info:", {
      name: deviceInfo.name,
      type: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      isTrusted: deviceInfo.isTrusted,
    })
  }, []) // Removed deviceInfo from the dependency array

  const handleContinue = () => {
    onNext()
  }

  const getDeviceIcon = () => {
    switch (deviceInfo.type) {
      case "mobile":
        return <Smartphone className="h-8 w-8" />
      case "tablet":
        return <Smartphone className="h-8 w-8" />
      default:
        return <Monitor className="h-8 w-8" />
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Device Verification</CardTitle>
        <CardDescription>
          {deviceInfo.isTrusted
            ? "Welcome back! This device is recognized."
            : "We're verifying this device for security purposes."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Information */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="text-muted-foreground">{getDeviceIcon()}</div>
          <div className="flex-1">
            <h3 className="font-medium">{deviceInfo.name}</h3>
            <p className="text-sm text-muted-foreground">
              {deviceInfo.browser} on {deviceInfo.os}
            </p>
            <p className="text-xs text-muted-foreground font-mono">ID: {deviceInfo.fingerprint}</p>
          </div>
          {deviceInfo.isTrusted ? (
            <Shield className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
        </div>

        {/* Trust Device Option */}
        {!deviceInfo.isTrusted && (
          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Checkbox id="trustDevice" checked={trustDevice} onCheckedChange={(checked) => setTrustDevice(!!checked)} />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="trustDevice"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Trust this device
              </Label>
              <p className="text-xs text-muted-foreground">
                Skip verification on this device for 90 days. Only check this on your personal devices.
              </p>
            </div>
          </div>
        )}

        <Button onClick={handleContinue} disabled={isLoading} className="w-full">
          {isLoading ? "Processing..." : "Continue"}
        </Button>
      </CardContent>
    </Card>
  )
}

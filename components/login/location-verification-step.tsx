"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, AlertTriangle, Shield, RefreshCw, Globe } from "lucide-react"
import { getRiskLabel, getScoreColor, getProgressColor } from "@/lib/utils/security-scoring"

interface LocationInfo {
  city: string
  country: string
  isRecognized: boolean
  securityScore: number
  ipAddress: string
}

interface LocationVerificationStepProps {
  onNext: () => void
  isLoading?: boolean
}

export function LocationVerificationStep({ onNext, isLoading }: LocationVerificationStepProps) {
  const locationInfo = {
    city: "Current City",
    country: "Current Country",
    isRecognized: true,
    securityScore: 85,
    ipAddress: "192.168.1.1",
  }

  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!locationInfo.isRecognized && !otpSent) {
      handleSendOTP()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSendOTP = async () => {
    try {
      // Simulate sending OTP
      console.log("OTP sent")
      setOtpSent(true)
      setCountdown(60)
      setError(null)
    } catch (error) {
      setError("Failed to send verification code. Please try again.")
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setVerifying(true)
    setError(null)

    try {
      // Simulate OTP verification
      const success = otpCode === "123456"
      if (success) {
        setOtpVerified(true)
      } else {
        setError("Invalid or expired code")
      }
    } catch (error) {
      setError("Verification failed. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const handleContinue = () => {
    onNext()
  }

  const canProceed = locationInfo.isRecognized || otpVerified

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Location Verification</CardTitle>
        <CardDescription>
          {locationInfo.isRecognized ? "Login from recognized location" : "We detected a login from a new location"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="text-muted-foreground">
              <Globe className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {locationInfo.city}, {locationInfo.country}
              </h3>
              <p className="text-sm text-muted-foreground">IP: {locationInfo.ipAddress}</p>
            </div>
            {locationInfo.isRecognized ? (
              <Shield className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
          </div>

          {/* Security Assessment */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Security Assessment</span>
              <span className={`text-sm font-medium ${getScoreColor(locationInfo.securityScore)}`}>
                {getRiskLabel(locationInfo.securityScore)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(locationInfo.securityScore)}`}
                style={{ width: `${locationInfo.securityScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Security Score: {locationInfo.securityScore}/100
              {locationInfo.securityScore < 50 && " - Additional verification required"}
            </p>
          </div>
        </div>

        {/* Location OTP Verification for low security scores */}
        {!locationInfo.isRecognized && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Additional Verification Required</span>
              </div>
              <p className="text-sm text-yellow-700">
                Your current security score is low. We've sent a verification code to your registered email to increase
                security.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationOTP">Location Verification Code</Label>
              <Input
                id="locationOTP"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""))
                  if (error) setError(null)
                }}
                className={`text-center text-lg tracking-widest ${error ? "border-destructive" : ""}`}
                disabled={otpVerified}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6 || otpVerified || verifying}
                className="flex-1"
              >
                {verifying ? "Verifying..." : otpVerified ? "Verified ✓" : "Verify Location"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendOTP}
                disabled={countdown > 0 || otpVerified}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {countdown > 0 ? `${countdown}s` : "Resend"}
              </Button>
            </div>
          </div>
        )}

        <Button onClick={handleContinue} disabled={!canProceed || isLoading} className="w-full">
          {isLoading ? "Completing Login..." : "Complete Login"}
        </Button>
      </CardContent>
    </Card>
  )
}

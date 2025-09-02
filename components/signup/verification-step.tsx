"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

interface VerificationStepProps {
  email: string
  phoneNumber: string
  onNext: () => void
  onResendOTP: (type: "email" | "phone") => Promise<void>
  onVerifyOTP: (type: "email" | "phone", code: string) => Promise<boolean>
  isLoading?: boolean
  prefillCode?: string
}

export function VerificationStep({
  email,
  phoneNumber,
  onNext,
  onResendOTP,
  onVerifyOTP,
  isLoading,
  prefillCode,
}: VerificationStepProps) {
  const [emailOTP, setEmailOTP] = useState("")
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [verifying, setVerifying] = useState<{ email?: boolean }>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setEmailCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Do not auto-fill OTP. Keep the input empty until user types the code received via email.
  useEffect(() => {
    setEmailOTP("")
  }, [])

  const handleVerifyOTP = async (type: "email") => {
    const code = emailOTP
    if (!code || code.length !== 6) {
      setErrors({ ...errors, [type]: "Please enter a valid 6-digit code" })
      return
    }

    setVerifying({ ...verifying, [type]: true })
    setErrors({ ...errors, [type]: undefined })

    try {
      const success = await onVerifyOTP(type, code)
      if (success) {
        setEmailVerified(true)
      } else {
        setErrors({ ...errors, [type]: "Invalid or expired code" })
      }
    } catch (error) {
      setErrors({ ...errors, [type]: "Verification failed. Please try again." })
    } finally {
      setVerifying({ ...verifying, [type]: false })
    }
  }

  const handleResendOTP = async (type: "email") => {
    try {
      await onResendOTP(type)
      setEmailCountdown(60)
    } catch (error) {
      setErrors({ ...errors, [type]: "Failed to resend code. Please try again." })
    }
  }

  const canProceed = emailVerified

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
        <CardDescription>We've sent a verification code to your email address</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailOTP">Email Verification Code</Label>
            <Input
              id="emailOTP"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={emailOTP}
              onChange={(e) => {
                setEmailOTP(e.target.value.replace(/\D/g, ""))
                if (errors.email) setErrors({ ...errors, email: undefined })
              }}
              className={`text-center text-lg tracking-widest ${errors.email ? "border-destructive" : ""}`}
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]*"
              name="email-otp"
              disabled={emailVerified}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleVerifyOTP("email")}
              disabled={emailOTP.length !== 6 || emailVerified || verifying.email}
              className="flex-1"
            >
              {verifying.email ? "Verifying..." : emailVerified ? "Verified ✓" : "Verify Email"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResendOTP("email")}
              disabled={emailCountdown > 0 || emailVerified}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {emailCountdown > 0 ? `${emailCountdown}s` : "Resend"}
            </Button>
          </div>

          {phoneNumber && (
            <div className="mt-6 text-center p-4 bg-muted rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Phone number <strong>{phoneNumber}</strong> has been saved to your account
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button onClick={onNext} disabled={!canProceed || isLoading} className="w-full">
            {isLoading ? "Processing..." : "Continue to Security Setup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

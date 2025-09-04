"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
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

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    if (emailOTP.length === 6 && !emailVerified && !verifying.email) {
      handleVerifyOTP("email")
    }
  }, [emailOTP, emailVerified, verifying.email])

  // Auto-proceed to next step when verified
  useEffect(() => {
    if (emailVerified && !isLoading) {
      onNext()
    }
  }, [emailVerified, isLoading, onNext])

  const handleVerifyOTP = useCallback(async (type: "email") => {
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
        setEmailOTP("") // Clear the input on error
      }
    } catch (error) {
      setErrors({ ...errors, [type]: "Verification failed. Please try again." })
      setEmailOTP("") // Clear the input on error
    } finally {
      setVerifying({ ...verifying, [type]: false })
    }
  }, [emailOTP, errors, verifying, onVerifyOTP])

  const handleResendOTP = async (type: "email") => {
    try {
      await onResendOTP(type)
      setEmailCountdown(60)
    } catch (error) {
      setErrors({ ...errors, [type]: "Failed to resend code. Please try again." })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
        <CardDescription>We've sent a verification code to your email address</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={emailOTP}
                onChange={(value) => {
                  setEmailOTP(value)
                  if (errors.email) setErrors({ ...errors, email: undefined })
                }}
                disabled={emailVerified || verifying.email}
                containerClassName="gap-3"
              >
                <InputOTPGroup className="gap-3">
                  <InputOTPSlot index={0} className="w-12 h-12 text-lg font-semibold" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-lg font-semibold" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-lg font-semibold" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-lg font-semibold" />
                  <InputOTPSlot index={4} className="w-12 h-12 text-lg font-semibold" />
                  <InputOTPSlot index={5} className="w-12 h-12 text-lg font-semibold" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            {errors.email && (
              <p className="text-sm text-destructive text-center">{errors.email}</p>
            )}
            
            {verifying.email && (
              <p className="text-sm text-muted-foreground text-center">Verifying...</p>
            )}
            
            {emailVerified && (
              <p className="text-sm text-green-600 text-center">✓ Email verified successfully!</p>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => handleResendOTP("email")}
              disabled={emailCountdown > 0 || emailVerified || verifying.email}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {emailCountdown > 0 ? `${emailCountdown}s` : "Resend Code"}
            </Button>
          </div>

          {phoneNumber && (
            <div className="text-center p-4 bg-muted rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Phone number <strong>{phoneNumber}</strong> has been saved to your account
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

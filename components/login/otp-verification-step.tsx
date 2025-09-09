"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OtpInputBasic } from "./otp-input-basic"
import { Mail, ArrowLeft } from "lucide-react"

interface OtpVerificationStepProps {
  onNext: (otpCode: string) => void
  onBack: () => void
  isLoading?: boolean
  email: string
  onResendOtp: () => void
}

export function OtpVerificationStep({ onNext, onBack, isLoading, email, onResendOtp }: OtpVerificationStepProps) {
  const [otpCode, setOtpCode] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && !isLoading) {
      onNext(otpCode)
    }
  }, [otpCode, isLoading, onNext])

  const handleResend = async () => {
    setIsResending(true)
    setError(null)
    try {
      await onResendOtp()
    } catch (err) {
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We sent a verification code to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Mail className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">{email}</span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <OtpInputBasic
              value={otpCode}
              onChange={(v) => {
                setOtpCode(v);
                if (error) setError(null);
              }}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center">Verifying...</p>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResend}
            disabled={isResending || isLoading}
          >
            {isResending ? "Sending..." : "Resend Code"}
          </Button>
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

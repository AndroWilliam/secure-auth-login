"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
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
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value)
                if (error) setError(null)
              }}
              disabled={isLoading}
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

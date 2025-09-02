"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.trim().length >= 4) {
      onNext(otpCode.trim())
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await onResendOtp()
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest"
              disabled={isLoading}
              autoComplete="off"
              inputMode="numeric"
              name="otp-verification"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || otpCode.trim().length < 4}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
        </form>

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

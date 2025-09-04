"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to login page
          router.push("/auth/login")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup timer on component unmount
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Registration Complete!</CardTitle>
          <CardDescription>Your account has been successfully created with multi-layer security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Security Features Enabled:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Email verification</li>
              <li>✓ Phone number verification</li>
              <li>✓ Location-based security</li>
              <li>✓ Security questions setup</li>
              <li>✓ Device fingerprinting</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to login page in {countdown} seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

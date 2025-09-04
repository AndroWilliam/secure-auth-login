 "use client"

//  export default function SignupPageDebug() {
//   return (
//     <main style={{ padding: 24 }}>
//       <h1>Signup debug</h1>
//       <p>If you can see this, the route is fine and one of the imported components was crashing.</p>
//     </main>
//   );
// }

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { userInfoClient } from "@/lib/sdk/secure-user-info-client"
import { getDeviceId } from "@/lib/utils/get-device-id"
import { SignupProgress } from "@/components/signup/signup-progress"
import { IdentitySetupStep } from "@/components/signup/identity-setup-step"
import { VerificationStep } from "@/components/signup/verification-step"
import { LocationSecurityStep } from "@/components/signup/location-security-step"
import Link from "next/link"

interface SignupData {
  identity: {
    email: string
    password: string
    confirmPassword: string
    displayName: string
    phoneNumber: string
  }
  verification: {
    emailVerified: boolean
    phoneVerified: boolean
  }
  security: {
    securityQuestions: Array<{ question: string; answer: string }>
    locationVerified: boolean
    locationData?: {
      city: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
  }
}

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const [accountCreated, setAccountCreated] = useState(false)
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)

  const [signupData, setSignupData] = useState<SignupData>({
    identity: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      phoneNumber: "",
    },
    verification: {
      emailVerified: false,
      phoneVerified: false,
    },
    security: {
      securityQuestions: [
        { question: "", answer: "" },
        { question: "", answer: "" },
      ],
      locationVerified: false,
    },
  })

  const handleIdentityNext = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Sending OTP to:", signupData.identity.email)
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", contact: signupData.identity.email, email: signupData.identity.email }),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error("Failed to send verification code" + (detail ? `: ${detail}` : ""))
      }

      // In dev, backend may return devOtp but we no longer prefill the UI.

      console.log("[v0] Proceeding to verification step")
      setCurrentStep(2)
    } catch (error: any) {
      console.log("[v0] Caught error:", error)
      setError(error.message || "Failed to proceed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async (type: "email" | "phone") => {
    if (type === "email") {
      try {
        console.log("[v0] Resending OTP for email:", signupData.identity.email)

        const response = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "email",
            contact: signupData.identity.email,
          }),
        })

        console.log("[v0] Resend response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.log("[v0] Resend error response:", errorText)
          throw new Error("Failed to resend verification code")
        }

        // Do not prefill OTP in UI in any mode
      } catch (error: any) {
        console.log("[v0] Resend error:", error)
        setError(error.message || "Failed to resend verification code")
      }
    }
  }

  const handleVerifyOTP = async (type: "email" | "phone", code: string) => {
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          contact: type === "email" ? signupData.identity.email : signupData.identity.phoneNumber,
          otpCode: code,
          // IMPORTANT: send the password collected in step 1 so the server
          // can create the Supabase Auth user at verify time.
          password: signupData.identity.password,
        }),
      })
  
      const json = await response.json().catch(() => ({} as any))
  
      if (response.ok) {
        // mark this factor verified in the UI
        setSignupData((prev) => ({
          ...prev,
          verification: {
            ...prev.verification,
            [type === "email" ? "emailVerified" : "phoneVerified"]: true,
          },
        }))
  
        // if the server already created the auth user, remember that so we don't call signUp again
        if (json?.user_id) setCreatedUserId(json.user_id as string)
        if (json?.ok || json?.created) setAccountCreated(true)
  
        return true
      } else {
        console.error("OTP verify failed:", json)
        return false
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      return false
    }
  }

  const handleVerificationNext = () => {
    setCurrentStep(3)
  }

  const handleCompleteSignup = async () => {
    setIsLoading(true)
    setError(null)
  
    try {
      console.log("[v0] Completing signup")
  
      let userId: string | null = createdUserId
  
      // If account wasn't created during OTP verify, create it now.
      if (!accountCreated) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: signupData.identity.email,
          password: signupData.identity.password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
            data: {
              display_name: signupData.identity.displayName,
              phone_number: signupData.identity.phoneNumber,
            },
          },
        })
        if (authError) {
          console.error("Supabase signup error:", authError)
          throw new Error(authError.message)
        }
        userId = authData.user?.id ?? userId
        // mark we created it here
        setAccountCreated(true)
        setCreatedUserId(userId ?? null)
      }
  
      // === From here on we have a userId, whether created during verify or here ===
      if (userId) {
        try {
          // Generate IP-based device ID
          const deviceResponse = await fetch("/api/device/generate-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!deviceResponse.ok) {
            throw new Error("Failed to generate device ID");
          }
          
          const { deviceId } = await deviceResponse.json();
          console.log("[SIGNUP] Generated IP-based device ID:", deviceId);
  
          // Store signup completed event with device ID
          await fetch("/api/user-info/store-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_type: "signup_completed",
              event_data: {
                userId: userId,
                email: signupData.identity.email,
                device_id: deviceId,
                locationData: signupData.security.locationData,
                geo_location: {
                  latitude: signupData.security.locationData?.coordinates?.lat,
                  longitude: signupData.security.locationData?.coordinates?.lng,
                  radius: 50000,
                },
                securityQuestions: signupData.security.securityQuestions,
              },
            }),
          })
        } catch (userInfoError) {
          console.warn("Failed to store user info, but account exists:", userInfoError)
        }
  
        try {
          // Generate IP-based device ID for event storage
          const deviceResponse = await fetch("/api/device/generate-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!deviceResponse.ok) {
            throw new Error("Failed to generate device ID");
          }
          
          const { deviceId } = await deviceResponse.json();
          console.log("[SIGNUP] Using IP-based device ID for event:", deviceId);
          
          // Get device fingerprint information
          const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            colorDepth: screen.colorDepth || 0,
            pixelRatio: window.devicePixelRatio || 1,
          };

          // Get IP and timestamp from device response
          const deviceResponse = await fetch("/api/device/generate-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!deviceResponse.ok) {
            throw new Error("Failed to generate device ID");
          }
          
          const deviceData = await deviceResponse.json();

          await userInfoClient.storeEvent({
            event_type: "signup_completed",
            event_data: {
              userId,
              email: signupData.identity.email,
              device_id: deviceId, // This is now the hardware fingerprint
              deviceInfo,
              ipAddress: deviceData.ipAddress, // Collected for future use
              timestamp: deviceData.timestamp, // Collected for future use
              locationData: signupData.location.locationData,
              geo_location: signupData.location.locationData?.coordinates ? {
                latitude: signupData.location.locationData.coordinates.lat,
                longitude: signupData.location.locationData.coordinates.lng,
                radius: 50000
              } : null,
              eventTimestamp: new Date().toISOString(),
            },
          })
        } catch (eventError) {
          console.warn("Failed to store signup event, but account exists:", eventError)
        }
  
        try {
          const profileResponse = await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              displayName: signupData.identity.displayName,
              phoneNumber: signupData.identity.phoneNumber,
              securityQuestions: signupData.security.securityQuestions,
              locationData: signupData.security.locationData,
            }),
          })
          if (!profileResponse.ok) {
            console.warn("Failed to save profile data, but account exists")
          }
        } catch (profileError) {
          console.warn("Profile creation failed, but account exists:", profileError)
        }
      }
  
      console.log("[v0] Signup completed successfully")
      router.push("/auth/signup-success")
    } catch (error: any) {
      console.error("[v0] Signup completion error:", error)
      setError(error.message || "Failed to complete registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <SignupProgress currentStep={currentStep} totalSteps={3} />

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {currentStep === 1 && (
          <IdentitySetupStep
            data={signupData.identity}
            onDataChange={(data) => setSignupData((prev) => ({ ...prev, identity: data }))}
            onNext={handleIdentityNext}
            isLoading={isLoading}
          />
        )}

        {currentStep === 2 && (
          <VerificationStep
            email={signupData.identity.email}
            phoneNumber={signupData.identity.phoneNumber}
            onNext={handleVerificationNext}
            onResendOTP={handleResendOTP}
            onVerifyOTP={handleVerifyOTP}
            isLoading={isLoading}
            prefillCode={undefined}
          />
        )}

        {currentStep === 3 && (
          <LocationSecurityStep
            data={signupData.security}
            onDataChange={(data) => setSignupData((prev) => ({ ...prev, security: data }))}
            onComplete={handleCompleteSignup}
            isLoading={isLoading}
          />
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

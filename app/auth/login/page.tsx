"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CredentialStep } from "@/components/login/credential-step";
import { LocationVerificationStep } from "@/components/login/location-verification-step";
import { DeviceVerificationStep } from "@/components/login/device-verification-step";
import { OtpVerificationStep } from "@/components/login/otp-verification-step";
import { VerificationPopup } from "@/components/login/verification-popup";
import { tryGetGeolocationSilently } from "@/lib/utils/try-get-geo";
import { userInfoClient } from "@/lib/sdk/secure-user-info-client";
import { getDeviceId } from "@/lib/utils/get-device-id";

// --- Types for API responses (align to your backend if different) ---
type CredRes = { user_id: string; email: string };
type DeviceRes = { device_ok: boolean; action?: "send_email_otp"; email?: string };
type VerifyLocRes = { verified: boolean };
type VerifyOtpRes = { ok: boolean };

interface LoginData {
  email: string;          // login email
  password: string;
  userId?: string;
  deviceId?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.detail || data.message)) || res.statusText;
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }
  return data as T;
}

export default function LoginPage() {
  const router = useRouter();

  // Steps:
  // 1 = credentials (email + password)
  // 2 = OTP (only if device mismatch)
  // 3 = verification popup (device + location)
  // 4 = redirect to dashboard
  const [currentStep, setCurrentStep] = useState(1);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);



  // STEP 1: Email + password
  const handleCredentialVerification = useCallback(
    async (emailFromStep: string, passwordFromStep: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const email = emailFromStep.trim().toLowerCase();
        const password = passwordFromStep;

        // 1) Verify credentials (server should check Supabase Auth)
        const cred = await fetchJSON<CredRes>("/api/login/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }), // <-- EMAIL, not phone
        });

        const userId = cred.user_id;
        const signupEmail = (cred.email || email).trim().toLowerCase();
        
        // Generate IP-based device ID for verification
        const deviceResponse = await fetch("/api/device/generate-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!deviceResponse.ok) {
          throw new Error("Failed to generate device ID");
        }
        
        const { deviceId } = await deviceResponse.json();
        console.log("[LOGIN] Generated IP-based device ID:", deviceId);

        // 2) Device check
        const dev = await fetchJSON<DeviceRes>("/api/login/verify-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, device_id: deviceId }),
        });

        setLoginData({ email: signupEmail, password, userId, deviceId });

        if (!dev.device_ok && dev.action === "send_email_otp") {
          // Trigger email OTP to the signup email
          await fetchJSON("/api/login/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, email: dev.email || signupEmail }),
          });
          setCurrentStep(2);
          return;
        }

        // 3) Show verification popup (device + location)
        setShowVerificationPopup(true);
      } catch (e: any) {
        setError(e?.message || "Invalid login credentials");
        try {
          await userInfoClient.storeEvent({
            event_type: "login_failed",
            event_data: { email: loginData.email, reason: e?.message || "Invalid credentials" },
          });
        } catch {}
      } finally {
        setIsLoading(false);
      }
    },
    [loginData.email],
  );

  // STEP 2: OTP (unrecognized device)
  const handleOtpSubmit = useCallback(
    async (otpCode: string) => {
      if (!loginData.email || !loginData.userId) {
        setError("Missing login context. Please start again.");
        setCurrentStep(1);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // Use the login-specific OTP verify endpoint
        const res = await fetchJSON<VerifyOtpRes>("/api/login/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            user_id: loginData.userId, 
            email: loginData.email, 
            otp: otpCode 
          }),
        });

        if (!res.ok) throw new Error("Invalid or expired code");

        // After OTP, show verification popup
        setShowVerificationPopup(true);
      } catch (e: any) {
        setError(e?.message || "OTP verification failed");
      } finally {
        setIsLoading(false);
      }
    },
    [loginData.email, loginData.userId],
  );

  // STEP 3: (optional interactive) Location Verification
  const handleLocationVerification = useCallback(
    async (locationData: { latitude: number; longitude: number; city: string; country: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetchJSON<VerifyLocRes>("/api/user-info/verify-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: loginData.userId, currentLocation: locationData }),
        });

        if (!res.verified) throw new Error("Login denied - Location verification failed");

        setLoginData((prev) => ({ ...prev, locationData }));
        setCurrentStep(4);
      } catch (e: any) {
        setError(e?.message || "Location verification failed");
      } finally {
        setIsLoading(false);
      }
    },
    [loginData.userId],
  );

  // STEP 4: Final login completion
  const handleLoginCompletion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Generate IP-based device ID for login completion
      const deviceResponse = await fetch("/api/device/generate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!deviceResponse.ok) {
        throw new Error("Failed to generate device ID");
      }
      
      const { deviceId: currentDeviceId } = await deviceResponse.json();
      console.log("[LOGIN_COMPLETION] Using IP-based device ID:", currentDeviceId);
      
      const coords = await tryGetGeolocationSilently();
      
      // Get current location data for display
      let currentLocationData = null;
      if (coords) {
        try {
          // Use reverse geocoding to get city/country
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=10&addressdetails=1`
          );
          const geoData = await nominatimResponse.json();
          const city = geoData.address.city || geoData.address.town || geoData.address.village || "Unknown";
          const country = geoData.address.country || "Unknown";
          
          currentLocationData = {
            city,
            country,
            coordinates: { lat: coords.lat, lng: coords.lon },
          };
        } catch (geoError) {
          console.warn("Failed to get location name:", geoError);
        }
      }
      
      await userInfoClient.storeEvent({
        event_type: "login_completed",
        event_data: {
          userId: loginData.userId,
          email: loginData.email,
          device_id: currentDeviceId,
          locationData: currentLocationData,
          geo_location: coords ? {
            latitude: coords.lat,
            longitude: coords.lon,
            radius: 50000
          } : null,
          loginMethod: "password",
          securityFactors: {
            validCredentials: true,
            trustedDevice: true,
            recognizedLocation: true,
            additionalVerification: currentStep === 2,
          },
          timestamp: new Date().toISOString(),
        },
      });

      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Login completion failed");
    } finally {
      setIsLoading(false);
    }
  }, [loginData.userId, loginData.email, currentStep, router]);

  // ----- Render -----
  if (currentStep > 1) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-lg">

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {currentStep === 2 && (
            <OtpVerificationStep
              onNext={handleOtpSubmit}
              onBack={() => setCurrentStep(1)}
              isLoading={isLoading}
              email={loginData.email}
              onResendOtp={async () => {
                if (!loginData.userId || !loginData.email) return;
                try {
                  await fetchJSON("/api/login/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                      user_id: loginData.userId, 
                      email: loginData.email 
                    }),
                  });
                } catch (e) {
                  console.error("Failed to resend OTP:", e);
                }
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Show verification popup if needed
  if (showVerificationPopup) {
    return (
      <VerificationPopup
        onComplete={handleLoginCompletion}
        deviceId={loginData.deviceId || ""}
        userId={loginData.userId || ""}
        email={loginData.email}
      />
    );
  }

  // Step 1: Credentials
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>New here?</strong> Please sign up first with our secure multi-step registration.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Use your email and password</CardDescription>
            </CardHeader>
            <CardContent>
              <CredentialStep
                // Make sure CredentialStep collects EMAIL + PASSWORD
                // and calls onNext(email, password)
                onNext={handleCredentialVerification}
                isLoading={isLoading}
                error={error || undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
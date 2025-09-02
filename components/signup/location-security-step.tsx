"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Shield, AlertTriangle } from "lucide-react"

interface SecurityQuestion {
  question: string
  answer: string
}

interface LocationSecurityData {
  securityQuestions: SecurityQuestion[]
  locationVerified: boolean
  locationData?: {
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
}

interface LocationSecurityStepProps {
  data: LocationSecurityData
  onDataChange: (data: LocationSecurityData) => void
  onComplete: () => void
  isLoading?: boolean
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your first car's make and model?",
  "What street did you grow up on?",
  "What was your childhood nickname?",
  "What was the name of your first employer?",
]

export function LocationSecurityStep({ data, onDataChange, onComplete, isLoading }: LocationSecurityStepProps) {
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "success" | "error">("idle")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    generateDeviceId()

    // Auto-request location on component mount
    if (!data.locationVerified) {
      requestLocation()
    }
  }, [])

  // Questions are initialized in parent; keep this component layout consistent regardless of location access

  const generateDeviceId = () => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      timestamp: Date.now(),
    }

    // Create a simple hash of device characteristics
    const deviceString = JSON.stringify(deviceInfo)
    let hash = 0
    for (let i = 0; i < deviceString.length; i++) {
      const char = deviceString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    const deviceId = `device_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`
    console.log("[v0] Generated Device ID:", deviceId)
    console.log("[v0] Device Info:", deviceInfo)

    return deviceId
  }

  const requestLocation = async () => {
    setLocationStatus("requesting")

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      // Reverse geocode coordinates → city, country using OpenStreetMap Nominatim
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      async function reverseGeocode(latitude: number, longitude: number) {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          const res = await fetch(url, {
            headers: {
              // Nominatim asks for a valid User-Agent/Referer; browser sets UA, we add referer-ish header
              "Accept": "application/json",
            },
          })
          const data = await res.json().catch(() => ({} as any))
          const address = data?.address || {}
          const city = address.city || address.town || address.village || address.county || "Unknown"
          const country = address.country || "Unknown"
          return { city, country }
        } catch {
          return { city: "Unknown", country: "Unknown" }
        }
      }

      const { city, country } = await reverseGeocode(lat, lng)

      const locationData = {
        city,
        country,
        coordinates: { lat, lng },
      }

      onDataChange({
        ...data,
        locationVerified: true,
        locationData,
      })
      setLocationStatus("success")
    } catch (error) {
      console.error("Location error:", error)
      setLocationStatus("error")
    }
  }

  const handleSecurityQuestionChange = (index: number, field: "question" | "answer", value: string) => {
    const newQuestions = [...data.securityQuestions]
    if (!newQuestions[index]) {
      newQuestions[index] = { question: "", answer: "" }
    }
    newQuestions[index][field] = value

    onDataChange({
      ...data,
      securityQuestions: newQuestions,
    })

    // Clear error when user starts typing
    if (errors[`question${index}`]) {
      setErrors({ ...errors, [`question${index}`]: undefined })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    data.securityQuestions.forEach((q, index) => {
      if (!q.question || !q.answer.trim()) {
        newErrors[`question${index}`] = "Both question and answer are required"
      } else if (q.answer.trim().length < 3) {
        newErrors[`question${index}`] = "Answer must be at least 3 characters long"
      }
    })

    if (data.securityQuestions.length < 2) {
      newErrors.general = "Please set up at least 2 security questions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onComplete()
    }
  }

  const addSecurityQuestion = () => {
    if (data.securityQuestions.length < 3) {
      onDataChange({
        ...data,
        securityQuestions: [...data.securityQuestions, { question: "", answer: "" }],
      })
    }
  }

  const removeSecurityQuestion = (index: number) => {
    const newQuestions = data.securityQuestions.filter((_, i) => i !== index)
    onDataChange({
      ...data,
      securityQuestions: newQuestions,
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Security & Location</CardTitle>
        <CardDescription>Complete your security setup and verify your location</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Verification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <Label className="text-base font-medium">Location Verification</Label>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                locationStatus === "success"
                  ? "bg-green-50 border-green-200"
                  : locationStatus === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-muted border-border"
              }`}
            >
              {locationStatus === "requesting" && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Requesting location access...
                </div>
              )}

              {locationStatus === "success" && data.locationData && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <Shield className="h-4 w-4" />
                    Location verified
                  </div>
                  <p className="text-muted-foreground">
                    {data.locationData.city}, {data.locationData.country}
                  </p>
                </div>
              )}

              {locationStatus === "error" && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Location access denied
                  </div>
                  <p className="text-muted-foreground mb-3 text-xs">
                    No worries! You can continue without location verification. We'll use additional security questions
                    instead.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={requestLocation}>
                      Try Again
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onDataChange({
                          ...data,
                          locationVerified: false,
                        })
                      }}
                    >
                      Continue Without Location
                    </Button>
                  </div>
                </div>
              )}

              {locationStatus === "idle" && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">We need to verify your location for security purposes</p>
                  <Button type="button" variant="outline" size="sm" onClick={requestLocation}>
                    Verify Location
                  </Button>
                </div>
              )}
            </div>
            {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
          </div>

          {/* Security Questions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <Label className="text-base font-medium">Security Questions</Label>
            </div>

            {data.securityQuestions.map((sq, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Question {index + 1}</Label>
                  {data.securityQuestions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSecurityQuestion(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Select
                  value={sq.question}
                  onValueChange={(value) => handleSecurityQuestionChange(index, "question", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_QUESTIONS.map((question) => (
                      <SelectItem key={question} value={question}>
                        {question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="Your answer"
                  value={sq.answer}
                  onChange={(e) => handleSecurityQuestionChange(index, "answer", e.target.value)}
                  className={errors[`question${index}`] ? "border-destructive" : ""}
                />

                {errors[`question${index}`] && <p className="text-sm text-destructive">{errors[`question${index}`]}</p>}
              </div>
            ))}

            {data.securityQuestions.length < 3 && (
              <div className="pt-2">
                <Button type="button" variant="outline" onClick={addSecurityQuestion}>
                  Add Another Question
                </Button>
              </div>
            )}

            {errors.general && <p className="text-sm text-destructive">{errors.general}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

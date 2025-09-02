"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneInput } from "@/components/ui/phone-input"
import { Eye, EyeOff, Check, X } from "lucide-react"

interface IdentitySetupData {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  phoneNumber: string
}

interface IdentitySetupStepProps {
  data: IdentitySetupData
  onDataChange: (data: IdentitySetupData) => void
  onNext: () => void
  isLoading?: boolean
}

export function IdentitySetupStep({ data, onDataChange, onNext, isLoading }: IdentitySetupStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<IdentitySetupData>>({})

  const validatePassword = (password: string) => {
    const criteria = {
      minLength: password.length >= 6,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    return {
      isValid: Object.values(criteria).every(Boolean),
      criteria,
    }
  }

  const passwordValidation = validatePassword(data.password)

  const validateForm = () => {
    const newErrors: Partial<IdentitySetupData> = {}

    if (!data.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!data.password) {
      newErrors.password = "Password is required"
    } else if (!passwordValidation.isValid) {
      newErrors.password = "Password does not meet all requirements"
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!data.displayName) {
      newErrors.displayName = "Display name is required"
    }

    if (!data.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required"
    } else if (!/^\+\d{1,4}\s[\d\s-()]+$/.test(data.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext()
    }
  }

  const handleInputChange = (field: keyof IdentitySetupData, value: string) => {
    onDataChange({ ...data, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
        <CardDescription>Enter your details to get started with secure authentication</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={data.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your Name"
              value={data.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              className={errors.displayName ? "border-destructive" : ""}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <PhoneInput
              id="phoneNumber"
              value={data.phoneNumber}
              onChange={(value) => handleInputChange("phoneNumber", value)}
              placeholder="123 456 7890"
              className={errors.phoneNumber ? "border-destructive" : ""}
            />
            {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={data.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {data.password && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {passwordValidation.criteria.minLength ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span className={passwordValidation.criteria.minLength ? "text-green-600" : "text-red-600"}>
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.criteria.hasLowercase ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span className={passwordValidation.criteria.hasLowercase ? "text-green-600" : "text-red-600"}>
                    At least one lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.criteria.hasUppercase ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span className={passwordValidation.criteria.hasUppercase ? "text-green-600" : "text-red-600"}>
                    At least one uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.criteria.hasNumber ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span className={passwordValidation.criteria.hasNumber ? "text-green-600" : "text-red-600"}>
                    At least one number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.criteria.hasSpecialChar ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span className={passwordValidation.criteria.hasSpecialChar ? "text-green-600" : "text-red-600"}>
                    At least one special character
                  </span>
                </div>
              </div>
            )}

            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={data.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

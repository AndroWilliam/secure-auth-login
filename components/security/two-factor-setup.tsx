"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { QrCode, Smartphone, Shield, AlertTriangle } from "lucide-react"

interface TwoFactorSetupProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => Promise<void>
  onSetup: (code: string) => Promise<boolean>
  isLoading?: boolean
}

export function TwoFactorSetup({ isEnabled, onToggle, onSetup, isLoading }: TwoFactorSetupProps) {
  const [setupMode, setSetupMode] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [qrCodeUrl] = useState("https://via.placeholder.com/200x200?text=QR+Code") // In production, generate real QR code

  const handleToggle = async (enabled: boolean) => {
    if (enabled && !isEnabled) {
      setSetupMode(true)
    } else if (!enabled && isEnabled) {
      await onToggle(false)
      setSetupMode(false)
    }
  }

  const handleSetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setError(null)
    const success = await onSetup(verificationCode)

    if (success) {
      setSetupMode(false)
      setVerificationCode("")
    } else {
      setError("Invalid verification code. Please try again.")
    }
  }

  const handleCancel = () => {
    setSetupMode(false)
    setVerificationCode("")
    setError(null)
  }

  if (setupMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app and enter the verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg border">
              <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code for 2FA setup" className="w-48 h-48" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Scan this QR code with Google Authenticator, Authy, or similar app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, ""))
                if (error) setError(null)
              }}
              className={`text-center text-lg tracking-widest ${error ? "border-destructive" : ""}`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSetup} disabled={verificationCode.length !== 6 || isLoading} className="flex-1">
              {isLoading ? "Verifying..." : "Enable 2FA"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Authenticator App</p>
            <p className="text-sm text-muted-foreground">Use an app like Google Authenticator or Authy</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={isLoading} />
        </div>

        {isEnabled ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-1">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Two-Factor Authentication Enabled</span>
            </div>
            <p className="text-sm text-green-700">Your account is protected with 2FA</p>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Two-Factor Authentication Disabled</span>
            </div>
            <p className="text-sm text-yellow-700">Enable 2FA to better protect your account</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          <span>Compatible with Google Authenticator, Authy, 1Password, and other TOTP apps</span>
        </div>
      </CardContent>
    </Card>
  )
}

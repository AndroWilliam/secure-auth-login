"use client"

import {
  validatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/utils/password-validator"

interface PasswordStrengthMeterProps {
  password: string
  showFeedback?: boolean
}

export function PasswordStrengthMeter({ password, showFeedback = true }: PasswordStrengthMeterProps) {
  const strength = validatePasswordStrength(password)

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <span className={`text-sm font-medium ${getPasswordStrengthColor(strength.score)}`}>
          {getPasswordStrengthLabel(strength.score)}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            strength.score <= 2
              ? "bg-red-500"
              : strength.score <= 4
                ? "bg-yellow-500"
                : strength.score <= 5
                  ? "bg-blue-500"
                  : "bg-green-500"
          }`}
          style={{ width: `${(strength.score / 6) * 100}%` }}
        />
      </div>

      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              • {feedback}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

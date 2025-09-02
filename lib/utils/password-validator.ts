interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push("Password must be at least 8 characters long")
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Include lowercase letters")
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Include uppercase letters")
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push("Include numbers")
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1
  } else {
    feedback.push("Include special characters")
  }

  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i,
  ]

  const hasCommonPattern = commonPatterns.some((pattern) => pattern.test(password))
  if (hasCommonPattern) {
    score = Math.max(0, score - 2)
    feedback.push("Avoid common passwords and patterns")
  }

  // Repetitive characters check
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push("Avoid repetitive characters")
  }

  const isValid = score >= 4 && password.length >= 8

  return {
    score: Math.min(score, 6),
    feedback,
    isValid,
  }
}

export function getPasswordStrengthLabel(score: number): string {
  if (score <= 2) return "Weak"
  if (score <= 4) return "Fair"
  if (score <= 5) return "Good"
  return "Strong"
}

export function getPasswordStrengthColor(score: number): string {
  if (score <= 2) return "text-red-600"
  if (score <= 4) return "text-yellow-600"
  if (score <= 5) return "text-blue-600"
  return "text-green-600"
}

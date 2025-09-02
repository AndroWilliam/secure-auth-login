interface SecurityFactors {
  credentialsValid: boolean
  deviceTrusted: boolean
  locationRecognized: boolean
  otpVerified: boolean
}

export function calculateSecurityScore(factors: SecurityFactors): number {
  let score = 0

  // Email/password match: 25 points
  if (factors.credentialsValid) score += 25

  // Device ID match: 25 points
  if (factors.deviceTrusted) score += 25

  // Geo location within 50km radius: 25 points
  if (factors.locationRecognized) score += 25

  // OTP verification: 25 points
  if (factors.otpVerified) score += 25

  return score
}

export function getSecurityLabel(score: number): string {
  if (score >= 75) return "High Security"
  if (score >= 50) return "Medium Security"
  if (score >= 25) return "Low Security"
  return "Very Low Security"
}

export function getRiskLabel(score: number): string {
  if (score >= 75) return "Low Risk"
  if (score >= 50) return "Medium Risk"
  if (score >= 25) return "High Risk"
  return "Very High Risk"
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-600"
  if (score >= 50) return "text-yellow-600"
  return "text-red-600"
}

export function getProgressColor(score: number): string {
  if (score >= 75) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

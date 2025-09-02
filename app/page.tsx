import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, MapPin, Eye, Lock, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Secure Multi-Step
              <span className="text-blue-600 dark:text-blue-400"> Authentication</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience enterprise-grade security with our comprehensive multi-layer authentication system. Protect
              your accounts with advanced verification methods.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Advanced Security Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our multi-layered approach ensures maximum security while maintaining user experience
            </p>
          </div>

          <div className="flex flex-col items-center gap-8">
            {/* Top row - 3 cards */}
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <div className="text-center p-6 rounded-lg border bg-card">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Multi-Step Verification</h3>
                <p className="text-muted-foreground">
                  Three-layer signup process with identity setup, email/phone verification, and location security
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border bg-card">
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Location-Based Security</h3>
                <p className="text-muted-foreground">
                  Intelligent location verification with risk assessment and suspicious activity detection
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border bg-card">
                <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
                <p className="text-muted-foreground">
                  Continuous security monitoring with detailed audit logs and compliance reporting
                </p>
              </div>
            </div>

            {/* Bottom row - 2 cards centered */}
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <div className="text-center p-6 rounded-lg border bg-card">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Two-Factor Authentication</h3>
                <p className="text-muted-foreground">
                  Optional 2FA with TOTP support and backup codes for additional account protection
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border bg-card">
                <div className="mx-auto w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">User Management</h3>
                <p className="text-muted-foreground">
                  Comprehensive user profiles with security settings and trusted device management
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to secure your application?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Experience the future of authentication with our comprehensive security system.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/signup">Start Your Secure Journey</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

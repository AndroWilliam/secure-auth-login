import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect directly to login page
  redirect("/auth/login")
}

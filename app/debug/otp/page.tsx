"use client"
import { useState } from "react"

export default function OtpDebug() {
  const [email, setEmail] = useState("")
  const [res, setRes] = useState<any>(null)

  const send = async () => {
    const r = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setRes({ status: r.status, json: await r.json() })
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>OTP Debug</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <button onClick={send}>Send OTP</button>
      <pre>{JSON.stringify(res, null, 2)}</pre>
    </div>
  )
}

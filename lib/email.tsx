import { render } from "@react-email/render"
import { ENV } from "@/env"

export type SendResult = { id?: string }

export function OtpEmail({ code }: { code: string }) {
  return (
    <div style={{ fontFamily: "system-ui,-apple-system,Segoe UI,Roboto" }}>
      <h1>Your verification code</h1>
      <p>
        Use this code: <b>{code}</b>
      </p>
      <p>Expires in 5 minutes.</p>
    </div>
  )
}

export async function sendEmailHTML(
  to: string,
  subject: string,
  html: string
): Promise<{ id: string }> {
  const ENV = process.env;

  // --- SMTP first (works with any recipient, no domain needed) ---
  if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
    const nodemailer = (await import("nodemailer")).default as any;
    const transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: Number(ENV.SMTP_PORT ?? 465),
      secure: String(ENV.SMTP_SECURE ?? "true") === "true",
      auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
    });

    const from = ENV.SMTP_FROM || ENV.SMTP_USER;
    const info = await transporter.sendMail({ from, to, subject, html });
    return { id: info.messageId };
  }

  // --- Resend (will fail in sandbox for non-allowed recipients) ---
  if (ENV.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(ENV.RESEND_API_KEY);
    const from = ENV.RESEND_FROM!;
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      const msg = (error as any)?.message ?? (typeof error === "string" ? error : JSON.stringify(error));
      throw new Error("PROVIDER_ERROR: " + msg);
    }
    return { id: data?.id ?? "resend" };
  }

  // --- Dev mode (no real email) ---
  if (String(ENV.DEV_OTP_MODE ?? "false") === "true") {
    return { id: "dev-mode-no-send" };
  }

  throw new Error("NO_PROVIDER: Configure SMTP_* or RESEND_* or set DEV_OTP_MODE=true");
}

export const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

export function renderOtp(code: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial">
      <h1>Your verification code</h1>
      <p>Use this code: <b>${code}</b></p>
      <p>Expires in 10 minutes.</p>
    </div>
  `.trim()
}
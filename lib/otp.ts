import { createServiceClient } from "@/lib/supabase/server"

/** Normalize contact consistently (email lowercased + trimmed) */
function normalizeContact(contact: string, type: "email" | "sms") {
  const v = contact?.toString().trim();
  return type === "email" ? v.toLowerCase() : v;
}

/** Always compare codes as trimmed strings */
function normalizeCode(code: string | number) {
  return String(code ?? "").trim();
}

/**
 * Save a new OTP for a contact (email/phone).
 * - Removes existing unverified OTPs for that (type, contact).
 * - Inserts a new OTP that expires in 10 minutes.
 */
export async function saveOtp(
  contactRaw: string,
  codeRaw: string | number,
  type: "email" | "sms" = "email",
) {
  const supa = await createServiceClient();

  const contact = normalizeContact(contactRaw, type);
  const code = normalizeCode(codeRaw);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Remove existing *unverified* codes for this contact+type
  const delRes = await supa
    .from("otp_verifications")
    .delete()
    .eq("type", type)
    .eq("contact", contact)
    .eq("verified", false);

  if (delRes.error) {
    throw new Error(`SUPABASE_DELETE: ${delRes.error.message}`);
  }

  // Insert a new OTP
  const insRes = await supa
    .from("otp_verifications")
    .insert({
      user_id: null,
      type,
      contact,
      code,
      verified: false,
      expires_at,
    })
    .select("id")
    .single();

  if (insRes.error) {
    throw new Error(`SUPABASE_INSERT: ${insRes.error.message}`);
  }
}

/**
 * Verify an OTP and mark it as used.
 * Returns true if the OTP is valid and updated; false if not found/expired.
 */
export async function verifyOtp(
  contactRaw: string,
  codeRaw: string | number,
  type: "email" | "sms" = "email",
) {
  const supa = await createServiceClient();

  const contact = normalizeContact(contactRaw, type);
  const code = normalizeCode(codeRaw);
  const nowIso = new Date().toISOString();

  // Look up the *latest* unverified, unexpired matching code
  const selRes = await supa
    .from("otp_verifications")
    .select("id")
    .eq("type", type)
    .eq("contact", contact)
    .eq("code", code)
    .eq("verified", false)
    .gte("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selRes.error) {
    throw new Error(`SUPABASE_SELECT: ${selRes.error.message}`);
  }
  if (!selRes.data?.id) return false;

  const updRes = await supa
    .from("otp_verifications")
    .update({ verified: true })
    .eq("id", selRes.data.id);

  if (updRes.error) {
    throw new Error(`SUPABASE_UPDATE: ${updRes.error.message}`);
  }

  return true;
}
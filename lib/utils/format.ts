export const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString() : "Never";
export const fmtPhone = (p?: string | null) => (p && p.trim()) || "N/A";
export const fmtLocation = (loc?: any) => {
  if (!loc) return "Unknown";
  const city = loc.city ?? loc.address?.city ?? loc.address?.town ?? loc.address?.village ?? null;
  const country = loc.country ?? loc.address?.country ?? null;
  return city && country ? `${city}, ${country}` : country || city || "Unknown";
};

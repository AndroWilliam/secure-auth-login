/**
 * Enhanced device fingerprinting using multiple browser characteristics
 * More reliable than IP-based identification for web applications
 */

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  fingerprint: string;
}

/**
 * Generate a comprehensive device fingerprint
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === "undefined") {
    return {
      userAgent: "server-side",
      screenResolution: "unknown",
      timezone: "unknown",
      language: "unknown",
      platform: "unknown",
      cookieEnabled: false,
      doNotTrack: "unknown",
      hardwareConcurrency: 0,
      fingerprint: "server-side-device"
    };
  }

  const fingerprint = {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || "unknown",
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || undefined,
  };

  // Create a hash of the fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  const fingerprintHash = btoa(fingerprintString).slice(0, 16);

  return {
    ...fingerprint,
    fingerprint: `fp-${fingerprintHash}-${Date.now().toString(36)}`
  };
}

/**
 * Compare two device fingerprints
 */
export function compareDeviceFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): boolean {
  // Compare key characteristics that should remain consistent
  const keyFields = [
    'userAgent',
    'screenResolution', 
    'timezone',
    'language',
    'platform',
    'hardwareConcurrency'
  ];

  return keyFields.every(field => fp1[field as keyof DeviceFingerprint] === fp2[field as keyof DeviceFingerprint]);
}

/**
 * Get stored device fingerprint from localStorage
 */
export function getStoredDeviceFingerprint(): DeviceFingerprint | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("deviceFingerprint");
  return stored ? JSON.parse(stored) : null;
}

/**
 * Store device fingerprint in localStorage
 */
export function storeDeviceFingerprint(fingerprint: DeviceFingerprint): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("deviceFingerprint", JSON.stringify(fingerprint));
}

/**
 * Generate and store device fingerprint
 */
export function generateAndStoreDeviceFingerprint(): DeviceFingerprint {
  const fingerprint = generateDeviceFingerprint();
  storeDeviceFingerprint(fingerprint);
  return fingerprint;
}
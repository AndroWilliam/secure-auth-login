/**
 * Hybrid device identification combining IP, hardware characteristics, and persistent storage
 * Most reliable approach for web applications
 */

import { getClientIp } from './ip-device-id';
import { HardwareDeviceInfo, generateHardwareDeviceId, compareHardwareDeviceIds } from './hardware-device-id';

// Re-export getClientIp for use in API routes
export { getClientIp };

export interface HybridDeviceId {
  deviceId: string; // This will be the hardware fingerprint
  ipAddress: string; // Collected for future use
  timestamp: number; // Collected for future use
  hardwareFingerprint: string; // The actual device fingerprint
}

/**
 * Generate a device ID using hardware fingerprint as primary identifier
 * Collects IP and timestamp for future use
 */
export function generateHybridDeviceId(clientIp: string): HybridDeviceId {
  const hardwareInfo = generateHardwareDeviceId();
  
  // Use hardware fingerprint as the primary device ID
  const deviceId = hardwareInfo.deviceId;
  
  return {
    deviceId, // This is the hardware fingerprint
    ipAddress: clientIp, // Collected for future use
    timestamp: Date.now(), // Collected for future use
    hardwareFingerprint: hardwareInfo.deviceId // Same as deviceId for clarity
  };
}

/**
 * Get or create a persistent device ID
 */
function getOrCreatePersistentId(): string {
  if (typeof window === "undefined") return "server-side";
  
  let persistentId = localStorage.getItem("persistentDeviceId");
  
  if (!persistentId) {
    // Generate a new persistent ID
    persistentId = `persist-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    localStorage.setItem("persistentDeviceId", persistentId);
  }
  
  return persistentId;
}

/**
 * Compare two device IDs (hardware fingerprints)
 */
export function compareHybridDeviceIds(device1: HybridDeviceId, device2: HybridDeviceId): boolean {
  // Compare hardware fingerprints (primary method)
  return device1.deviceId === device2.deviceId;
}

/**
 * Get stored hybrid device ID
 */
export function getStoredHybridDeviceId(): HybridDeviceId | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("hybridDeviceId");
  return stored ? JSON.parse(stored) : null;
}

/**
 * Store hybrid device ID
 */
export function storeHybridDeviceId(deviceId: HybridDeviceId): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("hybridDeviceId", JSON.stringify(deviceId));
}

/**
 * Generate and store hybrid device ID
 */
export function generateAndStoreHybridDeviceId(clientIp: string): HybridDeviceId {
  const deviceId = generateHybridDeviceId(clientIp);
  storeHybridDeviceId(deviceId);
  return deviceId;
}

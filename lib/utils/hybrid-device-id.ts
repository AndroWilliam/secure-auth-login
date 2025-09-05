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
export async function generateHybridDeviceId(clientIp: string): Promise<HybridDeviceId> {
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
async function getOrCreatePersistentId(): Promise<string> {
  if (typeof window === "undefined") return "server-side";
  
  try {
    const { getItem, setItem, migrateFromLocalStorage, getItemFallback } = await import("./secure-session");
    
    // Migrate legacy localStorage data
    await migrateFromLocalStorage("persistentDeviceId", 8760); // 1 year
    
    // Get from secure session first, fallback to localStorage
    let persistentId = await getItem("persistentDeviceId") || getItemFallback("persistentDeviceId");
    
    if (!persistentId) {
      // Generate a new persistent ID
      persistentId = `persist-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      
      // Store securely
      await setItem("persistentDeviceId", persistentId, 8760); // 1 year
      console.log("[PERSISTENT_ID] Generated and stored new persistent ID securely");
    }
    
    return persistentId;
  } catch (error) {
    console.warn("[PERSISTENT_ID] Failed secure storage, using localStorage fallback:", error);
    
    // Fallback to localStorage
    let persistentId = localStorage.getItem("persistentDeviceId");
    
    if (!persistentId) {
      persistentId = `persist-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem("persistentDeviceId", persistentId);
    }
    
    return persistentId;
  }
}

/**
 * Compare two device IDs (hardware fingerprints)
 */
export function compareHybridDeviceIds(device1: HybridDeviceId, device2: HybridDeviceId): boolean {
  // Compare hardware fingerprints (primary method)
  return device1.deviceId === device2.deviceId;
}

/**
 * Get stored hybrid device ID (with secure session migration)
 */
export async function getStoredHybridDeviceId(): Promise<HybridDeviceId | null> {
  if (typeof window === "undefined") return null;
  
  try {
    const { getItem, migrateFromLocalStorage, getItemFallback } = await import("./secure-session");
    
    // Migrate legacy localStorage data
    await migrateFromLocalStorage("hybridDeviceId", 168); // 7 days
    
    // Get from secure session first, fallback to localStorage
    const stored = await getItem("hybridDeviceId") || getItemFallback("hybridDeviceId");
    return stored;
  } catch (error) {
    console.warn("[HYBRID_DEVICE] Failed to get secure device ID:", error);
    // Fallback to localStorage for backward compatibility
    const stored = localStorage.getItem("hybridDeviceId");
    return stored ? JSON.parse(stored) : null;
  }
}

/**
 * Store hybrid device ID securely
 */
export async function storeHybridDeviceId(deviceId: HybridDeviceId): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const { setItem } = await import("./secure-session");
    await setItem("hybridDeviceId", deviceId, 168); // 7 days
    console.log("[HYBRID_DEVICE] Stored device ID securely");
  } catch (error) {
    console.warn("[HYBRID_DEVICE] Failed to store securely, using localStorage fallback:", error);
    // Fallback to localStorage
    localStorage.setItem("hybridDeviceId", JSON.stringify(deviceId));
  }
}

/**
 * Generate and store hybrid device ID
 */
export async function generateAndStoreHybridDeviceId(clientIp: string): Promise<HybridDeviceId> {
  const deviceId = generateHybridDeviceId(clientIp);
  await storeHybridDeviceId(deviceId);
  return deviceId;
}

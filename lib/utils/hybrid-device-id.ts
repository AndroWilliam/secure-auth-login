/**
 * Hybrid device identification combining IP, hardware characteristics, and persistent storage
 * Most reliable approach for web applications
 */

import { getClientIp } from './ip-device-id';
import { HardwareDeviceInfo, generateHardwareDeviceId, compareHardwareDeviceIds } from './hardware-device-id';

export interface HybridDeviceId {
  deviceId: string;
  ipHash: string;
  hardwareFingerprint: string;
  persistentId: string;
  timestamp: number;
}

/**
 * Generate a hybrid device ID combining multiple identification methods
 */
export function generateHybridDeviceId(clientIp: string): HybridDeviceId {
  const hardwareInfo = generateHardwareDeviceId();
  
  // Create IP hash (first 8 characters)
  const ipHash = clientIp.replace(/\./g, '').slice(0, 8);
  
  // Create hardware fingerprint (first 12 characters)
  const hardwareFingerprint = hardwareInfo.deviceId.slice(0, 12);
  
  // Create persistent ID from localStorage or generate new one
  const persistentId = getOrCreatePersistentId();
  
  // Combine all identifiers
  const deviceId = `hybrid-${ipHash}-${hardwareFingerprint}-${persistentId}`;
  
  return {
    deviceId,
    ipHash,
    hardwareFingerprint,
    persistentId,
    timestamp: Date.now()
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
 * Compare two hybrid device IDs
 */
export function compareHybridDeviceIds(device1: HybridDeviceId, device2: HybridDeviceId): boolean {
  // Compare multiple aspects for reliability
  
  // 1. Check if persistent IDs match (most reliable)
  if (device1.persistentId === device2.persistentId) {
    return true;
  }
  
  // 2. Check if hardware fingerprints match
  if (device1.hardwareFingerprint === device2.hardwareFingerprint) {
    return true;
  }
  
  // 3. Check if IP hashes match (for same network)
  if (device1.ipHash === device2.ipHash) {
    return true;
  }
  
  return false;
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

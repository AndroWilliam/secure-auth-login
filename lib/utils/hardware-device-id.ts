/**
 * Hardware-based device identification using multiple browser APIs
 * More reliable than IP-based identification for web applications
 */

export interface HardwareDeviceInfo {
  deviceId: string;
  characteristics: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    hardwareConcurrency: number;
    deviceMemory?: number;
    maxTouchPoints: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timestamp: number;
}

/**
 * Generate a hardware-based device ID
 */
export function generateHardwareDeviceId(): HardwareDeviceInfo {
  if (typeof window === "undefined") {
    return {
      deviceId: "server-side-device",
      characteristics: {
        userAgent: "server-side",
        screenResolution: "unknown",
        timezone: "unknown",
        language: "unknown",
        platform: "unknown",
        hardwareConcurrency: 0,
        maxTouchPoints: 0,
        colorDepth: 0,
        pixelRatio: 0,
      },
      timestamp: Date.now()
    };
  }

  const characteristics = {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || undefined,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    colorDepth: screen.colorDepth || 0,
    pixelRatio: window.devicePixelRatio || 1,
  };

  // Create a more stable device ID using hardware characteristics
  const stableId = createStableDeviceId(characteristics);
  
  return {
    deviceId: stableId,
    characteristics,
    timestamp: Date.now()
  };
}

/**
 * Create a stable device ID from hardware characteristics
 * Uses only the most stable characteristics that don't change frequently
 */
function createStableDeviceId(characteristics: HardwareDeviceInfo['characteristics']): string {
  // Use only the most stable characteristics for device identification
  const stableData = [
    characteristics.platform,
    characteristics.screenResolution,
    characteristics.hardwareConcurrency.toString(),
    characteristics.maxTouchPoints.toString(),
    characteristics.colorDepth.toString(),
    characteristics.pixelRatio.toString(),
  ];

  // Create a hash from stable data only (no user agent or changing data)
  const combinedData = stableData.join('-');
  const hash = btoa(combinedData).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  
  return `device-${hash}`;
}

/**
 * Compare two hardware device IDs
 */
export function compareHardwareDeviceIds(device1: HardwareDeviceInfo, device2: HardwareDeviceInfo): boolean {
  // Compare key hardware characteristics
  const keyFields: (keyof HardwareDeviceInfo['characteristics'])[] = [
    'platform',
    'screenResolution',
    'hardwareConcurrency',
    'maxTouchPoints',
    'colorDepth',
    'pixelRatio'
  ];

  return keyFields.every(field => 
    device1.characteristics[field] === device2.characteristics[field]
  );
}

/**
 * Get stored hardware device ID
 */
export function getStoredHardwareDeviceId(): HardwareDeviceInfo | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("hardwareDeviceId");
  return stored ? JSON.parse(stored) : null;
}

/**
 * Store hardware device ID
 */
export function storeHardwareDeviceId(deviceInfo: HardwareDeviceInfo): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("hardwareDeviceId", JSON.stringify(deviceInfo));
}

/**
 * Generate and store hardware device ID
 */
export function generateAndStoreHardwareDeviceId(): HardwareDeviceInfo {
  const deviceInfo = generateHardwareDeviceId();
  storeHardwareDeviceId(deviceInfo);
  return deviceInfo;
}

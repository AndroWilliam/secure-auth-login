/**
 * IP-based device ID generation and management
 * Uses IP address + timestamp for more reliable device identification
 */

export interface DeviceIdComponents {
  ip: string;
  timestamp: string;
  deviceId: string;
}

/**
 * Generate a device ID based on IP address and timestamp
 * Format: ip-{ip_hash}-{timestamp}
 */
export function generateIpBasedDeviceId(ip: string): string {
  // Create a hash of the IP address (first 8 characters for privacy)
  const ipHash = ip.replace(/\./g, '').slice(0, 8);
  const timestamp = Date.now().toString(36);
  
  return `ip-${ipHash}-${timestamp}`;
}

/**
 * Extract IP address from device ID
 */
export function extractIpFromDeviceId(deviceId: string): string | null {
  const match = deviceId.match(/^ip-([a-f0-9]+)-/);
  return match ? match[1] : null;
}

/**
 * Parse device ID components
 */
export function parseDeviceId(deviceId: string): DeviceIdComponents | null {
  const match = deviceId.match(/^ip-([a-f0-9]+)-([a-z0-9]+)$/);
  if (!match) return null;
  
  return {
    ip: match[1],
    timestamp: match[2],
    deviceId
  };
}

/**
 * Check if two device IDs are from the same IP
 */
export function isSameIpDevice(deviceId1: string, deviceId2: string): boolean {
  const ip1 = extractIpFromDeviceId(deviceId1);
  const ip2 = extractIpFromDeviceId(deviceId2);
  
  return ip1 !== null && ip2 !== null && ip1 === ip2;
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a default IP for local development
  return '127.0.0.1';
}

/**
 * Generate device ID for client-side (will be replaced by server)
 */
export function generateClientDeviceId(): string {
  // For client-side, we'll generate a temporary ID
  // The server will replace this with the real IP-based ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `temp-${random}-${timestamp}`;
}

/**
 * Check if device ID is temporary (client-generated)
 */
export function isTemporaryDeviceId(deviceId: string): boolean {
  return deviceId.startsWith('temp-');
}

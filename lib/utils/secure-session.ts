/**
 * Secure Session Management
 * Replaces localStorage for sensitive data with server-side storage
 */

interface SessionStorageResponse {
  success?: boolean;
  value?: any;
  error?: string;
}

class SecureSessionManager {
  private static instance: SecureSessionManager;

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager();
    }
    return SecureSessionManager.instance;
  }

  /**
   * Store sensitive data on server-side (replaces localStorage.setItem)
   */
  async setItem(key: string, value: any, expiresInHours: number = 24): Promise<boolean> {
    try {
      console.log("[SECURE_SESSION] Storing:", key);
      
      const response = await fetch("/api/session/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          key, 
          value, 
          expires_in_hours: expiresInHours 
        })
      });

      const data: SessionStorageResponse = await response.json();
      
      if (!response.ok || !data.success) {
        console.error("[SECURE_SESSION] Store failed:", data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[SECURE_SESSION] Store error:", error);
      return false;
    }
  }

  /**
   * Retrieve sensitive data from server-side (replaces localStorage.getItem)
   */
  async getItem(key: string): Promise<any | null> {
    try {
      console.log("[SECURE_SESSION] Retrieving:", key);
      
      const response = await fetch("/api/session/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });

      const data: SessionStorageResponse = await response.json();
      
      if (!response.ok) {
        console.error("[SECURE_SESSION] Get failed:", data.error);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error("[SECURE_SESSION] Get error:", error);
      return null;
    }
  }

  /**
   * Remove sensitive data from server-side (replaces localStorage.removeItem)
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      console.log("[SECURE_SESSION] Removing:", key);
      
      const response = await fetch("/api/session/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });

      const data: SessionStorageResponse = await response.json();
      
      if (!response.ok || !data.success) {
        console.error("[SECURE_SESSION] Remove failed:", data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[SECURE_SESSION] Remove error:", error);
      return false;
    }
  }

  /**
   * Fallback to localStorage for non-sensitive data when server is unavailable
   */
  setItemFallback(key: string, value: any): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        console.log("[SECURE_SESSION] Fallback localStorage set:", key);
      } catch (error) {
        console.error("[SECURE_SESSION] Fallback failed:", error);
      }
    }
  }

  /**
   * Fallback to localStorage for non-sensitive data when server is unavailable
   */
  getItemFallback(key: string): any | null {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("[SECURE_SESSION] Fallback get failed:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Remove from localStorage fallback
   */
  removeItemFallback(key: string): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(key);
        console.log("[SECURE_SESSION] Fallback localStorage removed:", key);
      } catch (error) {
        console.error("[SECURE_SESSION] Fallback remove failed:", error);
      }
    }
  }

  /**
   * Migrate existing localStorage data to secure session
   */
  async migrateFromLocalStorage(key: string, expiresInHours: number = 24): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
      const localValue = localStorage.getItem(key);
      if (localValue) {
        const parsed = JSON.parse(localValue);
        const success = await this.setItem(key, parsed, expiresInHours);
        
        if (success) {
          // Remove from localStorage after successful migration
          localStorage.removeItem(key);
          console.log("[SECURE_SESSION] Migrated from localStorage:", key);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("[SECURE_SESSION] Migration failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const secureSession = SecureSessionManager.getInstance();

// Export individual functions for convenience
export const { setItem, getItem, removeItem, setItemFallback, getItemFallback, removeItemFallback, migrateFromLocalStorage } = secureSession;

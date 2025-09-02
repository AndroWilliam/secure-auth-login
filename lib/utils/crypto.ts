import { createHash, randomBytes, pbkdf2Sync } from "crypto"

export class SecureHash {
  private static readonly SALT_LENGTH = 32
  private static readonly ITERATIONS = 100000
  private static readonly KEY_LENGTH = 64
  private static readonly ALGORITHM = "sha512"

  /**
   * Hash sensitive data with salt for secure storage
   */
  static hashSensitiveData(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, "hex") : randomBytes(this.SALT_LENGTH)
    const hash = pbkdf2Sync(data, saltBuffer, this.ITERATIONS, this.KEY_LENGTH, this.ALGORITHM)

    return {
      hash: hash.toString("hex"),
      salt: saltBuffer.toString("hex"),
    }
  }

  /**
   * Verify sensitive data against stored hash
   */
  static verifySensitiveData(data: string, storedHash: string, salt: string): boolean {
    const { hash } = this.hashSensitiveData(data, salt)
    return hash === storedHash
  }

  /**
   * Create a simple hash for non-sensitive data (for deduplication, etc.)
   */
  static simpleHash(data: string): string {
    return createHash("sha256").update(data).digest("hex")
  }

  /**
   * Hash multiple fields into a single hash object
   */
  static hashMultipleFields(fields: Record<string, string>): Record<string, { hash: string; salt: string }> {
    const result: Record<string, { hash: string; salt: string }> = {}

    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        result[key] = this.hashSensitiveData(value)
      }
    }

    return result
  }

  /**
   * Generate a secure random token
   */
  static generateToken(length = 32): string {
    return randomBytes(length).toString("hex")
  }
}

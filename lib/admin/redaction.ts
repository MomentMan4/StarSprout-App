/**
 * Admin Redaction Utility
 * Masks sensitive data in admin UI displays
 */

type RedactableField =
  | "email"
  | "password"
  | "dob"
  | "date_of_birth"
  | "phone"
  | "address"
  | "ssn"
  | "token"
  | "api_key"
  | "secret"

const SENSITIVE_KEYS: RedactableField[] = [
  "email",
  "password",
  "dob",
  "date_of_birth",
  "phone",
  "address",
  "ssn",
  "token",
  "api_key",
  "secret",
]

/**
 * Redacts sensitive fields from an object
 * @param data - Object to redact
 * @param revealedKeys - Set of keys to NOT redact (for reveal functionality)
 */
export function redactSensitiveData(data: any, revealedKeys?: Set<string>): any {
  if (!data) return data
  if (typeof data !== "object") return data
  if (Array.isArray(data)) return data.map((item) => redactSensitiveData(item, revealedKeys))

  const redacted: any = {}

  for (const [key, value] of Object.entries(data)) {
    // Check if this key should be revealed
    if (revealedKeys?.has(key)) {
      redacted[key] = value
      continue
    }

    // Check if key contains sensitive patterns
    const keyLower = key.toLowerCase()
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) => keyLower.includes(sensitiveKey))

    if (isSensitive) {
      // Redact the value
      if (typeof value === "string") {
        // Show partial email for context
        if (keyLower.includes("email") && value.includes("@")) {
          const [local, domain] = value.split("@")
          redacted[key] = `${local.slice(0, 2)}***@${domain}`
        } else {
          redacted[key] = "[REDACTED]"
        }
      } else {
        redacted[key] = "[REDACTED]"
      }
    } else if (typeof value === "object") {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(value, revealedKeys)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

/**
 * Checks if a field is considered sensitive
 */
export function isSensitiveField(key: string): boolean {
  const keyLower = key.toLowerCase()
  return SENSITIVE_KEYS.some((sensitiveKey) => keyLower.includes(sensitiveKey))
}

/**
 * Formats sensitive data for admin display with optional reveal
 */
export function formatSensitiveValue(key: string, value: any, revealed = false): string {
  if (revealed) return String(value)

  if (!isSensitiveField(key)) return String(value)

  if (typeof value === "string") {
    if (key.toLowerCase().includes("email") && value.includes("@")) {
      const [local, domain] = value.split("@")
      return `${local.slice(0, 2)}***@${domain}`
    }
    return "[REDACTED]"
  }

  return "[REDACTED]"
}

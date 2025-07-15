import { TelemetryData } from './types'

export class PIISanitizer {
  private readonly piiPatterns: RegExp[]
  private readonly enabled: boolean

  constructor(enabled: boolean = true) {
    this.enabled = enabled
    this.piiPatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, // Phone numbers
      /\b(?:api[_-]?key|secret|token|password|passwd|pwd)\s*[:=]\s*["']?([^"'\s]+)/gi, // API keys and secrets
      /\b[A-Za-z0-9]{20,}\b/g, // Long tokens/keys
      /\b(?:Bearer|Basic)\s+[A-Za-z0-9+/=]+/gi, // Auth headers
    ]
  }

  public sanitize(data: TelemetryData): TelemetryData {
    if (!this.enabled) return data

    const sanitizedData = { ...data }

    if (sanitizedData.parameters) {
      sanitizedData.parameters = this.sanitizeObject(sanitizedData.parameters)
    }

    if (sanitizedData.result) {
      sanitizedData.result = this.sanitizeValue(sanitizedData.result)
    }

    if (sanitizedData.error) {
      sanitizedData.error = {
        ...sanitizedData.error,
        message: this.sanitizeString(sanitizedData.error.message),
        stack: sanitizedData.error.stack ? this.sanitizeString(sanitizedData.error.stack) : undefined
      }
    }

    return sanitizedData
  }

  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) sanitized[key] = '[REDACTED]'
      else sanitized[key] = this.sanitizeValue(value)
    }

    return sanitized
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') return this.sanitizeString(value)
    else if (typeof value === 'object' && value !== null) {
      return Array.isArray(value)
        ? value.map(item => this.sanitizeValue(item))
        : this.sanitizeObject(value)
    }
    return value
  }

  private sanitizeString(str: string): string {
    let sanitized = str

    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }

    return sanitized
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'auth', 'authorization',
      'apikey', 'api_key', 'access_token', 'refresh_token', 'bearer', 'credential',
      'ssn', 'social_security', 'credit_card', 'cc_number', 'cvv', 'pin'
    ]

    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    )
  }
}

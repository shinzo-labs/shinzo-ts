import { DetectorSync, Resource } from "@opentelemetry/resources"

export class PIISanitizer {
  private readonly piiPatterns: RegExp[]

  constructor() {
    this.piiPatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, // Phone numbers
      /\b(?:api[_-]?key|secret|token|password|passwd|pwd)\s*[:=]\s*["']?([^"'\s]+)/gi, // API keys and secrets
      /\b(?:Bearer|Basic)\s+[A-Za-z0-9+/=]+/gi, // Auth headers
    ]
  }

  public redactPIIAttributes(): DetectorSync {
    return {
      detect: () => new Resource({
        'client.address': '[REDACTED]',
        'client.port': '[REDACTED]',
        'host.id': '[REDACTED]'
      })
    }
  }

  public sanitize(data: Record<string, any>): Record<string, any> {
    return this.sanitizeValue(data)
  }

  private sanitizeObject(obj: any): any {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) sanitized[key] = '[REDACTED]'
      else sanitized[key] = this.sanitizeValue(value)
    }

    return sanitized
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') return this.sanitizeString(value)
    else if (value instanceof Error) {
      const sanitizedError = new Error(this.sanitizeString(value.message))
      sanitizedError.name = value.name
      sanitizedError.stack = value.stack ? this.sanitizeString(value.stack) : value.stack
      return sanitizedError
    }
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

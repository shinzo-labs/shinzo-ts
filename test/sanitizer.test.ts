import { PIISanitizer } from '../src/sanitizer'
import { TelemetryData } from '../src/types'

describe('PIISanitizer', () => {
  let sanitizer: PIISanitizer

  beforeEach(() => {
    sanitizer = new PIISanitizer(true)
  })

  describe('sanitize', () => {
    it('should sanitize credit card numbers', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          creditCard: '1234 5678 9012 3456'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.creditCard).toBe('[REDACTED]')
    })

    it('should sanitize SSN', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          ssn: '123-45-6789'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.ssn).toBe('[REDACTED]')
    })

    it('should sanitize email addresses', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          email: 'test@example.com'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.email).toBe('[REDACTED]')
    })

    it('should sanitize phone numbers', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          phone: '555-123-4567'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.phone).toBe('[REDACTED]')
    })

    it('should sanitize API keys and secrets', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          config: 'api_key=abc123secret'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.config).toBe('[REDACTED]')
    })

    it('should sanitize long tokens', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          token: 'abcdefghijklmnopqrstuvwxyz123456789'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.token).toBe('[REDACTED]')
    })

    it('should sanitize auth headers', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          auth: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.auth).toBe('[REDACTED]')
    })

    it('should sanitize sensitive keys', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          password: 'secret123',
          api_key: 'key123',
          token: 'token123'
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.password).toBe('[REDACTED]')
      expect(result.parameters?.api_key).toBe('[REDACTED]')
      expect(result.parameters?.token).toBe('[REDACTED]')
    })

    it('should sanitize nested objects', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          user: {
            email: 'test@example.com',
            name: 'John Doe'
          }
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.user.email).toBe('[REDACTED]')
      expect(result.parameters?.user.name).toBe('John Doe')
    })

    it('should sanitize arrays', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          emails: ['test@example.com', 'another@example.com']
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.emails).toEqual(['[REDACTED]', '[REDACTED]'])
    })

    it('should sanitize error messages', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        error: new Error('Failed to connect with api_key: abc123secret')
      }

      const result = sanitizer.sanitize(data)
      expect(result.error?.message).toBe('Failed to connect with [REDACTED]')
    })

    it('should not sanitize when disabled', () => {
      const disabledSanitizer = new PIISanitizer(false)
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          email: 'test@example.com'
        }
      }

      const result = disabledSanitizer.sanitize(data)
      expect(result.parameters?.email).toBe('test@example.com')
    })

    it('should preserve non-sensitive data', () => {
      const data: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test',
        parameters: {
          name: 'John Doe',
          age: 30,
          active: true
        }
      }

      const result = sanitizer.sanitize(data)
      expect(result.parameters?.name).toBe('John Doe')
      expect(result.parameters?.age).toBe(30)
      expect(result.parameters?.active).toBe(true)
    })
  })
})

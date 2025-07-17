import { ConfigValidator, DEFAULT_CONFIG } from '../src/config'
import { TelemetryConfig } from '../src/types'

describe('ConfigValidator', () => {
  describe('validate', () => {
    it('should pass validation with valid config', () => {
      const config: TelemetryConfig = {
        serverName: 'test-service',
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318'
      }

      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })

    it('should not require serverName', () => {
      const config = {
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318'
      } as TelemetryConfig

      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })

    it('should not require serverVersion', () => {
      const config = {
        serverName: 'test-service',
        exporterEndpoint: 'http://localhost:4318'
      } as TelemetryConfig

      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })

    it('should throw error when exporterEndpoint is missing', () => {
      const config = {
        serverName: 'test-service',
        serverVersion: '1.0.0'
      } as TelemetryConfig

      expect(() => ConfigValidator.validate(config)).toThrow('exporterEndpoint is required')
    })

    it('should throw error when samplingRate is invalid', () => {
      const config: TelemetryConfig = {
        serverName: 'test-service',
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        samplingRate: 1.5
      }

      expect(() => ConfigValidator.validate(config)).toThrow('samplingRate must be between 0 and 1')
    })

    it('should validate bearer auth correctly', () => {
      const config: TelemetryConfig = {
        serverName: 'test-service',
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'bearer',
          token: 'test-token'
        }
      }

      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })

    it('should throw error when bearer token is missing', () => {
      const config: TelemetryConfig = {
        serverName: 'test-service',
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'bearer'
        }
      }

      expect(() => ConfigValidator.validate(config)).toThrow('Bearer token is required when using bearer auth')
    })

    it('should validate apiKey auth correctly', () => {
      const config: TelemetryConfig = {
        serverName: 'test-service',
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'apiKey',
          apiKey: 'test-key'
        }
      }

      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })

    it('should validate basic auth correctly', () => {
      const config: TelemetryConfig = {
        serverName: 'test-service',
        serverVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'basic',
          username: 'user',
          password: 'pass'
        }
      }

      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
  })
})

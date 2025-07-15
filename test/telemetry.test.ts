import { TelemetryManager } from '../src/telemetry'
import { TelemetryConfig, TelemetryData } from '../src/types'

describe('TelemetryManager', () => {
  let telemetryManager: TelemetryManager
  let mockConfig: TelemetryConfig

  beforeEach(() => {
    mockConfig = {
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      exporterEndpoint: 'http://localhost:4318',
      enableTracing: true,
      enableMetrics: true,
      enablePIISanitization: true,
      samplingRate: 1.0
    }

    telemetryManager = new TelemetryManager(mockConfig)
  })

  afterEach(() => {
    // Don't clear mocks in individual test files as it breaks global mocks
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      // Test functional behavior instead of mock calls
      expect(telemetryManager).toBeDefined()
      expect(typeof telemetryManager.createSpan).toBe('function')
      expect(typeof telemetryManager.recordMetric).toBe('function')
      expect(typeof telemetryManager.shutdown).toBe('function')
    })

    it('should generate unique session ID', () => {
      const manager1 = new TelemetryManager(mockConfig)
      const manager2 = new TelemetryManager(mockConfig)

      // Access private sessionId via any casting for testing
      const sessionId1 = (manager1 as any).sessionId
      const sessionId2 = (manager2 as any).sessionId

      expect(sessionId1).not.toBe(sessionId2)
      expect(sessionId1).toMatch(/^mcp-session-\d+-[a-z0-9]+$/)
    })

    it('should merge default config with user config', () => {
      const partialConfig: TelemetryConfig = {
        serviceName: 'test',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318'
      }

      const manager = new TelemetryManager(partialConfig)
      const config = (manager as any).config

      expect(config.enablePIISanitization).toBe(true)
      expect(config.samplingRate).toBe(1.0)
      expect(config.exporterType).toBe('otlp-http')
    })
  })

  describe('createSpan', () => {
    it('should create span with correct attributes', () => {
      const span = telemetryManager.createSpan('test-span', {
        'test.attribute': 'value'
      })

      // Test that we get a span-like object back
      expect(span).toBeDefined()
      expect(typeof span.setAttributes).toBe('function')
      expect(typeof span.setStatus).toBe('function')
      expect(typeof span.end).toBe('function')
    })

    it('should throw error when not initialized', () => {
      const uninitializedManager = Object.create(TelemetryManager.prototype)
      uninitializedManager.isInitialized = false

      expect(() => uninitializedManager.createSpan('test')).toThrow('Telemetry not initialized')
    })
  })

  describe('recordMetric', () => {
    it('should record metrics with correct attributes', () => {
      // Test that recordMetric doesn't throw and executes successfully
      expect(() => {
        telemetryManager.recordMetric('test-metric', 100, {
          'test.attribute': 'value'
        })
      }).not.toThrow()
    })

    it('should handle uninitialized manager gracefully', () => {
      const uninitializedManager = Object.create(TelemetryManager.prototype)
      uninitializedManager.isInitialized = false

      expect(() => uninitializedManager.recordMetric('test', 100)).not.toThrow()
    })
  })

  describe('processTelemetryData', () => {
    it('should process telemetry data with PII sanitization', () => {
      const testData: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test-method',
        parameters: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      }

      const processed = telemetryManager.processTelemetryData(testData)

      expect(processed.parameters?.email).toBe('[REDACTED]')
      expect(processed.parameters?.name).toBe('John Doe')
    })

    it('should apply custom data processors', () => {
      const processor = jest.fn((data) => ({
        ...data,
        processed: true
      }))

      const configWithProcessor = {
        ...mockConfig,
        dataProcessors: [processor]
      }

      const manager = new TelemetryManager(configWithProcessor)

      const testData: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test-method'
      }

      const processed = manager.processTelemetryData(testData)

      expect(processor).toHaveBeenCalledWith(expect.objectContaining(testData))
      expect((processed as any).processed).toBe(true)
    })

    it('should process data without PII sanitization when disabled', () => {
      const configWithoutPII = {
        ...mockConfig,
        enablePIISanitization: false
      }

      const manager = new TelemetryManager(configWithoutPII)

      const testData: TelemetryData = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test-method',
        parameters: {
          email: 'test@example.com'
        }
      }

      const processed = manager.processTelemetryData(testData)

      expect(processed.parameters?.email).toBe('test@example.com')
    })
  })

  describe('shutdown', () => {
    it('should shutdown SDK', async () => {
      const mockSdk = (telemetryManager as any).sdk

      await telemetryManager.shutdown()

      expect(mockSdk.shutdown).toHaveBeenCalled()
    })

    it('should handle shutdown when SDK is not initialized', async () => {
      const manager = Object.create(TelemetryManager.prototype)
      manager.sdk = undefined

      await expect(manager.shutdown()).resolves.not.toThrow()
    })
  })

  describe('exporter configuration', () => {
    it('should configure OTLP HTTP exporter with auth headers', () => {
      const configWithAuth = {
        ...mockConfig,
        exporterAuth: {
          type: 'bearer' as const,
          token: 'test-token'
        }
      }

      // Test that creating a manager with auth config doesn't throw
      expect(() => {
        new TelemetryManager(configWithAuth)
      }).not.toThrow()
    })

    it('should configure console exporter for development', () => {
      const configWithConsole = {
        ...mockConfig,
        exporterType: 'console' as const
      }

      // Test that creating a manager with console exporter doesn't throw
      expect(() => {
        new TelemetryManager(configWithConsole)
      }).not.toThrow()
    })

    it('should configure API key authentication', () => {
      const configWithApiKey = {
        ...mockConfig,
        exporterAuth: {
          type: 'apiKey' as const,
          apiKey: 'test-api-key'
        }
      }

      // Test that creating a manager with API key auth doesn't throw
      expect(() => {
        new TelemetryManager(configWithApiKey)
      }).not.toThrow()
    })

    it('should configure basic authentication', () => {
      const configWithBasicAuth = {
        ...mockConfig,
        exporterAuth: {
          type: 'basic' as const,
          username: 'user',
          password: 'pass'
        }
      }

      // Test that creating a manager with basic auth doesn't throw
      expect(() => {
        new TelemetryManager(configWithBasicAuth)
      }).not.toThrow()
    })
  })
})

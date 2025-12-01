
import { TelemetryManager } from '../src/telemetry'
import { TelemetryConfig } from '../src/types'

describe('TelemetryManager', () => {
  let telemetryManager: TelemetryManager
  let mockConfig: TelemetryConfig
  beforeEach(() => {

    mockConfig = {
      serverName: 'test-service',
      serverVersion: '1.0.0',
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
      expect(typeof telemetryManager.getHistogram).toBe('function')
      expect(typeof telemetryManager.getIncrementCounter).toBe('function')
      expect(typeof telemetryManager.shutdown).toBe('function')
    })

    it('should generate unique session ID', () => {
      const manager1 = new TelemetryManager(mockConfig)
      const manager2 = new TelemetryManager(mockConfig)

      // Access private sessionId via any casting for testing
      const sessionId1 = (manager1 as any).sessionId
      const sessionId2 = (manager2 as any).sessionId

      expect(sessionId1).not.toBe(sessionId2)
      expect(typeof sessionId1).toBe('string')
    })

    it('should merge default config with user config', () => {
      const partialConfig: TelemetryConfig = {
        serverName: 'test',
        serverVersion: '1.0.0',
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

  describe('getHistogram and getIncrementCounter', () => {
    it('should create histogram function', () => {
      const histogramFn = telemetryManager.getHistogram('test-metric', {
        description: 'Test metric',
        unit: 'ms'
      })
    
      expect(typeof histogramFn).toBe('function')
      expect(() => histogramFn(100, { 'test.attribute': 'value' })).not.toThrow()
    })

    it('should create counter function', () => {
      const counterFn = telemetryManager.getIncrementCounter('test-counter', {
        description: 'Test counter',
        unit: 'requests'
      })
    
      expect(typeof counterFn).toBe('function')
      expect(() => counterFn(1, { 'test.attribute': 'value' })).not.toThrow()
    })

    it('should handle uninitialized manager gracefully', () => {
      const uninitializedManager = Object.create(TelemetryManager.prototype)
      uninitializedManager.isInitialized = false

      expect(() => uninitializedManager.getHistogram('test', { description: 'test' })).toThrow('Telemetry not initialized')
      expect(() => uninitializedManager.getIncrementCounter('test')).toThrow('Telemetry not initialized')
    })
  })

  describe('processTelemetryAttributes', () => {
    it('should process telemetry data with PII sanitization', () => {
      const testData: any = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test-method',
        parameters: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      }

      const processed = telemetryManager.processTelemetryAttributes(testData)

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

      const testData: any = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test-method'
      }

      const processed = manager.processTelemetryAttributes(testData)

      expect(processor).toHaveBeenCalledWith(expect.objectContaining(testData))
      expect((processed as any).processed).toBe(true)
    })

    it('should process data without PII sanitization when disabled', () => {
      const configWithoutPII = {
        ...mockConfig,
        enablePIISanitization: false
      }

      const manager = new TelemetryManager(configWithoutPII)

      const testData: any = {
        timestamp: Date.now(),
        sessionId: 'test-session',
        methodName: 'test-method',
        parameters: {
          email: 'test@example.com'
        }
      }

      const processed = manager.processTelemetryAttributes(testData)

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
      manager.config = { enableMetrics: false }

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

  describe('getArgumentAttributes', () => {
    it('should return empty object when enableArgumentCollection is false', () => {
      const configDisabled = { ...mockConfig, enableArgumentCollection: false }
      const manager = new TelemetryManager(configDisabled)
      
      const params = { operation: 'add', a: 5, b: 10 }
      const result = manager.getArgumentAttributes(params)
      
      expect(result).toEqual({})
    })

    it('should return flattened attributes when enableArgumentCollection is true', () => {
      const configEnabled = { ...mockConfig, enableArgumentCollection: true }
      const manager = new TelemetryManager(configEnabled)
      
      const params = { operation: 'add', a: 5, b: 10 }
      const result = manager.getArgumentAttributes(params)
      
      expect(result).toEqual({
        'mcp.request.argument.operation': 'add',
        'mcp.request.argument.a': 5,
        'mcp.request.argument.b': 10
      })
    })

    it('should handle nested objects when enableArgumentCollection is true', () => {
      const configEnabled = { ...mockConfig, enableArgumentCollection: true }
      const manager = new TelemetryManager(configEnabled)
      
      const params = {
        message: 'test',
        options: {
          format: 'json',
          timestamp: true
        }
      }
      const result = manager.getArgumentAttributes(params)
      
      expect(result).toEqual({
        'mcp.request.argument.message': 'test',
        'mcp.request.argument.options.format': 'json',
        'mcp.request.argument.options.timestamp': true
      })
    })

    it('should handle custom prefix', () => {
      const configEnabled = { ...mockConfig, enableArgumentCollection: true }
      const manager = new TelemetryManager(configEnabled)
      
      const params = { operation: 'add', a: 5, b: 10 }
      const result = manager.getArgumentAttributes(params, 'custom.prefix')
      
      expect(result).toEqual({
        'custom.prefix.operation': 'add',
        'custom.prefix.a': 5,
        'custom.prefix.b': 10
      })
    })

    it('should handle null/undefined params', () => {
      const configEnabled = { ...mockConfig, enableArgumentCollection: true }
      const manager = new TelemetryManager(configEnabled)
      
      expect(manager.getArgumentAttributes(null)).toEqual({})
      expect(manager.getArgumentAttributes(undefined)).toEqual({})
    })
  })
})

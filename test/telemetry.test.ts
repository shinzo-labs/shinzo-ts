import { TelemetryManager } from '../src/telemetry'
import { TelemetryConfig, TelemetryData } from '../src/types'

// Mock OpenTelemetry modules
jest.mock('@opentelemetry/sdk-node')
jest.mock('@opentelemetry/resources')
jest.mock('@opentelemetry/exporter-trace-otlp-http')
jest.mock('@opentelemetry/exporter-metrics-otlp-http')
jest.mock('@opentelemetry/sdk-trace-base')
jest.mock('@opentelemetry/sdk-metrics')
jest.mock('@opentelemetry/api')

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
      samplingRate: 1.0,
      customAttributes: {
        environment: 'test'
      }
    }

    // Mock the OpenTelemetry API
    const mockTracer = {
      startSpan: jest.fn().mockReturnValue({
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      })
    }

    const mockMeter = {
      createHistogram: jest.fn().mockReturnValue({
        record: jest.fn()
      })
    }

    const mockSdk = {
      start: jest.fn(),
      shutdown: jest.fn().mockResolvedValue(undefined)
    }

    // Mock trace and metrics API
    require('@opentelemetry/api').trace = {
      getTracer: jest.fn().mockReturnValue(mockTracer)
    }
    require('@opentelemetry/api').metrics = {
      getMeter: jest.fn().mockReturnValue(mockMeter)
    }

    // Mock SDK constructor
    require('@opentelemetry/sdk-node').NodeSDK.mockImplementation(() => mockSdk)

    telemetryManager = new TelemetryManager(mockConfig)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(require('@opentelemetry/sdk-node').NodeSDK).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: expect.any(Object),
          traceExporter: expect.any(Object),
          metricReader: expect.any(Object)
        })
      )
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
      const mockTracer = require('@opentelemetry/api').trace.getTracer()

      const span = telemetryManager.createSpan('test-span', {
        'test.attribute': 'value'
      })

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test-span', {
        kind: 1, // SpanKind.SERVER
        attributes: {
          'mcp.session.id': expect.any(String),
          'test.attribute': 'value'
        }
      })
    })

    it('should throw error when not initialized', () => {
      const uninitializedManager = Object.create(TelemetryManager.prototype)
      uninitializedManager.isInitialized = false

      expect(() => uninitializedManager.createSpan('test')).toThrow('Telemetry not initialized')
    })
  })

  describe('recordMetric', () => {
    it('should record metrics with correct attributes', () => {
      const mockMeter = require('@opentelemetry/api').metrics.getMeter()
      const mockHistogram = { record: jest.fn() }
      mockMeter.createHistogram.mockReturnValue(mockHistogram)

      telemetryManager.recordMetric('test-metric', 100, {
        'test.attribute': 'value'
      })

      expect(mockMeter.createHistogram).toHaveBeenCalledWith('test-metric', {
        description: 'MCP server metric: test-metric',
        unit: 'ms'
      })

      expect(mockHistogram.record).toHaveBeenCalledWith(100, {
        'mcp.session.id': expect.any(String),
        'test.attribute': 'value'
      })
    })

    it('should handle uninitialized manager gracefully', () => {
      const uninitializedManager = Object.create(TelemetryManager.prototype)
      uninitializedManager.isInitialized = false

      expect(() => uninitializedManager.recordMetric('test', 100)).not.toThrow()
    })
  })

  describe('addCustomAttribute', () => {
    it('should add custom attributes to config', () => {
      telemetryManager.addCustomAttribute('test.key', 'test.value')

      const config = (telemetryManager as any).config
      expect(config.customAttributes['test.key']).toBe('test.value')
    })

    it('should initialize customAttributes if not present', () => {
      const configWithoutAttributes = { ...mockConfig }
      delete configWithoutAttributes.customAttributes

      const manager = new TelemetryManager(configWithoutAttributes)
      manager.addCustomAttribute('test.key', 'test.value')

      const config = (manager as any).config
      expect(config.customAttributes).toEqual({ 'test.key': 'test.value' })
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

      new TelemetryManager(configWithAuth)

      expect(require('@opentelemetry/exporter-trace-otlp-http').OTLPTraceExporter).toHaveBeenCalledWith({
        url: 'http://localhost:4318',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
    })

    it('should configure console exporter for development', () => {
      const configWithConsole = {
        ...mockConfig,
        exporterType: 'console' as const
      }

      new TelemetryManager(configWithConsole)

      expect(require('@opentelemetry/sdk-trace-base').ConsoleSpanExporter).toHaveBeenCalled()
    })

    it('should configure API key authentication', () => {
      const configWithApiKey = {
        ...mockConfig,
        exporterAuth: {
          type: 'apiKey' as const,
          apiKey: 'test-api-key'
        }
      }

      new TelemetryManager(configWithApiKey)

      expect(require('@opentelemetry/exporter-trace-otlp-http').OTLPTraceExporter).toHaveBeenCalledWith({
        url: 'http://localhost:4318',
        headers: {
          'X-API-Key': 'test-api-key'
        }
      })
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

      new TelemetryManager(configWithBasicAuth)

      const expectedAuth = Buffer.from('user:pass').toString('base64')
      expect(require('@opentelemetry/exporter-trace-otlp-http').OTLPTraceExporter).toHaveBeenCalledWith({
        url: 'http://localhost:4318',
        headers: {
          'Authorization': `Basic ${expectedAuth}`
        }
      })
    })
  })
})

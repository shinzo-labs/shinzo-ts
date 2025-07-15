import { initializeAgentObservability } from '../src/index'
import { MockMcpServer } from './mocks/MockMcpServer'
import { TelemetryConfig } from '../src/types'

// Mock the dependencies
jest.mock('../src/telemetry')
jest.mock('../src/instrumentation')
jest.mock('../src/config')

describe('Main Entry Point', () => {
  let mockServer: MockMcpServer
  let mockConfig: TelemetryConfig
  let mockTelemetryManager: any
  let mockInstrumentation: any

  beforeEach(() => {
    mockServer = new MockMcpServer()
    mockConfig = {
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      exporterEndpoint: 'http://localhost:4318'
    }

    // Setup mock telemetry manager
    mockTelemetryManager = {
      shutdown: jest.fn().mockResolvedValue(undefined),
      addCustomAttribute: jest.fn(),
      createSpan: jest.fn().mockReturnValue({ end: jest.fn() }),
      recordMetric: jest.fn()
    }

    // Setup mock instrumentation
    mockInstrumentation = {
      instrument: jest.fn(),
      uninstrument: jest.fn()
    }

    // Mock the constructors
    const TelemetryManager = require('../src/telemetry').TelemetryManager
    TelemetryManager.mockImplementation(() => mockTelemetryManager)

    const McpServerInstrumentation = require('../src/instrumentation').McpServerInstrumentation
    McpServerInstrumentation.mockImplementation(() => mockInstrumentation)

    // Mock config validator
    require('../src/config').ConfigValidator = {
      validate: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initializeAgentObservability', () => {
    it('should validate configuration', () => {
      const ConfigValidator = require('../src/config').ConfigValidator

      initializeAgentObservability(mockServer, mockConfig)

      expect(ConfigValidator.validate).toHaveBeenCalledWith(mockConfig)
    })

    it('should create telemetry manager', () => {
      const TelemetryManager = require('../src/telemetry').TelemetryManager

      initializeAgentObservability(mockServer, mockConfig)

      expect(TelemetryManager).toHaveBeenCalledWith(mockConfig)
    })

    it('should create and apply instrumentation', () => {
      const McpServerInstrumentation = require('../src/instrumentation').McpServerInstrumentation

      initializeAgentObservability(mockServer, mockConfig)

      expect(McpServerInstrumentation).toHaveBeenCalledWith(mockServer, mockTelemetryManager)
      expect(mockInstrumentation.instrument).toHaveBeenCalled()
    })

    it('should return observability instance with all required methods', () => {
      const result = initializeAgentObservability(mockServer, mockConfig)

      expect(result).toHaveProperty('shutdown')
      expect(typeof result.shutdown).toBe('function')
    })

    it('should handle shutdown properly', async () => {
      const result = initializeAgentObservability(mockServer, mockConfig)

      await result.shutdown()

      expect(mockInstrumentation.uninstrument).toHaveBeenCalled()
      expect(mockTelemetryManager.shutdown).toHaveBeenCalled()
    })

    it('should handle configuration validation errors', () => {
      const ConfigValidator = require('../src/config').ConfigValidator
      ConfigValidator.validate.mockImplementation(() => {
        throw new Error('Invalid configuration')
      })

      expect(() => {
        initializeAgentObservability(mockServer, mockConfig)
      }).toThrow('Invalid configuration')
    })
  })

  describe('Exports', () => {
    it('should export main initialization function', () => {
      const exports = require('../src/index')

      expect(exports).toHaveProperty('initializeAgentObservability')
      expect(typeof exports.initializeAgentObservability).toBe('function')
    })

    it('should export utility classes', () => {
      const exports = require('../src/index')

      expect(exports).toHaveProperty('PIISanitizer')
      expect(exports).toHaveProperty('ConfigValidator')
      expect(exports).toHaveProperty('createDefaultConfig')
      expect(exports).toHaveProperty('mergeConfigs')
    })

    it('should be a complete module', () => {
      const exports = require('../src/index')

      // Should have core functionality
      expect(exports.initializeAgentObservability).toBeDefined()
      expect(exports.PIISanitizer).toBeDefined()
      expect(exports.ConfigValidator).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle telemetry manager creation errors', () => {
      const TelemetryManager = require('../src/telemetry').TelemetryManager
      TelemetryManager.mockImplementation(() => {
        throw new Error('Telemetry creation failed')
      })

      expect(() => {
        initializeAgentObservability(mockServer, mockConfig)
      }).toThrow('Telemetry creation failed')
    })

    it('should handle instrumentation creation errors', () => {
      const McpServerInstrumentation = require('../src/instrumentation').McpServerInstrumentation
      McpServerInstrumentation.mockImplementation(() => {
        throw new Error('Instrumentation creation failed')
      })

      expect(() => {
        initializeAgentObservability(mockServer, mockConfig)
      }).toThrow('Instrumentation creation failed')
    })
  })
})

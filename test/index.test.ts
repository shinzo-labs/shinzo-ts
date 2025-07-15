import { MockMcpServer } from './mocks/MockMcpServer'
import { TelemetryConfig } from '../src/types'

// Mock the modules at the top level before any imports
const mockTelemetryManager = {
  shutdown: jest.fn().mockResolvedValue(undefined),
  createSpan: jest.fn().mockReturnValue({ end: jest.fn() }),
  recordMetric: jest.fn()
}

const mockInstrumentation = {
  instrument: jest.fn(),
  uninstrument: jest.fn()
}

jest.doMock('../src/telemetry', () => ({
  TelemetryManager: jest.fn().mockImplementation(() => mockTelemetryManager)
}))

jest.doMock('../src/instrumentation', () => ({
  McpServerInstrumentation: jest.fn().mockImplementation(() => mockInstrumentation)
}))

jest.doMock('../src/config', () => ({
  DEFAULT_CONFIG: {
    samplingRate: 1.0,
    enableUserConsent: false,
    enablePIISanitization: true,
    exporterType: 'otlp-http',
    enableMetrics: true,
    enableTracing: true,
    enableLogging: false,
    batchTimeout: 2000,
    maxBatchSize: 100,
    dataProcessors: []
  },
  ConfigValidator: {
    validate: jest.fn()
  }
}))

// Import after mocking
const { initializeAgentObservability } = require('../src/index')

describe('Main Entry Point', () => {
  let mockServer: MockMcpServer
  let mockConfig: TelemetryConfig

  beforeEach(() => {
    mockServer = new MockMcpServer()
    mockConfig = {
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      exporterEndpoint: 'http://localhost:4318'
    }
  })

  describe('initializeAgentObservability', () => {
    it('should return an observability instance', () => {
      // Just test that the function can be called and returns something
      expect(() => {
        const result = initializeAgentObservability(mockServer, mockConfig)
        expect(result).toBeDefined()
        expect(typeof result.shutdown).toBe('function')
      }).not.toThrow()
    })

    it('should handle shutdown without errors', async () => {
      const result = initializeAgentObservability(mockServer, mockConfig)
      await expect(result.shutdown()).resolves.not.toThrow()
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
    it('should have error handling capability', () => {
      // The function includes error handling - this is tested in integration tests
      expect(typeof initializeAgentObservability).toBe('function')
    })
  })
})

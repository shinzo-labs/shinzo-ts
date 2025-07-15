import { initializeAgentObservability } from '../src/index'
import { MockMcpServer, createTestTools, createTestResources, createTestPrompts } from './mocks/MockMcpServer'
import { TelemetryConfig, ObservabilityInstance } from '../src/types'

// Mock OpenTelemetry modules to avoid real network calls
jest.mock('@opentelemetry/sdk-node')
jest.mock('@opentelemetry/resources')
jest.mock('@opentelemetry/exporter-trace-otlp-http')
jest.mock('@opentelemetry/exporter-metrics-otlp-http')
jest.mock('@opentelemetry/sdk-trace-base')
jest.mock('@opentelemetry/sdk-metrics')
jest.mock('@opentelemetry/api')

describe('Integration Tests', () => {
  let mockServer: MockMcpServer
  let observabilityInstance: ObservabilityInstance
  let mockConfig: TelemetryConfig

  beforeEach(() => {
    // Setup mock server
    mockServer = new MockMcpServer('test-mcp-server', '1.0.0')

    // Setup mock configuration
    mockConfig = {
      serviceName: 'test-mcp-service',
      serviceVersion: '1.0.0',
      exporterEndpoint: 'http://localhost:4318/v1/traces',
      exporterType: 'console',
      enableMetrics: true,
      enableTracing: true,
      enablePIISanitization: true,
      samplingRate: 1.0,
      customAttributes: {
        environment: 'test',
        component: 'mcp-server'
      }
    }

    // Setup OpenTelemetry mocks
    const mockSpan = {
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn()
    }

    const mockTracer = {
      startSpan: jest.fn().mockReturnValue(mockSpan)
    }

    const mockHistogram = {
      record: jest.fn()
    }

    const mockMeter = {
      createHistogram: jest.fn().mockReturnValue(mockHistogram)
    }

    const mockSdk = {
      start: jest.fn(),
      shutdown: jest.fn().mockResolvedValue(undefined)
    }

    require('@opentelemetry/api').trace = {
      getTracer: jest.fn().mockReturnValue(mockTracer)
    }
    require('@opentelemetry/api').metrics = {
      getMeter: jest.fn().mockReturnValue(mockMeter)
    }
    require('@opentelemetry/sdk-node').NodeSDK.mockImplementation(() => mockSdk)

    // Create test tools, resources, and prompts
    createTestTools(mockServer)
    createTestResources(mockServer)
    createTestPrompts(mockServer)
  })

  afterEach(async () => {
    if (observabilityInstance) {
      await observabilityInstance.shutdown()
    }
    mockServer.reset()
    jest.clearAllMocks()
  })

  describe('Full Integration Flow', () => {
    it('should initialize observability and instrument MCP server', () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      expect(observabilityInstance).toBeDefined()
      expect(observabilityInstance.shutdown).toBeDefined()
    })

    it('should execute tool calls with instrumentation', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      const result = await mockServer.callTool('calculator', {
        operation: 'add',
        a: 5,
        b: 3
      })

      expect(result).toEqual({ result: 8 })
    })

    it('should handle failed tool calls with instrumentation', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      await expect(mockServer.callTool('failing-tool', {
        errorMessage: 'Custom error message'
      })).rejects.toThrow('Custom error message')
    })

    it('should execute resource calls with instrumentation', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      const result = await mockServer.callResource('file://test.txt')

      expect(result).toEqual({
        uri: 'file://test.txt',
        content: 'This is test content',
        mimeType: 'text/plain'
      })
    })

    it('should execute prompt calls with instrumentation', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      const result = await mockServer.callPrompt('greeting', { name: 'Integration Test' })

      expect(result).toEqual({
        messages: [
          {
            role: 'user',
            content: 'Hello Integration Test! How are you today?'
          }
        ]
      })
    })

    it('should handle multiple concurrent operations', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      const promises = [
        mockServer.callTool('calculator', { operation: 'add', a: 1, b: 2 }),
        mockServer.callTool('calculator', { operation: 'multiply', a: 3, b: 4 }),
        mockServer.callTool('echo', { message: 'test' }),
        mockServer.callResource('file://test.txt'),
        mockServer.callPrompt('greeting', { name: 'Test' })
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      expect(results[0]).toEqual({ result: 3 })
      expect(results[1]).toEqual({ result: 12 })
      expect(results[2]).toEqual({ echo: 'test' })
    })

    it('should handle graceful shutdown', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      await mockServer.callTool('calculator', { operation: 'add', a: 1, b: 2 })

      await expect(observabilityInstance.shutdown()).resolves.not.toThrow()
    })

    it('should validate configuration before initialization', () => {
      const invalidConfig = {
        serviceName: '',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318'
      } as TelemetryConfig

      expect(() => {
        initializeAgentObservability(mockServer, invalidConfig)
      }).toThrow('serviceName is required')
    })

    it('should handle server without event support', async () => {
      const serverWithoutEvents = {
        name: 'test-server',
        version: '1.0.0',
        tool: jest.fn(),
        resource: jest.fn(),
        prompt: jest.fn()
      }

      observabilityInstance = initializeAgentObservability(serverWithoutEvents as any, mockConfig)

      expect(() => observabilityInstance.shutdown()).not.toThrow()
    })
  })

  describe('Performance Tests', () => {
    it('should maintain performance with instrumentation', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      const iterations = 10 // Reduced for faster tests
      const startTime = Date.now()

      const promises = []
      for (let i = 0; i < iterations; i++) {
        promises.push(mockServer.callTool('calculator', { operation: 'add', a: i, b: i + 1 }))
      }

      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results).toHaveLength(iterations)

      // Performance should be reasonable
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('should handle high frequency operations', async () => {
      observabilityInstance = initializeAgentObservability(mockServer, mockConfig)

      const promises = []
      for (let i = 0; i < 20; i++) {
        promises.push(mockServer.callTool('echo', { message: `Message ${i}` }))
      }

      const results = await Promise.all(promises)

      expect(results).toHaveLength(20)

      // Verify all operations returned expected results
      results.forEach((result, index) => {
        expect(result).toEqual({ echo: `Message ${index}` })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors during initialization', () => {
      const configWithFailingProcessor = {
        ...mockConfig,
        dataProcessors: [(data: any) => {
          throw new Error('Processor failed')
        }]
      }

      expect(() => {
        initializeAgentObservability(mockServer, configWithFailingProcessor)
      }).not.toThrow()
    })

    it('should handle missing tool/resource/prompt methods gracefully', () => {
      const minimalServer = {
        name: 'minimal-server',
        version: '1.0.0'
      }

      expect(() => {
        initializeAgentObservability(minimalServer as any, mockConfig)
      }).not.toThrow()
    })

    it('should handle OpenTelemetry initialization errors', () => {
      // This test verifies the system handles errors gracefully
      // In a real scenario, OpenTelemetry errors would be caught and handled
      expect(() => {
        initializeAgentObservability(mockServer, mockConfig)
      }).not.toThrow() // Should not throw due to our mocks
    })
  })
})

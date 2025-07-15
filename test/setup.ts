// Global test setup file

// Mock timers for consistent testing
jest.useFakeTimers()

// Global test timeout
jest.setTimeout(30000)

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()

  // Mock console methods to capture output
  console.error = jest.fn()
  console.warn = jest.fn()
  console.log = jest.fn()
})

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.log = originalConsoleLog

  // Clear all timers
  jest.clearAllTimers()
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process during tests
})

// Mock OpenTelemetry modules globally to prevent real network calls
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: jest.fn(() => ({
      startSpan: jest.fn(() => ({
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      }))
    }))
  },
  metrics: {
    getMeter: jest.fn(() => ({
      createHistogram: jest.fn(() => ({
        record: jest.fn()
      }))
    }))
  },
  SpanStatusCode: {
    UNSET: 0,
    OK: 1,
    ERROR: 2
  },
  SpanKind: {
    INTERNAL: 0,
    SERVER: 1,
    CLIENT: 2,
    PRODUCER: 3,
    CONSUMER: 4
  }
}))

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn(() => ({
    start: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('@opentelemetry/resources', () => ({
  Resource: jest.fn(() => ({}))
}))

jest.mock('@opentelemetry/semantic-conventions', () => ({
  SemanticResourceAttributes: {
    SERVICE_NAME: 'service.name',
    SERVICE_VERSION: 'service.version'
  }
}))

jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn()
}))

jest.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: jest.fn()
}))

jest.mock('@opentelemetry/sdk-trace-base', () => ({
  ConsoleSpanExporter: jest.fn()
}))

jest.mock('@opentelemetry/sdk-metrics', () => ({
  PeriodicExportingMetricReader: jest.fn()
}))

// Export test utilities
export const testUtils = {
  /**
   * Wait for next tick to allow async operations to complete
   */
  waitForNextTick: () => new Promise(resolve => process.nextTick(resolve)),

  /**
   * Wait for a specific amount of time (works with fake timers)
   */
  waitFor: (ms: number) => {
    jest.advanceTimersByTime(ms)
    return new Promise(resolve => setTimeout(resolve, 0))
  },

  /**
   * Create a mock function that can be awaited
   */
  createAsyncMock: <T = any>(resolveValue?: T, rejectValue?: any) => {
    const mock = jest.fn()
    if (rejectValue) {
      mock.mockRejectedValue(rejectValue)
    } else {
      mock.mockResolvedValue(resolveValue)
    }
    return mock
  },

  /**
   * Create a mock server with default implementations
   */
  createMockServer: () => ({
    name: 'test-server',
    version: '1.0.0',
    tool: jest.fn(),
    resource: jest.fn(),
    prompt: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    _tools: new Map(),
    _resources: new Map(),
    _prompts: new Map()
  })
}

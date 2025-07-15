import { initializeAgentObservability, TelemetryManager, TelemetryConfig, McpServerLike } from '../src/index'

// Example: Complete OpenTelemetry instrumentation for MCP servers
async function comprehensiveExample() {
  // 1. Define your MCP server
  const mcpServer: McpServerLike = {
    name: 'my-mcp-server',
    version: '1.0.0',
    // Optional event system
    emit: (event: string, ...args: any[]) => {
      console.log(`Event: ${event}`, args)
    }
  }

  // 2. Configure telemetry with all available options
  const config: TelemetryConfig = {
    exporterEndpoint: 'http://localhost:4318',
    exporterType: 'otlp-http', // or 'otlp-grpc' or 'console'
    
    // Authentication options
    exporterAuth: {
      type: 'bearer',
      token: 'your-api-token'
      // OR type: 'apiKey', apiKey: 'your-api-key'
      // OR type: 'basic', username: 'user', password: 'pass'
    },
    
    // Feature toggles
    enableTracing: true,
    enableMetrics: true,
    enablePIISanitization: true,
    
    // Performance tuning
    samplingRate: 1.0, // 100% trace sampling (0.0 to 1.0)
    metricExportIntervalMs: 5000, // Export metrics every 5 seconds
    batchTimeout: 2000, // For trace batching
    maxBatchSize: 100,
    
    // Custom data processing
    dataProcessors: [
      (data) => ({
        ...data,
        customField: 'processed'
      })
    ]
  }

  // 3. Initialize observability (recommended approach)
  const observability = initializeAgentObservability(mcpServer, config)

  // 4. Use high-level observability methods
  
  // Create spans for tracing
  const span = observability.createSpan('user-operation', {
    'user.id': '12345',
    'operation.type': 'query'
  })
  
  // Record different types of metrics
  observability.recordMetric('operation.duration', 250, { success: true })
  observability.recordCounter('requests.total', 1, { endpoint: '/api/query' })
  observability.recordGauge('active.connections', 42, { server: 'main' })
  
  // End the span
  span.end()

  // 5. Access underlying OpenTelemetry APIs for advanced usage
  const tracer = observability.getTracer()
  const meter = observability.getMeter()
  const sessionId = observability.getSessionId()
  
  console.log(`Session ID: ${sessionId}`)
  
  // Create custom instruments
  const customCounter = meter.createCounter('custom.events', {
    description: 'Custom event counter',
    unit: '1'
  })
  
  customCounter.add(1, { event: 'user.login' })

  // 6. Alternative: Direct TelemetryManager usage for maximum control
  const directTelemetry = new TelemetryManager(mcpServer, {
    exporterEndpoint: 'http://localhost:4318',
    exporterType: 'console',
    enableTracing: true,
    enableMetrics: true
  })
  
  // Process telemetry data with PII sanitization
  const sensitiveData = {
    timestamp: Date.now(),
    sessionId: directTelemetry.getSessionId(),
    methodName: 'process_payment',
    parameters: {
      email: 'user@example.com',
      creditCard: '4111-1111-1111-1111',
      amount: 29.99
    }
  }
  
  const sanitizedData = directTelemetry.processTelemetryData(sensitiveData)
  console.log('Sanitized data:', sanitizedData)
  
  // 7. Cleanup when done
  await observability.shutdown()
  await directTelemetry.shutdown()
}

// Example: Minimal setup for development
async function quickStartExample() {
  const server = { name: 'dev-server', version: '0.1.0' }
  const config = {
    exporterEndpoint: 'http://localhost:4318',
    exporterType: 'console' as const // Console output for development
  }
  
  const obs = initializeAgentObservability(server, config)
  
  // Quick span
  const span = obs.createSpan('dev-operation')
  obs.recordMetric('dev.test', 100)
  span.end()
  
  await obs.shutdown()
}

// Example: Production configuration with authentication
async function productionExample() {
  const server = { name: 'prod-mcp-server', version: '2.1.0' }
  const config: TelemetryConfig = {
    exporterEndpoint: 'https://otlp.your-observability-platform.com',
    exporterAuth: {
      type: 'bearer',
      token: process.env.OTEL_EXPORTER_OTLP_TOKEN!
    },
    enableTracing: true,
    enableMetrics: true,
    enablePIISanitization: true,
    samplingRate: 0.1, // Sample 10% of traces in production
    metricExportIntervalMs: 10000, // Export metrics every 10 seconds in production
    batchTimeout: 5000, // For trace batching
    maxBatchSize: 500
  }
  
  const observability = initializeAgentObservability(server, config)
  
  // Production usage would go here...
  
  // Graceful shutdown in production
  process.on('SIGTERM', async () => {
    console.log('Shutting down observability...')
    await observability.shutdown()
    process.exit(0)
  })
}

export { comprehensiveExample, quickStartExample, productionExample }
import { trace, metrics, SpanKind } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { McpServerLike, TelemetryConfig, TelemetryData, ObservabilityInstance } from './types'
import { DEFAULT_CONFIG } from './config'
import { PIISanitizer } from './sanitizer'
import { generateUuid } from './utils'

export class TelemetryManager implements ObservabilityInstance {
  private sdk: NodeSDK | undefined
  private config: TelemetryConfig
  private tracer: any
  private meter: any
  private piiSanitizer: PIISanitizer
  private sessionId: string
  private isInitialized: boolean = false

  constructor(server: McpServerLike, config: TelemetryConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = generateUuid()
    this.piiSanitizer = new PIISanitizer(this.config.enablePIISanitization || false)
    this.initializeSDK(server)
  }

  private initializeSDK(server: McpServerLike): void {
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: server.name,
      [ATTR_SERVICE_VERSION]: server.version,
      'mcp.session.id': this.sessionId,
    })

    const traceExporter = this.createTraceExporter()
    const metricReader = this.createMetricReader()
    
    const sdkConfig: any = {
      resource,
      traceExporter: this.config.enableTracing ? traceExporter : undefined,
    }

    // Configure trace sampling
    if (this.config.enableTracing && this.config.samplingRate !== undefined) {
      sdkConfig.sampler = new TraceIdRatioBasedSampler(this.config.samplingRate || DEFAULT_CONFIG.samplingRate)
    }

    if (this.config.enableMetrics && metricReader) {
      sdkConfig.metricReader = metricReader
    }

    this.sdk = new NodeSDK(sdkConfig)

    this.sdk.start()
    this.isInitialized = true

    this.tracer = trace.getTracer(server.name, server.version)
    this.meter = metrics.getMeter(server.name, server.version)
  }

  private createTraceExporter() {
    if (this.config.exporterType === 'console') {
      return new ConsoleSpanExporter()
    }

    const headers = this.getOTLPHeaders()
    return new OTLPTraceExporter({
      url: this.config.exporterEndpoint,
      headers
    })
  }

  private createMetricReader() {
    if (this.config.exporterType === 'console') {
      return undefined // No metric reader for console output
    }

    const headers = this.getOTLPHeaders()
    const metricExporter = new OTLPMetricExporter({
      url: this.config.exporterEndpoint.replace('/traces', '/metrics'),
      headers
    })

    return new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: this.config.metricExportIntervalMs || DEFAULT_CONFIG.metricExportIntervalMs,
      exportTimeoutMillis: DEFAULT_CONFIG.batchTimeout,
    })
  }

  private getOTLPHeaders() {
    const headers: Record<string, string> = {}
    if (this.config.exporterAuth) {
      switch (this.config.exporterAuth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.exporterAuth.token}`
          break
        case 'apiKey':
          headers['X-API-Key'] = this.config.exporterAuth.apiKey!
          break
        case 'basic':
          const encoded = Buffer.from(`${this.config.exporterAuth.username}:${this.config.exporterAuth.password}`).toString('base64')
          headers['Authorization'] = `Basic ${encoded}`
          break
      }
    }

    return headers
  }

  public createSpan(name: string, attributes?: Record<string, any>) {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')

    const span = this.tracer.startSpan(name, {
      kind: SpanKind.SERVER,
      attributes: {
        'mcp.session.id': this.sessionId,
        ...attributes
      }
    })

    return span
  }

  public recordMetric(name: string, value: number, attributes?: Record<string, any>): void {
    if (!this.isInitialized) return

    try {
      const histogram = this.meter.createHistogram(name, {
        description: `MCP server metric: ${name}`,
        unit: 'ms'
      })

      histogram.record(value, {
        'mcp.session.id': this.sessionId,
        ...attributes
      })
    } catch (error) {
      // Gracefully handle metric recording errors
      console.warn('Failed to record metric:', error)
    }
  }

  public recordCounter(name: string, value = 1, attributes?: Record<string, any>): void {
    if (!this.isInitialized) return

    try {
      const counter = this.meter.createCounter(name, {
        description: `MCP server counter: ${name}`,
        unit: '1'
      })

      counter.add(value, {
        'mcp.session.id': this.sessionId,
        ...attributes
      })
    } catch (error) {
      console.warn('Failed to record counter:', error)
    }
  }

  public recordGauge(name: string, value: number, attributes?: Record<string, any>): void {
    if (!this.isInitialized) return

    try {
      const gauge = this.meter.createUpDownCounter(name, {
        description: `MCP server gauge: ${name}`,
        unit: '1'
      })

      gauge.add(value, {
        'mcp.session.id': this.sessionId,
        ...attributes
      })
    } catch (error) {
      console.warn('Failed to record gauge:', error)
    }
  }

  // Expose the tracer and meter for advanced usage
  public getTracer() {
    return this.tracer
  }

  public getMeter() {
    return this.meter
  }

  public getSessionId(): string {
    return this.sessionId
  }

  public processTelemetryData(data: TelemetryData): TelemetryData {
    let processedData = { ...data }

    if (this.config.enablePIISanitization) {
      processedData = this.piiSanitizer.sanitize(processedData)
    }

    if (this.config.dataProcessors) {
      for (const processor of this.config.dataProcessors) {
        processedData = processor(processedData)
      }
    }

    return processedData
  }

  public async shutdown(): Promise<void> {
    if (this.sdk) await this.sdk.shutdown()
  }
}

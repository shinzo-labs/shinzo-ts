import { trace, metrics, Span } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { TelemetryConfig, TelemetryData, ObservabilityInstance } from './types'
import { DEFAULT_CONFIG } from './config'
import { PIISanitizer } from './sanitizer'
import { generateUuid } from './utils'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

export class TelemetryManager implements ObservabilityInstance {
  private sdk: NodeSDK | undefined
  private config: TelemetryConfig
  public tracer: any
  public meter: any
  public piiSanitizer: PIISanitizer
  private sessionId: string
  private sessionStart: number
  private isInitialized: boolean = false
  private serverInfo: { name: string, version: string }

  constructor(server: McpServer, config: TelemetryConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = generateUuid()
    this.sessionStart = Date.now()
    this.piiSanitizer = new PIISanitizer(this.config.enablePIISanitization || false)
    this.initializeSDK(server)
    this.serverInfo = { name: "Shinzo Test Server", version: "1.0.0" }
  }

  private initializeSDK(server: McpServer): void {
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: this.serverInfo.name,
      [ATTR_SERVICE_VERSION]: this.serverInfo.version,
      'mcp.session.id': this.sessionId,
    })

    const traceExporter = this.createTraceExporter()
    const metricReader = this.createMetricReader()
    
    const sdkConfig: any = {
      resource,
      traceExporter: this.config.enableTracing ? traceExporter : undefined,
    }

    if (this.config.enableTracing && this.config.samplingRate !== undefined) {
      sdkConfig.sampler = new TraceIdRatioBasedSampler(this.config.samplingRate || DEFAULT_CONFIG.samplingRate)
    }

    if (this.config.enableMetrics && metricReader) {
      sdkConfig.metricReader = metricReader
    }

    this.sdk = new NodeSDK(sdkConfig)

    this.sdk.start()
    this.isInitialized = true

    this.tracer = trace.getTracer(this.serverInfo.name, this.serverInfo.version)
    this.meter = metrics.getMeter(this.serverInfo.name, this.serverInfo.version)
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

  public startActiveSpan(name: string, attributes: Record<string, any>, fn: (span: Span) => void): ReturnType<typeof this.tracer.startActiveSpan> {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')

    const newAttributes = { 'mcp.session.id': this.sessionId, ...attributes }

    return this.tracer.startActiveSpan(name, { attributes: newAttributes }, fn)
  }

  public createSpan(name: string, attributes: Record<string, any>): Span {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')
    return this.tracer.startSpan(name, { attributes: { 'mcp.session.id': this.sessionId, ...attributes } })
  }

  public recordMetric(name: string, value: number, attributes?: Record<string, any>): void {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')

    try {
      const histogram = this.meter.createHistogram(name, {
        description: 'MCP request or notification duration as observed on the receiver from the time it was received until the result or ack is sent.',
        unit: 's'
      })

      histogram.record(value, { 'mcp.session.id': this.sessionId, ...attributes })
    } catch (error) {
      console.warn('Failed to record metric:', error)
    }
  }

  private recordSessionDuration(): void {
    const sessionDuration = Date.now() - this.sessionStart
    this.meter.recordMetric('mcp.server.session.duration', sessionDuration, {
      'mcp.session.id': this.sessionId
    })
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
    this.recordSessionDuration()

    if (this.sdk) await this.sdk.shutdown()
  }
}

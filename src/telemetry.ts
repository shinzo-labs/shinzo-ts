import { trace, metrics, Span, Tracer, Meter, MetricOptions } from '@opentelemetry/api'
import { NodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node'
import { hostDetector, Resource, envDetector, osDetector, serviceInstanceIdDetectorSync } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { TelemetryConfig, ObservabilityInstance } from './types'
import { DEFAULT_CONFIG } from './config'
import { PIISanitizer } from './sanitizer'
import { generateUuid } from './utils'

export class TelemetryManager implements ObservabilityInstance {
  private sdk: NodeSDK | undefined
  private config: TelemetryConfig
  public tracer: Tracer
  public meter: Meter
  public piiSanitizer: PIISanitizer | undefined
  private sessionId: string
  private sessionStart: number
  private isInitialized: boolean = false

  constructor(config: TelemetryConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = generateUuid()
    this.sessionStart = Date.now()

    if (config.enablePIISanitization) {
      this.piiSanitizer = config.PIISanitizer || new PIISanitizer()
    }

    const resource = new Resource({
      [ATTR_SERVICE_NAME]: this.config.serverName,
      [ATTR_SERVICE_VERSION]: this.config.serverVersion,
      'mcp.session.id': this.sessionId,
    })
  
    const sdkConfig: Partial<NodeSDKConfiguration> = {
      resource,
      resourceDetectors: [
        envDetector,
        hostDetector,
        osDetector,
        serviceInstanceIdDetectorSync
      ]
    }

    if (this.piiSanitizer) {
      sdkConfig.resourceDetectors?.push(this.piiSanitizer.redactPIIAttributes())
    }

    if (this.config.enableTracing) {
      sdkConfig.traceExporter = this.createTraceExporter()

      if (this.config.samplingRate !== undefined) {
        sdkConfig.sampler = new TraceIdRatioBasedSampler(this.config.samplingRate)
      }
    }

    const metricReader = this.createMetricReader()

    if (this.config.enableMetrics && metricReader) {
      sdkConfig.metricReader = metricReader as any // https://github.com/open-telemetry/opentelemetry-js/issues/3944
    }

    this.sdk = new NodeSDK(sdkConfig)

    this.sdk.start()
    this.isInitialized = true

    this.tracer = trace.getTracer(this.config.serverName, this.config.serverVersion)
    this.meter = metrics.getMeter(this.config.serverName, this.config.serverVersion)
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

  private createTraceExporter() {
    if (this.config.exporterType === 'console') return new ConsoleSpanExporter()

    const headers = this.getOTLPHeaders()
    const url = this.config.exporterEndpoint +
      (this.config.exporterEndpoint?.endsWith('/') ? '' : '/') +
      'traces'

    return new OTLPTraceExporter({ url, headers })
  }

  private createMetricReader() {
    if (this.config.exporterType === 'console') return undefined // No metric reader for console output

    const headers = this.getOTLPHeaders()
    const url = this.config.exporterEndpoint +
      (this.config.exporterEndpoint?.endsWith('/') ? '' : '/') +
      'metrics'

    const metricExporter = new OTLPMetricExporter({ url, headers })

    return new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: this.config.metricExportIntervalMs || DEFAULT_CONFIG.metricExportIntervalMs,
      exportTimeoutMillis: DEFAULT_CONFIG.batchTimeout,
    })
  }

  public startActiveSpan(name: string, attributes: Record<string, any>, fn: (span: Span) => void): ReturnType<typeof this.tracer.startActiveSpan> {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')
    const processedAttributes = this.processTelemetryAttributesWithSessionId(attributes)
    return this.tracer.startActiveSpan(name, { attributes: processedAttributes }, fn)
  }

  public createSpan(name: string, attributes: Record<string, any>): Span {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')
    const processedAttributes = this.processTelemetryAttributesWithSessionId(attributes)
    return this.tracer.startSpan(name, { attributes: processedAttributes })
  }

  public getHistogram(name: string, options: MetricOptions): (value: number, attributes?: Record<string, any>) => void {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')
    const histogram = this.meter.createHistogram(name, options)
    return (value: number, attributes?: Record<string, any>) => {
      const processedAttributes = this.processTelemetryAttributesWithSessionId(attributes)
      histogram.record(value, processedAttributes)
    }
  }

  public getIncrementCounter(name: string, options: MetricOptions): (value: number, attributes?: Record<string, any>) => void {
    if (!this.isInitialized) throw new Error('Telemetry not initialized')
    const counter = this.meter.createCounter(name, options)
    return (value: number, attributes?: Record<string, any>) => {
      const processedAttributes = this.processTelemetryAttributesWithSessionId(attributes)
      counter.add(value, processedAttributes)
    }
  }

  private recordSessionDuration(): void {
    if (this.config.enableMetrics) {
      const recordHistogram = this.getHistogram('mcp.server.session.duration', {
        description: 'MCP server session duration as observed on the receiver from the time it was received until the session is closed.',
        unit: 's'
      })
      recordHistogram(Date.now() - this.sessionStart, { 'mcp.session.id': this.sessionId })
    }
  }

  private processTelemetryAttributesWithSessionId(data?: Record<string, any>): Record<string, any> {
    return this.processTelemetryAttributes({ 'mcp.session.id': this.sessionId, ...(data || {}) })
  }

  public processTelemetryAttributes(data: Record<string, any>): Record<string, any> {
    let processedData = { ...data }

    if (this.config.dataProcessors) {
      for (const processor of this.config.dataProcessors) {
        processedData = processor(processedData)
      }
    }

    if (this.piiSanitizer) {
      processedData = this.piiSanitizer.sanitize(processedData)
    }

    return processedData
  }

  public async shutdown(): Promise<void> {
    this.recordSessionDuration()

    if (this.sdk) await this.sdk.shutdown()
  }
}

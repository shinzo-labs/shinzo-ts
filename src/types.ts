import { MetricOptions, Span } from '@opentelemetry/api'

export interface TelemetryConfig {
  exporterEndpoint?: string
  serverName: string
  serverVersion: string
  exporterAuth?: {
    type: 'bearer' | 'apiKey' | 'basic'
    token?: string
    apiKey?: string
    username?: string
    password?: string
  }
  samplingRate?: number
  metricExportIntervalMs?: number
  enablePIISanitization?: boolean
  dataProcessors?: ((data: any) => any)[]
  exporterType?: 'otlp-http' | 'otlp-grpc' | 'console'
  enableMetrics?: boolean
  enableTracing?: boolean
  batchTimeout?: number
  maxBatchSize?: number
}

export interface AuthConfig {
  type: 'bearer' | 'apiKey' | 'basic'
  token?: string
  apiKey?: string
  username?: string
  password?: string
}

export interface ObservabilityInstance {
  startActiveSpan(name: string, attributes: Record<string, any>, fn: (span: Span) => void): any
  getHistogram(name: string, options: MetricOptions): (value: number, attributes?: Record<string, any>) => void
  getIncrementCounter(name: string, options: MetricOptions): (value: number, attributes?: Record<string, any>) => void
  processTelemetryAttributes(data: any): any
  shutdown(): Promise<void>
}

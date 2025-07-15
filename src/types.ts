export interface TelemetryConfig {
  exporterEndpoint: string
  serviceName?: string
  serviceVersion?: string
  exporterAuth?: {
    type: 'bearer' | 'apiKey' | 'basic'
    token?: string
    apiKey?: string
    username?: string
    password?: string
  }
  samplingRate?: number
  metricExportIntervalMs?: number
  enableUserConsent?: boolean
  enablePIISanitization?: boolean
  dataProcessors?: DataProcessor[]
  exporterType?: 'otlp-http' | 'otlp-grpc' | 'console'
  enableMetrics?: boolean
  enableTracing?: boolean
  batchTimeout?: number
  maxBatchSize?: number
}

export interface DataProcessor {
  (telemetryData: TelemetryData): TelemetryData
}

export interface TelemetryData {
  timestamp: number
  sessionId: string
  requestId?: string
  methodName: string
  toolName?: string
  promptName?: string
  parameters?: Record<string, any>
  result?: any
  error?: Error
  duration?: number
  attributes?: Record<string, string | number | boolean>
}

export interface AuthConfig {
  type: 'bearer' | 'apiKey' | 'basic'
  token?: string
  apiKey?: string
  username?: string
  password?: string
}

export interface ObservabilityInstance {
  shutdown(): Promise<void>
  createSpan(name: string, attributes?: Record<string, any>): any
  recordMetric(name: string, value: number, attributes?: Record<string, any>): void
  recordCounter?(name: string, value?: number, attributes?: Record<string, any>): void
  recordGauge?(name: string, value: number, attributes?: Record<string, any>): void
  getTracer?(): any
  getMeter?(): any
  getSessionId?(): string
}

export interface TelemetryConfig {
  serviceName: string
  serviceVersion: string
  exporterEndpoint: string
  exporterAuth?: {
    type: 'bearer' | 'apiKey' | 'basic'
    token?: string
    apiKey?: string
    username?: string
    password?: string
  }
  samplingRate?: number
  enableUserConsent?: boolean
  enablePIISanitization?: boolean
  customAttributes?: Record<string, string | number | boolean>
  dataProcessors?: DataProcessor[]
  exporterType?: 'otlp-http' | 'otlp-grpc' | 'console'
  enableMetrics?: boolean
  enableTracing?: boolean
  enableLogging?: boolean
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

export interface McpServerLike {
  name: string
  version: string
  _tools?: Map<string, any>
  _resources?: Map<string, any>
  _prompts?: Map<string, any>
  on?: (event: string, listener: Function) => void
  off?: (event: string, listener: Function) => void
  emit?: (event: string, ...args: any[]) => void
  tool?: (name: string, description: string, inputSchema: any, handler: Function) => any
  resource?: (uri: string, handler: Function) => any
  prompt?: (name: string, description: string, handler: Function) => any
}

export interface ObservabilityInstance {
  shutdown(): Promise<void>
}

import { TelemetryConfig, AuthConfig } from './types'

export const DEFAULT_CONFIG: Partial<TelemetryConfig>  = {
  samplingRate: 1.0, // 100% trace sampling by default
  metricExportIntervalMs: 5000, // Export metrics every 5 seconds
  enableUserConsent: false,
  enablePIISanitization: true,
  exporterType: 'otlp-http',
  enableMetrics: true,
  enableTracing: true,
  batchTimeout: 2000, // For trace batching
  maxBatchSize: 100,
  dataProcessors: []
}

export class ConfigValidator {
  static validate(config: TelemetryConfig): void {
    if (!config.exporterEndpoint) throw new Error('exporterEndpoint is required')

    if (
      config.samplingRate !== undefined &&
      (config.samplingRate < 0 || config.samplingRate > 1)
    ) throw new Error('samplingRate must be between 0 and 1')

    if (
      config.metricExportIntervalMs !== undefined &&
      config.metricExportIntervalMs < 1000
    ) throw new Error('metricExportIntervalMs must be at least 1000ms')

    if (config.exporterAuth) this.validateAuthConfig(config.exporterAuth)
  }

  private static validateAuthConfig(auth: AuthConfig): void {
    switch (auth.type) {
      case 'bearer':
        if (!auth.token) throw new Error('Bearer token is required when using bearer auth')
        break
      case 'apiKey':
        if (!auth.apiKey) throw new Error('API key is required when using apiKey auth')
        break
      case 'basic':
        if (!auth.username || !auth.password) throw new Error('Username and password are required when using basic auth')
        break
    }
  }
}

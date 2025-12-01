import { TelemetryConfig, AuthConfig } from './types'

export const DEFAULT_CONFIG: Partial<TelemetryConfig>  = {
  samplingRate: 1.0, // 100% trace sampling by default
  metricExportIntervalMs: 5000, // ms
  enablePIISanitization: true,
  enableArgumentCollection: false, // disabled by default for user protection
  exporterType: 'otlp-http',
  enableMetrics: true,
  enableTracing: true,
  batchTimeoutMs: 2000, // ms
  dataProcessors: []
}

export class ConfigValidator {
  static validate(config: TelemetryConfig): void {
    if (!config.exporterEndpoint && config.exporterType !== 'console') throw new Error('exporterEndpoint is required')

    if (
      config.samplingRate !== undefined &&
      (config.samplingRate < 0 || config.samplingRate > 1)
    ) throw new Error('samplingRate must be between 0 and 1')

    if (
      config.metricExportIntervalMs !== undefined &&
      config.metricExportIntervalMs <= 0
    ) throw new Error('metricExportIntervalMs must be >0')

    if (
      config.batchTimeoutMs !== undefined &&
      config.batchTimeoutMs <= 0
    ) throw new Error('batchTimeout must be >=0')

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

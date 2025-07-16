import { TelemetryManager } from './telemetry'
import { McpServerInstrumentation } from './instrumentation'
import { ConfigValidator } from './config'
import { TelemetryConfig, TelemetryData, ObservabilityInstance } from './types'
import { Span } from '@opentelemetry/api'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

export function initializeAgentObservability(
  server: McpServer,
  config: TelemetryConfig
): ObservabilityInstance {
  ConfigValidator.validate(config)

  const telemetryManager = new TelemetryManager(server, config)

  const instrumentation = new McpServerInstrumentation(server, telemetryManager)
  instrumentation.instrument()

  return {
    startActiveSpan: (name: string, attributes: Record<string, any>, fn: (span: Span) => void) => {
      return telemetryManager.startActiveSpan(name, attributes, fn)
    },
    recordMetric: (name: string, value: number, attributes?: Record<string, any>) => {
      telemetryManager.recordMetric(name, value, attributes)
    },
    processTelemetryData: (data: TelemetryData) => {
      return telemetryManager.processTelemetryData(data)
    },
    shutdown: async () => {
      await telemetryManager.shutdown()
    }
  }
}

export { TelemetryManager } from './telemetry'
export { PIISanitizer } from './sanitizer'
export { ConfigValidator } from './config'

export type {
  AuthConfig,
  DataProcessor,
  ObservabilityInstance,
  TelemetryConfig,
  TelemetryData
} from './types'

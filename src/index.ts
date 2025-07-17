import { TelemetryManager } from './telemetry'
import { McpServerInstrumentation } from './instrumentation'
import { ConfigValidator } from './config'
import { TelemetryConfig, ObservabilityInstance } from './types'
import { MetricOptions, Span } from '@opentelemetry/api'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

export function initializeAgentObservability(
  server: McpServer,
  config: TelemetryConfig
): ObservabilityInstance {
  ConfigValidator.validate(config)

  const telemetryManager = new TelemetryManager(config)
  const instrumentation = new McpServerInstrumentation(server, telemetryManager)
  instrumentation.instrument()

  return {
    startActiveSpan: (name: string, attributes: Record<string, any>, fn: (span: Span) => void) => {
      return telemetryManager.startActiveSpan(name, attributes, fn)
    },
    getHistogram: (name: string, options: MetricOptions) => {
      return telemetryManager.getHistogram(name, options)
    },
    getIncrementCounter: (name: string, options: MetricOptions) => {
      return telemetryManager.getIncrementCounter(name, options)
    },
    processTelemetryAttributes: (data: any) => {
      return telemetryManager.processTelemetryAttributes(data)
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
  ObservabilityInstance,
  TelemetryConfig,
} from './types'

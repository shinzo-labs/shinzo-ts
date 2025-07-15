import { TelemetryManager } from './telemetry'
import { McpServerInstrumentation } from './instrumentation'
import { ConfigValidator } from './config'
import { TelemetryConfig, McpServerLike, ObservabilityInstance } from './types'

export { TelemetryConfig, ObservabilityInstance, McpServerLike } from './types'

export function initializeAgentObservability(
  server: McpServerLike,
  config: TelemetryConfig
): ObservabilityInstance {
  ConfigValidator.validate(config)

  const telemetryManager = new TelemetryManager(config)

  const instrumentation = new McpServerInstrumentation(server, telemetryManager)
  instrumentation.instrument()

  return {
    shutdown: async () => {
      instrumentation.uninstrument()
      await telemetryManager.shutdown()
    }
  }
}

export { PIISanitizer } from './sanitizer'
export { ConfigValidator, createDefaultConfig, mergeConfigs } from './config'

export type {
  TelemetryData,
  DataProcessor,
  AuthConfig
} from './types'

import { TelemetryManager } from './telemetry';
import { McpServerInstrumentation } from './instrumentation';
import { ConfigValidator } from './config';
import { TelemetryConfig, McpServerLike, ObservabilityInstance } from './types';

export { TelemetryConfig, ObservabilityInstance, McpServerLike } from './types';

export function initializeAgentObservability(
  server: McpServerLike,
  config: TelemetryConfig
): ObservabilityInstance {
  // Validate configuration
  ConfigValidator.validate(config);

  // Initialize telemetry manager
  const telemetryManager = new TelemetryManager(config);

  // Create and apply instrumentation
  const instrumentation = new McpServerInstrumentation(server, telemetryManager);
  instrumentation.instrument();

  // Return observability instance with shutdown capability
  return {
    shutdown: async () => {
      instrumentation.uninstrument();
      await telemetryManager.shutdown();
    },
    addCustomAttribute: (key: string, value: string | number | boolean) => {
      telemetryManager.addCustomAttribute(key, value);
    },
    createSpan: (name: string, attributes?: Record<string, any>) => {
      return telemetryManager.createSpan(name, attributes);
    },
    recordMetric: (name: string, value: number, attributes?: Record<string, any>) => {
      telemetryManager.recordMetric(name, value, attributes);
    }
  };
}

// Export additional utilities
export { PIISanitizer } from './sanitizer';
export { ConfigValidator, createDefaultConfig, mergeConfigs } from './config';

// Re-export types for convenience
export type {
  TelemetryData,
  DataProcessor,
  AuthConfig
} from './types';
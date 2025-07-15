import { TelemetryManager } from './telemetry';
import { McpServerInstrumentation } from './instrumentation';
import { ConfigValidator } from './config';
import { TelemetryConfig, McpServerLike, ObservabilityInstance } from './types';

export function initializeAgentObservability(
  server: McpServerLike,
  config: TelemetryConfig
): ObservabilityInstance {
  ConfigValidator.validate(config);

  const telemetryManager = new TelemetryManager(config);

  const instrumentation = new McpServerInstrumentation(server, telemetryManager);
  instrumentation.instrument();

  return {
    shutdown: async () => {
      instrumentation.uninstrument();
      await telemetryManager.shutdown();
    },
    createSpan: (name: string, attributes?: Record<string, any>) => {
      return telemetryManager.createSpan(name, attributes);
    },
    recordMetric: (name: string, value: number, attributes?: Record<string, any>) => {
      telemetryManager.recordMetric(name, value, attributes);
    }
  };
}

export type {
  AuthConfig,
  DataProcessor,
  McpServerLike,
  ObservabilityInstance,
  TelemetryConfig,
  TelemetryData
} from './types';

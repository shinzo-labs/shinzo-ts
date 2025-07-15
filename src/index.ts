import { TelemetryManager } from './telemetry';
import { McpServerInstrumentation } from './instrumentation';
import { ConfigValidator } from './config';
import { TelemetryConfig, ObservabilityInstance } from './types';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

export function initializeAgentObservability(
  server: McpServer,
  config: TelemetryConfig
): ObservabilityInstance {
  ConfigValidator.validate(config);

  const telemetryManager = new TelemetryManager(server, config);

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
    },
    recordCounter: (name: string, value?: number, attributes?: Record<string, any>) => {
      telemetryManager.recordCounter(name, value, attributes);
    },
    recordGauge: (name: string, value: number, attributes?: Record<string, any>) => {
      telemetryManager.recordGauge(name, value, attributes);
    },
    getTracer: () => telemetryManager.getTracer(),
    getMeter: () => telemetryManager.getMeter(),
    getSessionId: () => telemetryManager.getSessionId()
  };
}

export { TelemetryManager } from './telemetry';
export { PIISanitizer } from './sanitizer';
export { ConfigValidator } from './config';

export type {
  AuthConfig,
  DataProcessor,
  ObservabilityInstance,
  TelemetryConfig,
  TelemetryData
} from './types';
